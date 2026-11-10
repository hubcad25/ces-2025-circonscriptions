CREATE SCHEMA IF NOT EXISTS analytics;

-- Questions asked in one province only: Quebec sovereignty was shown to Quebec respondents.
-- The model is fitted and poststratified within that province, so these questions have no
-- estimate in other ridings and no national summary.
CREATE OR REPLACE TABLE analytics.province_questions AS
SELECT *
FROM (
    VALUES
        ('quebec_sovereignty', 24)
) AS questions (question, province_code);
