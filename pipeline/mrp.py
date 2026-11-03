import sys
from pathlib import Path

import duckdb
import jax
import jax.numpy as jnp
import numpy as np
import numpyro
import numpyro.distributions as dist
import pandas as pd
from numpyro.infer import MCMC, NUTS

from pipeline.ipf import AGE_GROUPS, EDUCATION, GENDERS, LANGUAGES, PAST_VOTES
from pipeline.load import DATABASE, run_scripts

N_CHAINS = 4
N_WARMUP = 500
N_SAMPLES = 500
N_DRAWS = 100
SEED = 2025

# JAX sees a single CPU device by default; one device per chain lets the chains run in parallel.
# This must run before JAX first uses the CPU.
numpyro.set_host_device_count(N_CHAINS)

SURVEY_QUERY = """
SELECT o.category, r.fed13, r.age_group, r.gender, r.education, r.language, r.past_vote
FROM analytics.mrp_outcomes AS o
JOIN staging.respondents AS r USING (respondent_id)
WHERE o.question = ?
    AND r.fed13 IS NOT NULL
    AND r.education IS NOT NULL
    AND r.past_vote IS NOT NULL
"""

# Past vote is sorted last so that each group of consecutive rows is one demographic cell.
CELLS_QUERY = """
SELECT fed13, age_group, gender, education, language, past_vote, n
FROM analytics.census_cells
ORDER BY fed13, age_group, gender, education, language, past_vote
"""


def load_survey(database: Path, question: str) -> tuple[pd.DataFrame, list[int]]:
    with duckdb.connect(database, read_only=True) as con:
        survey = con.execute(SURVEY_QUERY, [question]).df()
        ridings = con.sql("SELECT DISTINCT fed13 FROM analytics.census_cells ORDER BY fed13")
        return survey, [row[0] for row in ridings.fetchall()]


def load_cells(database: Path) -> pd.DataFrame:
    with duckdb.connect(database, read_only=True) as con:
        return con.sql(CELLS_QUERY).df()


def load_predictors(database: Path, ridings: list[int]) -> np.ndarray:
    with duckdb.connect(database, read_only=True) as con:
        predictors = con.sql("FROM analytics.fed_predictors").df().set_index("fed13")
    if not set(ridings) <= set(predictors.index):
        raise ValueError("Some ridings have no predictors in analytics.fed_predictors")
    # Rows follow the riding codes used by encode().
    return predictors.loc[ridings].to_numpy()


def group_levels(ridings: list[int]) -> dict[str, list]:
    # Levels come from the census so that the same codes index the poststratification cells,
    # including ridings with no respondent.
    return {
        "age_group": AGE_GROUPS,
        "gender": GENDERS,
        "education": EDUCATION,
        "language": LANGUAGES,
        "past_vote": PAST_VOTES,
        "fed13": ridings,
    }


def encode(frame: pd.DataFrame, ridings: list[int]) -> dict[str, np.ndarray]:
    codes = {
        column: pd.Categorical(frame[column], categories=values).codes
        for column, values in group_levels(ridings).items()
    }
    if any((values < 0).any() for values in codes.values()):
        raise ValueError("Some respondents have a level that is not in the census cells")
    codes["province"] = riding_provinces(ridings)[codes["fed13"]]
    return codes


def effect_sizes(ridings: list[int]) -> dict[str, int]:
    sizes = {group: len(values) for group, values in group_levels(ridings).items()}
    sizes["province"] = len(provinces(ridings))
    return sizes


