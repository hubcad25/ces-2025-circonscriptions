CREATE SCHEMA IF NOT EXISTS analytics;

-- One row per respondent and question, recoded into the categories the MRP model predicts.
-- Party codes match analytics.results_fed; "don't know" and spoiled votes are dropped so that
-- shares use the same base as the official results. "Don't know" is dropped from the attitude
-- questions too, so that their shares are among respondents with an opinion.
CREATE OR REPLACE TABLE analytics.mrp_outcomes AS
WITH vote_post AS (
    SELECT
        'vote_post' AS question,
        respondent_id,
        CASE code
            WHEN 1 THEN 'LPC' WHEN 2 THEN 'CPC' WHEN 3 THEN 'NDP' WHEN 4 THEN 'BQ'
            WHEN 5 THEN 'OTH' WHEN 6 THEN 'OTH' WHEN 7 THEN 'OTH'
        END AS category
    FROM staging.responses
    WHERE variable = 'pes25_votechoice2025'
),

vote_pre AS (
    SELECT
        'vote_pre' AS question,
        respondent_id,
        CASE code
            WHEN 1 THEN 'LPC' WHEN 2 THEN 'CPC' WHEN 3 THEN 'NDP' WHEN 4 THEN 'BQ'
            WHEN 5 THEN 'OTH' WHEN 6 THEN 'OTH' WHEN 8 THEN 'OTH'
        END AS category
    FROM staging.responses
    WHERE variable = 'cps25_votechoice'
),

immigration AS (
    SELECT
        'immigration' AS question,
        respondent_id,
        CASE code WHEN 1 THEN 'more' WHEN 2 THEN 'fewer' WHEN 3 THEN 'same' END AS category
    FROM staging.responses
    WHERE variable = 'cps25_imm'
),

spend_defence AS (
    SELECT
        'spend_defence' AS question,
        respondent_id,
        CASE code WHEN 1 THEN 'less' WHEN 2 THEN 'same' WHEN 3 THEN 'more' END AS category
    FROM staging.responses
    WHERE variable = 'cps25_spend_defence'
),

bilingualism AS (
    SELECT
        'bilingualism' AS question,
        respondent_id,
        CASE code
            WHEN 1 THEN 'strongly_disagree' WHEN 2 THEN 'somewhat_disagree'
            WHEN 3 THEN 'neither' WHEN 4 THEN 'somewhat_agree' WHEN 5 THEN 'strongly_agree'
        END AS category
    FROM staging.responses
    WHERE variable = 'pes25_bilingualism'
)

SELECT * FROM vote_post WHERE category IS NOT NULL
UNION ALL
SELECT * FROM vote_pre WHERE category IS NOT NULL
UNION ALL
SELECT * FROM immigration WHERE category IS NOT NULL
UNION ALL
SELECT * FROM spend_defence WHERE category IS NOT NULL
UNION ALL
SELECT * FROM bilingualism WHERE category IS NOT NULL;
