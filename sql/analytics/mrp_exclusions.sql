CREATE SCHEMA IF NOT EXISTS analytics;

-- Categories that cannot occur in a province, so the model gives them a probability of zero
-- there instead of pulling every province toward the national mean. For the vote questions,
-- a party is excluded from a province where it ran no candidate in 2025 (the Bloc outside
-- Quebec). Other questions have no exclusions.
CREATE OR REPLACE TABLE analytics.mrp_exclusions AS
WITH vote_questions (question) AS (
    VALUES ('vote_post'), ('vote_pre')
),

parties (category) AS (
    VALUES ('LPC'), ('CPC'), ('NDP'), ('BQ')
),

provinces AS (
    SELECT DISTINCT fed13 // 1000 AS province_code
    FROM staging.ridings_2013
),

candidate_provinces AS (
    SELECT DISTINCT
        party AS category,
        fed23 // 1000 AS province_code
    FROM staging.candidates
)

SELECT
    q.question,
    p.category,
    v.province_code
FROM vote_questions AS q
CROSS JOIN parties AS p
CROSS JOIN provinces AS v
ANTI JOIN candidate_provinces AS c
    ON c.category = p.category AND c.province_code = v.province_code
ORDER BY ALL;
