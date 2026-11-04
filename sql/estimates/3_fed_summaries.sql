CREATE SCHEMA IF NOT EXISTS analytics;

-- One row per question, 2023 riding and category, as read by the website. Ordinal questions
-- also get their grouped answers (grouped_low, grouped_middle, grouped_high) and their mean
-- position on the scale (category "mean", from 1 to the number of answers), computed draw by
-- draw so that their intervals stay correct. The 90% interval is widened around the mean by
-- the factor calibrated on the vote, then kept within [0, 1], or within the scale for "mean".
CREATE OR REPLACE TABLE analytics.fed_summaries AS
WITH grouped_estimates AS (
    SELECT
        e.question,
        e.draw,
        e.fed23,
        'grouped_' || s.side AS category,
        sum(e.estimate) AS estimate
    FROM analytics.fed_estimates AS e
    INNER JOIN analytics.mrp_scales AS s
        USING (question, category)
    GROUP BY e.question, e.draw, e.fed23, s.side
),

mean_estimates AS (
    SELECT
        e.question,
        e.draw,
        e.fed23,
        'mean' AS category,
        sum(s.rank * e.estimate) AS estimate
    FROM analytics.fed_estimates AS e
    INNER JOIN analytics.mrp_scales AS s
        USING (question, category)
    GROUP BY e.question, e.draw, e.fed23
),

scale_ranges AS (
    SELECT question, max(rank) AS top_rank
    FROM analytics.mrp_scales
    GROUP BY question
),

all_estimates AS (
    SELECT question, draw, fed23, category, estimate FROM analytics.fed_estimates
    UNION ALL
    SELECT * FROM grouped_estimates
    UNION ALL
    SELECT * FROM mean_estimates
),

draw_summaries AS (
    SELECT
        question,
        fed23,
        category,
        avg(estimate) AS estimate_mean,
        quantile_cont(estimate, 0.05) AS model_low,
        quantile_cont(estimate, 0.95) AS model_high
    FROM all_estimates
    GROUP BY question, fed23, category
)

SELECT
    d.question,
    d.fed23,
    r.fed23_name,
    d.category,
    d.estimate_mean,
    greatest(
        CASE WHEN d.category = 'mean' THEN 1 ELSE 0 END,
        d.estimate_mean - s.scale * (d.estimate_mean - d.model_low)
    ) AS estimate_low,
    least(
        CASE WHEN d.category = 'mean' THEN g.top_rank ELSE 1 END,
        d.estimate_mean + s.scale * (d.model_high - d.estimate_mean)
    ) AS estimate_high
FROM draw_summaries AS d
INNER JOIN staging.ridings_2023 AS r
    USING (fed23)
CROSS JOIN analytics.interval_scale AS s
LEFT JOIN scale_ranges AS g
    USING (question)
ORDER BY d.question, d.fed23, d.category;
