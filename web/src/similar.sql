-- One row per 2023 riding and feature, standardized across ridings so that every feature
-- weighs the same in the distance between two ridings. Features are the mean position on
-- each attitude scale and the official 2025 vote share of each party.
WITH attitudes AS (
    SELECT fed23, question AS feature, estimate_mean AS value
    FROM 'fed_summaries.parquet'
    WHERE category = 'mean'
),

ridings AS (
    SELECT DISTINCT fed23
    FROM attitudes
),

parties AS (
    SELECT DISTINCT category
    FROM 'vote_gaps.parquet'
    WHERE question = 'vote_post'
),

-- A party that ran no candidate in a riding has no row: its share is zero.
vote_shares AS (
    SELECT
        r.fed23,
        'vote_' || p.category AS feature,
        COALESCE(g.actual_share, 0) AS value
    FROM ridings AS r
    CROSS JOIN parties AS p
    LEFT JOIN 'vote_gaps.parquet' AS g
        ON g.fed23 = r.fed23
        AND g.category = p.category
        AND g.question = 'vote_post'
),

features AS (
    SELECT * FROM attitudes
    UNION ALL
    SELECT * FROM vote_shares
)

SELECT
    fed23,
    feature,
    (value - AVG(value) OVER (PARTITION BY feature))
        / STDDEV_POP(value) OVER (PARTITION BY feature) AS z_score
FROM features
ORDER BY fed23, feature
