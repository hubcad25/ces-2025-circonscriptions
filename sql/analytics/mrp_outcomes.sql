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
),

decent_housing AS (
    SELECT
        'decent_housing' AS question,
        respondent_id,
        CASE code
            WHEN 1 THEN 'strongly_disagree' WHEN 2 THEN 'somewhat_disagree'
            WHEN 3 THEN 'neither' WHEN 4 THEN 'somewhat_agree' WHEN 5 THEN 'strongly_agree'
        END AS category
    FROM staging.responses
    WHERE variable = 'pes25_decent_housing'
),

spend_environment AS (
    SELECT
        'spend_environment' AS question,
        respondent_id,
        CASE code WHEN 1 THEN 'less' WHEN 2 THEN 'same' WHEN 3 THEN 'more' END AS category
    FROM staging.responses
    WHERE variable = 'cps25_spend_env'
),

ties_us AS (
    SELECT
        'ties_us' AS question,
        respondent_id,
        CASE code
            WHEN 1 THEN 'much_closer' WHEN 2 THEN 'somewhat_closer' WHEN 3 THEN 'same'
            WHEN 4 THEN 'somewhat_more_distant' WHEN 5 THEN 'much_more_distant'
        END AS category
    FROM staging.responses
    WHERE variable = 'pes25_tieus'
),

-- The CES variable name is misspelled ("tarrifs").
tariffs_us AS (
    SELECT
        'tariffs_us' AS question,
        respondent_id,
        CASE code
            WHEN 1 THEN 'strongly_support' WHEN 2 THEN 'somewhat_support'
            WHEN 3 THEN 'somewhat_oppose' WHEN 4 THEN 'strongly_oppose'
        END AS category
    FROM staging.responses
    WHERE variable = 'cps25_tarrifs_3'
),

spend_reconciliation AS (
    SELECT
        'spend_reconciliation' AS question,
        respondent_id,
        CASE code WHEN 1 THEN 'less' WHEN 2 THEN 'same' WHEN 3 THEN 'more' END AS category
    FROM staging.responses
    WHERE variable = 'cps25_spend_rec_indi'
),

indigenous_deserve AS (
    SELECT
        'indigenous_deserve' AS question,
        respondent_id,
        CASE code
            WHEN 1 THEN 'strongly_disagree' WHEN 2 THEN 'somewhat_disagree'
            WHEN 3 THEN 'neither' WHEN 4 THEN 'somewhat_agree' WHEN 5 THEN 'strongly_agree'
        END AS category
    FROM staging.responses
    WHERE variable = 'pes25_indig_deserve'
),

ban_abortion AS (
    SELECT
        'ban_abortion' AS question,
        respondent_id,
        CASE code
            WHEN 1 THEN 'yes' WHEN 2 THEN 'some_circumstances' WHEN 3 THEN 'no'
        END AS category
    FROM staging.responses
    WHERE variable = 'pes25_abort2'
),

women_home AS (
    SELECT
        'women_home' AS question,
        respondent_id,
        CASE code
            WHEN 1 THEN 'strongly_disagree' WHEN 2 THEN 'somewhat_disagree'
            WHEN 3 THEN 'neither' WHEN 4 THEN 'somewhat_agree' WHEN 5 THEN 'strongly_agree'
        END AS category
    FROM staging.responses
    WHERE variable = 'pes25_womenhome'
),

religion_importance AS (
    SELECT
        'religion_importance' AS question,
        respondent_id,
        CASE code
            WHEN 1 THEN 'very' WHEN 2 THEN 'somewhat' WHEN 3 THEN 'not_very'
            WHEN 4 THEN 'not_at_all'
        END AS category
    FROM staging.responses
    WHERE variable = 'cps25_rel_imp'
),

democracy_satisfaction AS (
    SELECT
        'democracy_satisfaction' AS question,
        respondent_id,
        CASE code
            WHEN 1 THEN 'very' WHEN 2 THEN 'fairly' WHEN 3 THEN 'not_very'
            WHEN 4 THEN 'not_at_all'
        END AS category
    FROM staging.responses
    WHERE variable = 'cps25_demsat'
),

politicians_trustworthy AS (
    SELECT
        'politicians_trustworthy' AS question,
        respondent_id,
        CASE code
            WHEN 1 THEN 'strongly_disagree' WHEN 2 THEN 'somewhat_disagree'
            WHEN 3 THEN 'neither' WHEN 4 THEN 'somewhat_agree' WHEN 5 THEN 'strongly_agree'
        END AS category
    FROM staging.responses
    WHERE variable = 'pes25_populism_4'
),

-- Asked across Canada, not only in Quebec.
french_threatened AS (
    SELECT
        'french_threatened' AS question,
        respondent_id,
        CASE code WHEN 1 THEN 'yes' WHEN 2 THEN 'no' END AS category
    FROM staging.responses
    WHERE variable = 'pes25_langQC'
)

SELECT * FROM vote_post WHERE category IS NOT NULL
UNION ALL
SELECT * FROM vote_pre WHERE category IS NOT NULL
UNION ALL
SELECT * FROM immigration WHERE category IS NOT NULL
UNION ALL
SELECT * FROM spend_defence WHERE category IS NOT NULL
UNION ALL
SELECT * FROM bilingualism WHERE category IS NOT NULL
UNION ALL
SELECT * FROM decent_housing WHERE category IS NOT NULL
UNION ALL
SELECT * FROM spend_environment WHERE category IS NOT NULL
UNION ALL
SELECT * FROM ties_us WHERE category IS NOT NULL
UNION ALL
SELECT * FROM tariffs_us WHERE category IS NOT NULL
UNION ALL
SELECT * FROM spend_reconciliation WHERE category IS NOT NULL
UNION ALL
SELECT * FROM indigenous_deserve WHERE category IS NOT NULL
UNION ALL
SELECT * FROM ban_abortion WHERE category IS NOT NULL
UNION ALL
SELECT * FROM women_home WHERE category IS NOT NULL
UNION ALL
SELECT * FROM religion_importance WHERE category IS NOT NULL
UNION ALL
SELECT * FROM democracy_satisfaction WHERE category IS NOT NULL
UNION ALL
SELECT * FROM politicians_trustworthy WHERE category IS NOT NULL
UNION ALL
SELECT * FROM french_threatened WHERE category IS NOT NULL;
