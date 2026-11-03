CREATE SCHEMA IF NOT EXISTS analytics;

-- Compare the post-election MRP estimates with the official 2025 results, by 2023 riding and party.
CREATE OR REPLACE TABLE analytics.vote_gaps AS
WITH actual_votes AS (
    SELECT
        fed23,
        CASE WHEN party IN ('LPC', 'CPC', 'NDP', 'BQ') THEN party ELSE 'OTH' END AS category,
        sum(votes) AS votes
    FROM analytics.results_fed
    GROUP BY ALL
),

actual_shares AS (
    SELECT
        fed23,
        category,
        votes / sum(votes) OVER (PARTITION BY fed23) AS actual_share
    FROM actual_votes
),

estimate_summaries AS (
    SELECT
        fed23,
        category,
        avg(estimate) AS estimate_mean,
        quantile_cont(estimate, 0.05) AS estimate_low,
        quantile_cont(estimate, 0.95) AS estimate_high
    FROM analytics.fed_estimates
    WHERE question = 'vote_post'
    GROUP BY fed23, category
)

SELECT
    e.fed23,
    e.category,
    a.actual_share,
    e.estimate_mean,
    e.estimate_low,
    e.estimate_high,
    e.estimate_mean - a.actual_share AS gap,
    a.actual_share BETWEEN e.estimate_low AND e.estimate_high AS is_covered
FROM estimate_summaries AS e
INNER JOIN actual_shares AS a
    USING (fed23, category)
ORDER BY e.fed23, e.category;
