import sys
from pathlib import Path

import duckdb
import jax
import jax.numpy as jnp
import numpy as np
import numpyro
import numpyro.distributions as dist
import pandas as pd
from numpyro.distributions.transforms import OrderedTransform
from numpyro.infer import MCMC, NUTS

from pipeline.ipf import AGE_GROUPS, EDUCATION, GENDERS, LANGUAGES, PAST_VOTES
from pipeline.load import DATABASE, run_scripts

N_CHAINS = 4
# Warmup and kept iterations per chain. A quick run only checks that the code runs end to end
# (about 20 s instead of 5 min); its draws are not saved.
N_ITERATIONS = 500
QUICK_ITERATIONS = 20
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


def load_scale(database: Path, question: str) -> list[str] | None:
    with duckdb.connect(database, read_only=True) as con:
        rows = con.execute(
            "SELECT category FROM analytics.mrp_scales WHERE question = ? ORDER BY rank",
            [question],
        ).fetchall()
    return [row[0] for row in rows] or None


def category_order(categories: pd.Series, scale: list[str] | None) -> list[str]:
    # An ordinal question keeps its scale order. For a multinomial one, the most frequent
    # category is the reference; a rare one such as the Bloc (zero outside Quebec) would make
    # every other coefficient unstable.
    if scale is not None:
        return scale
    return categories.value_counts().index.tolist()


def allowed_categories(
    database: Path, question: str, ridings: list[int], categories: list[str]
) -> np.ndarray:
    with duckdb.connect(database, read_only=True) as con:
        exclusions = con.execute(
            "SELECT category, province_code FROM analytics.mrp_exclusions WHERE question = ?",
            [question],
        ).fetchall()
    codes = provinces(ridings)
    # Axes: province, category.
    allowed = np.ones((len(codes), len(categories)), dtype=bool)
    for category, province_code in exclusions:
        allowed[codes.index(province_code), categories.index(category)] = False
    if not allowed[:, 0].all():
        raise ValueError("The reference category cannot be excluded from a province")
    return allowed


def linear_predictor(effects: dict[str, jnp.ndarray], codes: dict[str, np.ndarray]) -> jnp.ndarray:
    # Axes: row of codes, effect column.
    return sum(effect[codes[group]] for group, effect in effects.items())


def category_logits(
    intercept: jnp.ndarray,
    linear: jnp.ndarray,
    codes: dict[str, np.ndarray],
    allowed: np.ndarray,
) -> jnp.ndarray:
    logits = intercept + linear
    reference = jnp.zeros((logits.shape[0], 1))
    logits = jnp.concatenate([reference, logits], axis=1)
    # An excluded category gets a probability of exactly zero after the softmax.
    return jnp.where(allowed[codes["province"]], logits, -jnp.inf)


def ordinal_probabilities(linear: jnp.ndarray, cutpoints: jnp.ndarray) -> jnp.ndarray:
    # P(answer <= k) = sigmoid(cutpoint_k - linear); each category is the gap between two
    # consecutive cumulative probabilities.
    below = jax.nn.sigmoid(cutpoints[None, :] - linear[:, :1])
    n = linear.shape[0]
    cumulative = jnp.concatenate([jnp.zeros((n, 1)), below, jnp.ones((n, 1))], axis=1)
    return jnp.diff(cumulative, axis=1)


def model(
    codes: dict[str, np.ndarray],
    group_sizes: dict[str, int],
    predictors: np.ndarray,
    allowed: np.ndarray,
    n_categories: int,
    is_ordinal: bool,
    outcome: np.ndarray | None = None,
) -> None:
    # Multinomial logit: category 0 is the reference, so each effect has one column per other
    # category. Ordered logit: one column, and ordered cutpoints split it into categories.
    # Random effects are non-centered (z * sigma), which helps NUTS when a group has few
    # respondents, as in most ridings.
    n_effects = 1 if is_ordinal else n_categories - 1
    effects = {}
    for group, size in group_sizes.items():
        sigma = numpyro.sample(f"sigma_{group}", dist.HalfNormal(1).expand([n_effects]))
        z = numpyro.sample(f"z_{group}", dist.Normal(0, 1).expand([size, n_effects]))
        effects[group] = z * sigma
    # Riding predictors shift each riding's effect, so that ridings with few respondents are
    # pulled toward similar ridings rather than toward the national mean.
    beta = numpyro.sample("beta_fed13", dist.Normal(0, 1).expand([predictors.shape[1], n_effects]))
    effects["fed13"] = effects["fed13"] + predictors @ beta
    linear = linear_predictor(effects, codes)
    if is_ordinal:
        cutpoints = numpyro.sample(
            "cutpoints",
            dist.TransformedDistribution(
                dist.Normal(0, 3).expand([n_categories - 1]), OrderedTransform()
            ),
        )
        likelihood = dist.OrderedLogistic(linear[:, 0], cutpoints)
    else:
        intercept = numpyro.sample("intercept", dist.Normal(0, 2).expand([n_effects]))
        likelihood = dist.Categorical(logits=category_logits(intercept, linear, codes, allowed))
    with numpyro.plate("respondents", linear.shape[0]):
        numpyro.sample("outcome", likelihood, obs=outcome)


