CREATE SCHEMA IF NOT EXISTS analytics;

-- Score of each 2023 riding on each dimension, draw by draw: the riding's mean position on
-- every attitude, standardized like the answers of the respondents in the dimensional analysis,
-- then weighted by the score weights. A score is in standard deviations of individual
-- respondents, so riding scores stay much closer to 0 than individual ones.
CREATE OR REPLACE TABLE analytics.fed_dimension_draws AS
WITH respondent_scales AS (
    SELECT
        question,
        avg(score) AS respondent_mean,
        stddev_samp(score) AS respondent_sd
    FROM analytics.respondent_scores
    GROUP BY question
),

mean_estimates AS (
    SELECT
        e.question,
        e.draw,
        e.fed23,
        sum(s.rank * e.estimate) AS estimate
    FROM analytics.fed_estimates AS e
    INNER JOIN analytics.mrp_scales AS s
        USING (question, category)
    GROUP BY e.question, e.draw, e.fed23
),

standardized_estimates AS (
    SELECT
        m.question,
        m.draw,
        m.fed23,
        (m.estimate - r.respondent_mean) / r.respondent_sd AS z_score
    FROM mean_estimates AS m
    INNER JOIN respondent_scales AS r
        USING (question)
)

SELECT
    l.dimension,
    z.draw,
    z.fed23,
    sum(l.weight * z.z_score) AS score
FROM standardized_estimates AS z
INNER JOIN analytics.dimension_loadings AS l
    USING (question)
GROUP BY l.dimension, z.draw, z.fed23
ORDER BY l.dimension, z.fed23, z.draw;
