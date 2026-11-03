from pathlib import Path

import duckdb
import numpy as np
import pandas as pd

from pipeline.ipf import AGE_GROUPS, EDUCATION, GENDERS, LANGUAGES

SURVEY_QUERY = """
SELECT o.category, r.fed13, r.age_group, r.gender, r.education, r.language
FROM analytics.mrp_outcomes AS o
JOIN staging.respondents AS r USING (respondent_id)
WHERE o.question = ? AND r.fed13 IS NOT NULL AND r.education IS NOT NULL
"""


def load_survey(database: Path, question: str) -> tuple[pd.DataFrame, list[int]]:
    with duckdb.connect(database, read_only=True) as con:
        survey = con.execute(SURVEY_QUERY, [question]).df()
        ridings = con.sql("SELECT DISTINCT fed13 FROM analytics.census_cells ORDER BY fed13")
        return survey, [row[0] for row in ridings.fetchall()]


def encode(frame: pd.DataFrame, ridings: list[int]) -> dict[str, np.ndarray]:
    # Levels come from the census so that the same codes index the poststratification cells,
    # including ridings with no respondent.
    levels = {
        "age_group": AGE_GROUPS,
        "gender": GENDERS,
        "education": EDUCATION,
        "language": LANGUAGES,
        "fed13": ridings,
    }
    codes = {
        column: pd.Categorical(frame[column], categories=values).codes
        for column, values in levels.items()
    }
    if any((values < 0).any() for values in codes.values()):
        raise ValueError("Some respondents have a level that is not in the census cells")
    return codes


def riding_provinces(ridings: list[int]) -> np.ndarray:
    # The first two digits of a riding code are the province code.
    provinces = sorted({fed13 // 1000 for fed13 in ridings})
    return np.array([provinces.index(fed13 // 1000) for fed13 in ridings])


def category_order(categories: pd.Series) -> list[str]:
    # The most frequent category is the reference of the multinomial model; a rare one such as
    # the Bloc (zero outside Quebec) would make every other coefficient unstable.
    return categories.value_counts().index.tolist()