def provinces(ridings: list[int]) -> list[int]:
    # The first two digits of a riding code are the province code.
    return sorted({fed13 // 1000 for fed13 in ridings})


def riding_provinces(ridings: list[int]) -> np.ndarray:
    codes = provinces(ridings)
    return np.array([codes.index(fed13 // 1000) for fed13 in ridings])


def category_order(categories: pd.Series) -> list[str]:
    # The most frequent category is the reference of the multinomial model; a rare one such as
    # the Bloc (zero outside Quebec) would make every other coefficient unstable.
    return categories.value_counts().index.tolist()


def category_logits(
    intercept: jnp.ndarray, effects: dict[str, jnp.ndarray], codes: dict[str, np.ndarray]
) -> jnp.ndarray:
    logits = intercept + sum(effect[codes[group]] for group, effect in effects.items())
    reference = jnp.zeros((logits.shape[0], 1))
    return jnp.concatenate([reference, logits], axis=1)


def model(
    codes: dict[str, np.ndarray],
    group_sizes: dict[str, int],
    predictors: np.ndarray,
    n_categories: int,
    outcome: np.ndarray | None = None,
) -> None:
    # Multinomial logit: category 0 is the reference, so each effect has one column per other
    # category. Random effects are non-centered (z * sigma), which helps NUTS when a group has
    # few respondents, as in most ridings.
    n_effects = n_categories - 1
    intercept = numpyro.sample("intercept", dist.Normal(0, 2).expand([n_effects]))
    effects = {}
    for group, size in group_sizes.items():
        sigma = numpyro.sample(f"sigma_{group}", dist.HalfNormal(1).expand([n_effects]))
        z = numpyro.sample(f"z_{group}", dist.Normal(0, 1).expand([size, n_effects]))
        effects[group] = z * sigma
    # Riding predictors shift each riding's effect, so that ridings with few respondents are
    # pulled toward similar ridings rather than toward the national mean.
    beta = numpyro.sample("beta_fed13", dist.Normal(0, 1).expand([predictors.shape[1], n_effects]))
    effects["fed13"] = effects["fed13"] + predictors @ beta
    logits = category_logits(intercept, effects, codes)
    with numpyro.plate("respondents", logits.shape[0]):
        numpyro.sample("outcome", dist.Categorical(logits=logits), obs=outcome)


def fit(
    codes: dict[str, np.ndarray],
    group_sizes: dict[str, int],
    predictors: np.ndarray,
    n_categories: int,
    outcome: np.ndarray,
) -> MCMC:
    mcmc = MCMC(
        NUTS(model),
        num_warmup=N_WARMUP,
        num_samples=N_SAMPLES,
        num_chains=N_CHAINS,
        chain_method="parallel",
        progress_bar=True,
    )
    mcmc.run(jax.random.PRNGKey(SEED), codes, group_sizes, predictors, n_categories, outcome)
    return mcmc


def past_vote_weights(cells: pd.DataFrame) -> np.ndarray:
    counts = cells["n"].to_numpy().reshape(-1, len(PAST_VOTES))
    totals = counts.sum(axis=1, keepdims=True)
    return np.divide(counts, totals, out=np.zeros_like(counts), where=totals > 0)


def predict_probabilities(
    samples: dict[str, jnp.ndarray],
    group_sizes: dict[str, int],
    predictors: np.ndarray,
    codes: dict[str, np.ndarray],
    weights: np.ndarray,
) -> np.ndarray:
    # Evenly spaced draws across all chains keep the posterior spread in a smaller output.
    kept = np.linspace(0, len(samples["intercept"]) - 1, N_DRAWS).astype(int)
    probabilities = []
    for draw in kept:
        effects = {
            group: samples[f"z_{group}"][draw] * samples[f"sigma_{group}"][draw]
            for group in group_sizes
        }
        effects["fed13"] = effects["fed13"] + predictors @ samples["beta_fed13"][draw]
        logits = category_logits(samples["intercept"][draw], effects, codes)
        by_past_vote = jax.nn.softmax(logits, axis=1).reshape(*weights.shape, -1)
        # Past vote only corrects the sample; it is averaged out with the census weights so
        # that the draws keep one row per demographic cell.
        probabilities.append((by_past_vote * weights[:, :, None]).sum(axis=1))
    # Axes: draw, demographic cell, category.
    return np.stack(probabilities)


def draws_frame(
    question: str, cells: pd.DataFrame, categories: list[str], probabilities: np.ndarray
) -> pd.DataFrame:
    n_draws, n_cells, n_categories = probabilities.shape
    draw = np.repeat(np.arange(n_draws), n_cells * n_categories)
    cell = np.tile(np.repeat(np.arange(n_cells), n_categories), n_draws)
    return pd.DataFrame(
        {
            "question": question,
            "draw": draw,
            "fed13": cells["fed13"].to_numpy()[cell],
            "age_group": cells["age_group"].to_numpy()[cell],
            "gender": cells["gender"].to_numpy()[cell],
            "education": cells["education"].to_numpy()[cell],
            "language": cells["language"].to_numpy()[cell],
            "category": np.tile(categories, n_draws * n_cells),
            "probability": probabilities.reshape(-1),
        }
    )


def save_draws(database: Path, draws: pd.DataFrame) -> None:
    question = draws["question"].iloc[0]
    with duckdb.connect(database) as con:
        con.register("draws", draws)
        con.execute("CREATE SCHEMA IF NOT EXISTS analytics")
        con.execute("""
            CREATE TABLE IF NOT EXISTS analytics.mrp_draws (
                question VARCHAR,
                draw INTEGER,
                fed13 INTEGER,
                age_group VARCHAR,
                gender VARCHAR,
                education VARCHAR,
                language VARCHAR,
                category VARCHAR,
                probability DOUBLE
            )
        """)
        con.execute("DELETE FROM analytics.mrp_draws WHERE question = ?", [question])
        con.execute("INSERT INTO analytics.mrp_draws SELECT * FROM draws")


def fit_question(database: Path, question: str) -> None:
    survey, ridings = load_survey(database, question)
    cells = load_cells(database)
    categories = category_order(survey["category"])
    sizes = effect_sizes(ridings)
    predictors = load_predictors(database, ridings)
    outcome = pd.Categorical(survey["category"], categories=categories).codes
    mcmc = fit(encode(survey, ridings), sizes, predictors, len(categories), outcome)
    probabilities = predict_probabilities(
        mcmc.get_samples(), sizes, predictors, encode(cells, ridings), past_vote_weights(cells)
    )
    demographic_cells = cells.iloc[:: len(PAST_VOTES)]
    save_draws(database, draws_frame(question, demographic_cells, categories, probabilities))


if __name__ == "__main__":
    question = sys.argv[1] if len(sys.argv) > 1 else "vote_post"
    fit_question(DATABASE, question)
    with duckdb.connect(DATABASE) as con:
        run_scripts(con, Path("sql/estimates"))
