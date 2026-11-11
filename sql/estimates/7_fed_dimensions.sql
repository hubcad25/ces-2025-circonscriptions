CREATE SCHEMA IF NOT EXISTS analytics;

-- One row per dimension and 2023 riding: the mean score over the draws and its 90% interval,
-- widened by the factor calibrated on the vote, as for the attitudes in analytics.fed_summaries.
CREATE OR REPLACE TABLE analytics.fed_dimensions AS
WITH draw_summaries AS (
    SELECT
        dimension,
        fed23,
        avg(score) AS score_mean,
        quantile_cont(score, 0.05) AS model_low,
        quantile_cont(score, 0.95) AS model_high
    FROM analytics.fed_dimension_draws
    GROUP BY dimension, fed23
)

SELECT
    d.dimension,
    d.fed23,
    r.fed23_name,
    d.score_mean,
    d.score_mean - s.scale * (d.score_mean - d.model_low) AS score_low,
    d.score_mean + s.scale * (d.model_high - d.score_mean) AS score_high
FROM draw_summaries AS d
INNER JOIN staging.ridings_2023 AS r
    USING (fed23)
CROSS JOIN analytics.interval_scale AS s
ORDER BY d.dimension, d.fed23;
