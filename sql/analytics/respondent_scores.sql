CREATE SCHEMA IF NOT EXISTS analytics;

-- One row per respondent and ordinal attitude: the rank of the answer on its scale, the input
-- of the dimensional analysis. Questions asked in one province only are left out, since their
-- correlations with the other attitudes would only describe that province.
CREATE OR REPLACE TABLE analytics.respondent_scores AS
SELECT
    o.respondent_id,
    o.question,
    s.rank AS score
FROM analytics.mrp_outcomes AS o
INNER JOIN analytics.mrp_scales AS s
    ON o.question = s.question
    AND o.category = s.category
ANTI JOIN analytics.province_questions AS p
    ON o.question = p.question
ORDER BY o.question, o.respondent_id;
