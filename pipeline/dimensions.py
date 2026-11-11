from pathlib import Path

import duckdb
import numpy as np
import pandas as pd

from pipeline.load import DATABASE

# After the fifth eigenvalue (1.7), the next ones flatten out (1.2, 1.2, 1.1, ...).
N_DIMENSIONS = 5
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


def orient(loadings: np.ndarray) -> np.ndarray:
    # The rotation leaves the order and the sign of the dimensions arbitrary: sort them by the
    # variance they explain and make the strongest loading of each one positive.
    order = np.argsort((loadings**2).sum(axis=0))[::-1]
    loadings = loadings[:, order]
    strongest = loadings[np.abs(loadings).argmax(axis=0), np.arange(loadings.shape[1])]
    return loadings * np.sign(strongest)


def score_weights(loadings: np.ndarray) -> np.ndarray:
    # Applied to standardized answers, these weights give the component scores: a loading
    # alone would mix in the other dimensions that the question also loads on.
    return loadings @ np.linalg.inv(loadings.T @ loadings)


def to_long(matrix: np.ndarray, questions: pd.Index, name: str) -> pd.DataFrame:
    frame = pd.DataFrame(matrix, index=questions, columns=range(1, matrix.shape[1] + 1))
    long = frame.melt(ignore_index=False, var_name="dimension", value_name=name)
    return long.reset_index(names="question")


def build_dimension_loadings(database: Path) -> None:
    with duckdb.connect(database) as con:
        scores = load_scores(con)
        # Pairwise correlations: questions from the two waves were not all asked to the same
        # respondents, so dropping incomplete rows would lose most of the sample.
        correlations = scores.corr()
        loadings = orient(varimax(principal_components(correlations.to_numpy(), N_DIMENSIONS)))

        long = to_long(loadings, correlations.index, "loading")
        long["weight"] = to_long(score_weights(loadings), correlations.index, "weight")["weight"]
        con.register("loadings", long)
        con.execute("CREATE OR REPLACE TABLE analytics.dimension_loadings AS FROM loadings")


if __name__ == "__main__":
    build_dimension_loadings(DATABASE)
