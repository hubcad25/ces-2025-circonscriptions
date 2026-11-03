CREATE SCHEMA IF NOT EXISTS analytics;

-- One row per question, 2023 riding and category, as read by the website. The 90% interval is
-- widened around the mean by the factor calibrated on the vote, then kept within [0, 1].
CREATE OR REPLACE TABLE analytics.fed_summaries AS
WITH draw_summaries AS (
    SELECT
        question,
        fed23,
        category,
        avg(estimate) AS estimate_mean,
        quantile_cont(estimate, 0.05) AS model_low,
        quantile_cont(estimate, 0.95) AS model_high
    FROM analytics.fed_estimates
    GROUP BY question, fed23, category
)

SELECT
    d.question,
    d.fed23,
    r.fed23_name,
    d.category,
    d.estimate_mean,
    greatest(0, d.estimate_mean - s.scale * (d.estimate_mean - d.model_low)) AS estimate_low,
    least(1, d.estimate_mean + s.scale * (d.model_high - d.estimate_mean)) AS estimate_high
FROM draw_summaries AS d
INNER JOIN staging.ridings_2023 AS r
    USING (fed23)
CROSS JOIN analytics.interval_scale AS s
ORDER BY d.question, d.fed23, d.category;
