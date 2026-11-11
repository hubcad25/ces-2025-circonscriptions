-- How much each attitude goes with each dimension, for the Dimensions page.
SELECT
    dimension,
    question,
    ROUND(loading, 3) AS loading
FROM analytics.dimension_loadings
ORDER BY dimension, abs(loading) DESC
