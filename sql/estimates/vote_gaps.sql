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

-- Factor that widens every interval around its mean so that 90% of the official results fall
-- inside. It measures the error the model does not see (survey bias, local campaigns) and is
-- applied to every question, on the assumption that this error is similar for attitudes.
CREATE OR REPLACE TABLE analytics.interval_scale AS
WITH needed_scales AS (
    SELECT
        CASE
            WHEN actual_share < estimate_mean
                THEN (estimate_mean - actual_share) / (estimate_mean - estimate_low)
            ELSE (actual_share - estimate_mean) / (estimate_high - estimate_mean)
        END AS needed_scale
    FROM analytics.vote_gaps
)

SELECT quantile_cont(needed_scale, 0.9) AS scale
FROM needed_scales;
