CREATE SCHEMA IF NOT EXISTS staging;

CREATE OR REPLACE TABLE staging.variables AS
SELECT
    variable,
    label,
    CASE
        WHEN starts_with(variable, 'cps25_') THEN 'pre_election'
        WHEN starts_with(variable, 'pes25_') THEN 'post_election'
    END AS wave,
    variable IN (SELECT variable FROM raw.ces_value_labels) AS is_coded
FROM raw.ces_variables;

-- Labels come prefixed with their code ("1. Liberal Party").
CREATE OR REPLACE TABLE staging.value_labels AS
SELECT
    variable,
    code::INTEGER AS code,
    regexp_replace(label, '^-?\d+\.\s*', '') AS label
FROM raw.ces_value_labels;

-- Long format: one row per respondent and coded question. Text, dates and weights are
-- left out; UNPIVOT drops unanswered questions (NULL).
CREATE OR REPLACE TABLE staging.responses AS
WITH long AS (
    UNPIVOT (
        SELECT
            cps25_ResponseId AS respondent_id,
            TRY_CAST(COLUMNS(* EXCLUDE (cps25_ResponseId)) AS INTEGER)
        FROM raw.ces
    )
    ON COLUMNS(* EXCLUDE (respondent_id))
    INTO NAME variable VALUE code
)

SELECT respondent_id, variable, code
FROM long
WHERE variable IN (SELECT variable FROM staging.variables WHERE is_coded);
