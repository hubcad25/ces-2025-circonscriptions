-- One row per 2023 riding and attitude: the mean position on the scale, standardized across
-- ridings so that every attitude weighs the same in the distance between two ridings.
WITH attitudes AS (
    SELECT fed23, question AS feature, estimate_mean AS value
    FROM 'fed_summaries.parquet'
    WHERE category = 'mean'
)

SELECT
    fed23,
    feature,
    (value - AVG(value) OVER (PARTITION BY feature))
        / STDDEV_POP(value) OVER (PARTITION BY feature) AS z_score
FROM attitudes
ORDER BY fed23, feature
