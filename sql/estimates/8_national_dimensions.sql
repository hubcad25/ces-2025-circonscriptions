CREATE SCHEMA IF NOT EXISTS analytics;

-- Score of Canada on each dimension, the reference the ridings are compared with: the national
-- mean position on every attitude, projected like the ridings in analytics.fed_dimension_draws.
CREATE OR REPLACE TABLE analytics.national_dimensions AS
WITH standardized_estimates AS (
    SELECT
        n.question,
        (n.estimate_mean - r.respondent_mean) / r.respondent_sd AS z_score
    FROM analytics.national_summaries AS n
    INNER JOIN analytics.respondent_scales AS r
        USING (question)
    WHERE n.category = 'mean'
)

SELECT
    l.dimension,
    sum(l.weight * z.z_score) AS score
FROM standardized_estimates AS z
INNER JOIN analytics.dimension_loadings AS l
    USING (question)
GROUP BY l.dimension
ORDER BY l.dimension;
