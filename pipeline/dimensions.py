from pathlib import Path

import duckdb
import numpy as np
import pandas as pd

from pipeline.load import DATABASE

# After the fifth eigenvalue (1.7), the next ones flatten out (1.2, 1.2, 1.1, ...).
N_DIMENSIONS = 5
# The first component, before rotation, loads on most attitudes: the left-right axis. Its sign is
# arbitrary; it is set so that attachment to traditional family values goes to the right.
RIGHT_QUESTION = "family_values"
MAX_ITERATIONS = 100
TOLERANCE = 1e-12


def load_scores(con: duckdb.DuckDBPyConnection) -> pd.DataFrame:
    return (
        con.sql(
            "PIVOT analytics.respondent_scores ON question USING first(score) GROUP BY respondent_id"
        )
        .df()
        .set_index("respondent_id")
    )


def principal_components(correlations: np.ndarray, n_components: int) -> np.ndarray:
    eigenvalues, eigenvectors = np.linalg.eigh(correlations)
    largest = np.argsort(eigenvalues)[::-1][:n_components]
    # Scaled by the square root of the eigenvalue, a loading is the correlation between the
    # question and the component.
    return eigenvectors[:, largest] * np.sqrt(eigenvalues[largest])


def varimax(loadings: np.ndarray) -> np.ndarray:
    n_questions, n_components = loadings.shape
    rotation = np.eye(n_components)
    criterion = 0.0
    for _ in range(MAX_ITERATIONS):
        rotated = loadings @ rotation
        target = rotated**3 - rotated * (rotated**2).sum(axis=0) / n_questions
        u, singular_values, vt = np.linalg.svd(loadings.T @ target)
        rotation = u @ vt
        previous, criterion = criterion, singular_values.sum()
        if criterion - previous < TOLERANCE * criterion:
            break
    return loadings @ rotation


def orient(loadings: np.ndarray, axis: np.ndarray) -> np.ndarray:
    # The rotation leaves the order and the sign of the dimensions arbitrary: sort them by the
    # variance they explain and turn each one so that a higher score leans to the right of the axis.
    order = np.argsort((loadings**2).sum(axis=0))[::-1]
    loadings = loadings[:, order]
    return loadings * np.sign(axis @ loadings)


def score_weights(loadings: np.ndarray) -> np.ndarray:
    # Applied to standardized answers, these weights give the component scores: a loading
    # alone would mix in the other dimensions that the question also loads on.
    return loadings @ np.linalg.inv(loadings.T @ loadings)


def to_long(matrix: np.ndarray, questions: pd.Index, name: str) -> pd.DataFrame:
    frame = pd.DataFrame(matrix, index=questions, columns=range(matrix.shape[1]))
    long = frame.melt(ignore_index=False, var_name="dimension", value_name=name)
    return long.reset_index(names="question")


def build_dimension_loadings(database: Path) -> None:
    with duckdb.connect(database) as con:
        scores = load_scores(con)
        # Pairwise correlations: questions from the two waves were not all asked to the same
        # respondents, so dropping incomplete rows would lose most of the sample.
        correlations = scores.corr()
        questions = correlations.index
        axis = principal_components(correlations.to_numpy(), 1)
        axis *= np.sign(axis[questions.get_loc(RIGHT_QUESTION)])
        rotated = orient(
            varimax(principal_components(correlations.to_numpy(), N_DIMENSIONS)), axis[:, 0]
        )

        # Dimension 0 is the left-right axis, then the rotated dimensions from 1. Their weights
        # are computed apart: the axis overlaps with all of them.
        loadings = np.hstack([axis, rotated])
        weights = np.hstack([score_weights(axis), score_weights(rotated)])
        long = to_long(loadings, questions, "loading")
        long["weight"] = to_long(weights, questions, "weight")["weight"]
        con.register("loadings", long)
        con.execute("CREATE OR REPLACE TABLE analytics.dimension_loadings AS FROM loadings")

        # Estimates are standardized like the answers before being projected.
        scales = pd.DataFrame({"respondent_mean": scores.mean(), "respondent_sd": scores.std()})
        con.register("scales", scales.reset_index(names="question"))
        con.execute("CREATE OR REPLACE TABLE analytics.respondent_scales AS FROM scales")


if __name__ == "__main__":
    build_dimension_loadings(DATABASE)
