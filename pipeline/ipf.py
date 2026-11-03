from pathlib import Path

import duckdb
import numpy as np
import pandas as pd

from pipeline.load import DATABASE

AGE_GROUPS = ["18-19", "20-24", "25-34", "35-44", "45-54", "55-64", "65-74", "75+"]
GENDERS = ["man_plus", "woman"]
EDUCATION = ["none", "secondary", "below_bachelor", "bachelor_plus"]
LANGUAGES = ["english", "french", "other"]
PAST_VOTES = ["LPC", "CPC", "NDP", "BQ", "OTH", "NONE"]
MAX_ITERATIONS = 200
TOLERANCE = 1e-8


def to_array(frame: pd.DataFrame, dimensions: dict[str, list]) -> np.ndarray:
    index = pd.MultiIndex.from_product(dimensions.values(), names=dimensions.keys())
    counts = frame.set_index(list(dimensions))["n"].reindex(index, fill_value=0)
    return counts.to_numpy(dtype=float).reshape([len(values) for values in dimensions.values()])


def safe_ratio(target: np.ndarray, current: np.ndarray) -> np.ndarray:
    return np.divide(target, current, out=np.zeros_like(target), where=current > 0)


def rake(
    seed: np.ndarray,
    age_gender_language: np.ndarray,
    gender_education: np.ndarray,
    riding_past_vote: np.ndarray,
) -> np.ndarray:
    # Axes: riding, age, gender, education, language, past vote.
    cells = seed.copy()
    for _ in range(MAX_ITERATIONS):
        cells *= safe_ratio(age_gender_language, cells.sum(axis=(3, 5)))[:, :, :, None, :, None]
        cells *= safe_ratio(gender_education, cells.sum(axis=(1, 4, 5)))[:, None, :, :, None, None]
        cells *= safe_ratio(riding_past_vote, cells.sum(axis=(1, 2, 3, 4)))[:, None, None, None, None, :]
        gap = max(
            np.abs(cells.sum(axis=(3, 5)) - age_gender_language).max(),
            np.abs(cells.sum(axis=(1, 4, 5)) - gender_education).max(),
        )
        if gap < TOLERANCE * age_gender_language.max():
            return cells
    raise RuntimeError(f"Raking did not converge (gap {gap:.1f})")


def past_vote_given_age(con: duckdb.DuckDBPyConnection, provinces: list[int]) -> np.ndarray:
    # The census has no vote, so the link between age and turnout comes from the survey, by
    # province. Half a respondent is added to every cell so that none starts at zero.
    respondents = con.sql("""
        SELECT fed13 // 1000 AS province_code, age_group, past_vote, count(*) AS n
        FROM staging.respondents
        WHERE fed13 IS NOT NULL AND past_vote IS NOT NULL
        GROUP BY ALL
    """).df()
    counts = to_array(
        respondents,
        {"province_code": provinces, "age_group": AGE_GROUPS, "past_vote": PAST_VOTES},
    )
    counts += 0.5
    return counts / counts.sum(axis=2, keepdims=True)


def build_census_cells(database: Path) -> None:
    with duckdb.connect(database) as con:
        language = con.sql("FROM staging.census_age_gender_language").df()
        education = con.sql("FROM staging.census_education_gender").df()
        province = con.sql("FROM staging.census_province_education").df()
        ridings = sorted(language["fed13"].unique())

        age_gender_language = to_array(
            language,
            {"fed13": ridings, "age_group": AGE_GROUPS, "gender": GENDERS, "language": LANGUAGES},
        )
        gender_education = to_array(
            education, {"fed13": ridings, "gender": GENDERS, "education": EDUCATION}
        )
        # Education counts cover everyone aged 15+ (25% sample); rescale them to the adult
        # total of each riding and gender.
        adults = age_gender_language.sum(axis=(1, 3))
        gender_education *= safe_ratio(adults, gender_education.sum(axis=2))[:, :, None]

        provinces = sorted(province["province_code"].unique())
        province_structure = to_array(
            province,
            {
                "province_code": provinces,
                "age_group": AGE_GROUPS,
                "gender": GENDERS,
                "education": EDUCATION,
            },
        )
        riding_province = [provinces.index(fed13 // 1000) for fed13 in ridings]
        seed = np.repeat(province_structure[riding_province][..., None], len(LANGUAGES), axis=4)
        past_vote = past_vote_given_age(con, provinces)[riding_province]
        seed = seed[..., None] * past_vote[:, :, None, None, None, :]

        # 2021 shares are over electors; applying them to all adults treats non-citizens like
        # the electors of their riding.
        past_vote_shares = to_array(
            con.sql("SELECT fed13, past_vote, share AS n FROM analytics.past_vote_fed").df(),
            {"fed13": ridings, "past_vote": PAST_VOTES},
        )
        riding_past_vote = past_vote_shares * adults.sum(axis=1)[:, None]

        cells = rake(seed, age_gender_language, gender_education, riding_past_vote)

        index = pd.MultiIndex.from_product(
            [ridings, AGE_GROUPS, GENDERS, EDUCATION, LANGUAGES, PAST_VOTES],
            names=["fed13", "age_group", "gender", "education", "language", "past_vote"],
        )
        con.register("cells", pd.DataFrame({"n": cells.ravel()}, index=index).reset_index())
        con.execute("CREATE SCHEMA IF NOT EXISTS analytics")
        con.execute("CREATE OR REPLACE TABLE analytics.census_cells AS FROM cells")


if __name__ == "__main__":
    build_census_cells(DATABASE)
