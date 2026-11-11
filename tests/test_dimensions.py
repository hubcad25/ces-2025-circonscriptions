import numpy as np

from pipeline.dimensions import orient, principal_components, score_weights, varimax

# Two groups of questions, each loading on one dimension only.
SIMPLE_STRUCTURE = np.array([[0.8, 0.0], [0.7, 0.0], [0.6, 0.0], [0.0, 0.7], [0.0, 0.5]])


def rotate(loadings: np.ndarray, angle: float) -> np.ndarray:
    rotation = np.array([[np.cos(angle), -np.sin(angle)], [np.sin(angle), np.cos(angle)]])
    return loadings @ rotation


def test_varimax_recovers_a_simple_structure():
    mixed = rotate(SIMPLE_STRUCTURE, np.pi / 6)
    np.testing.assert_allclose(orient(varimax(mixed), np.ones(5)), SIMPLE_STRUCTURE, atol=1e-6)


def test_varimax_keeps_the_variance_of_each_question():
    mixed = rotate(SIMPLE_STRUCTURE, np.pi / 6)
    np.testing.assert_allclose((varimax(mixed) ** 2).sum(axis=1), (mixed**2).sum(axis=1))


def test_orient_sorts_by_variance_and_leans_each_dimension_with_the_axis():
    loadings = np.array([[0.1, -0.9], [-0.2, -0.8]])
    axis = np.array([1.0, -1.0])
    np.testing.assert_allclose(orient(loadings, axis), [[0.9, 0.1], [0.8, -0.2]])


def test_principal_components_reproduce_a_one_factor_correlation():
    # With one component, a loading squared plus the leftover variance gives back 1.
    correlations = np.array([[1.0, 0.5], [0.5, 1.0]])
    loadings = principal_components(correlations, 1)
    np.testing.assert_allclose(np.abs(loadings.ravel()), [np.sqrt(0.75), np.sqrt(0.75)])


def test_score_weights_give_uncorrelated_scores_with_unit_variance():
    rng = np.random.default_rng(0)
    correlations = np.corrcoef(rng.normal(size=(6, 200)))
    loadings = varimax(principal_components(correlations, 2))
    weights = score_weights(loadings)
    np.testing.assert_allclose(weights.T @ correlations @ weights, np.eye(2), atol=1e-10)


def test_every_riding_has_a_score_on_every_dimension(con):
    missing = con.execute("""
        SELECT count(*)
        FROM staging.ridings_2023
        CROSS JOIN (SELECT DISTINCT dimension FROM analytics.dimension_loadings)
        ANTI JOIN analytics.fed_dimensions
            USING (fed23, dimension)
    """).fetchone()[0]
    assert missing == 0