def fit(
    codes: dict[str, np.ndarray],
    group_sizes: dict[str, int],
    predictors: np.ndarray,
    allowed: np.ndarray,
    n_categories: int,
    is_ordinal: bool,
    outcome: np.ndarray,
    n_iterations: int,
) -> MCMC:
    mcmc = MCMC(
        NUTS(model),
        num_warmup=n_iterations,
        num_samples=n_iterations,
        num_chains=N_CHAINS,
        chain_method="parallel",
        progress_bar=True,
    )
    mcmc.run(
        jax.random.PRNGKey(SEED),
        codes,
        group_sizes,
        predictors,
        allowed,
        n_categories,
        is_ordinal,
        outcome,
    )
    return mcmc


def past_vote_weights(cells: pd.DataFrame) -> np.ndarray:
    counts = cells["n"].to_numpy().reshape(-1, len(PAST_VOTES))
    totals = counts.sum(axis=1, keepdims=True)
    return np.divide(counts, totals, out=np.zeros_like(counts), where=totals > 0)


def predict_probabilities(
    samples: dict[str, jnp.ndarray],
    group_sizes: dict[str, int],
    predictors: np.ndarray,
    allowed: np.ndarray,
    codes: dict[str, np.ndarray],
    weights: np.ndarray,
    is_ordinal: bool,
) -> np.ndarray:
    # Evenly spaced draws across all chains keep the posterior spread in a smaller output.
    kept = np.linspace(0, len(samples["beta_fed13"]) - 1, N_DRAWS).astype(int)
    probabilities = []
    for draw in kept:
        effects = {
            group: samples[f"z_{group}"][draw] * samples[f"sigma_{group}"][draw]
            for group in group_sizes
        }
        effects["fed13"] = effects["fed13"] + predictors @ samples["beta_fed13"][draw]
        linear = linear_predictor(effects, codes)
        if is_ordinal:
            by_cell = ordinal_probabilities(linear, samples["cutpoints"][draw])
        else:
            logits = category_logits(samples["intercept"][draw], linear, codes, allowed)
            by_cell = jax.nn.softmax(logits, axis=1)
        by_past_vote = by_cell.reshape(*weights.shape, -1)
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


def fit_question(database: Path, question: str, is_quick: bool = False) -> None:
    survey, ridings = load_survey(database, question)
    cells = load_cells(database)
    scale = load_scale(database, question)
    is_ordinal = scale is not None
    categories = category_order(survey["category"], scale)
    sizes = effect_sizes(ridings)
    predictors = load_predictors(database, ridings)
    allowed = allowed_categories(database, question, ridings, categories)
    if is_ordinal and not allowed.all():
        raise ValueError("Exclusions are only supported for multinomial questions")
    outcome = pd.Categorical(survey["category"], categories=categories).codes
    survey_codes = encode(survey, ridings)
    if not allowed[survey_codes["province"], outcome].all():
        raise ValueError("Some respondents chose a category excluded from their province")
    n_iterations = QUICK_ITERATIONS if is_quick else N_ITERATIONS
    mcmc = fit(
        survey_codes, sizes, predictors, allowed, len(categories), is_ordinal, outcome, n_iterations
    )
    probabilities = predict_probabilities(
        mcmc.get_samples(),
        sizes,
        predictors,
        allowed,
        encode(cells, ridings),
        past_vote_weights(cells),
        is_ordinal,
    )
    if is_quick:
        return
    demographic_cells = cells.iloc[:: len(PAST_VOTES)]
    save_draws(database, draws_frame(question, demographic_cells, categories, probabilities))


# Usage: python -m pipeline.mrp <question> [--quick]
if __name__ == "__main__":
    question = sys.argv[1] if len(sys.argv) > 1 else "vote_post"
    is_quick = "--quick" in sys.argv
    fit_question(DATABASE, question, is_quick)
    if not is_quick:
        with duckdb.connect(DATABASE) as con:
            run_scripts(con, Path("sql/estimates"))
