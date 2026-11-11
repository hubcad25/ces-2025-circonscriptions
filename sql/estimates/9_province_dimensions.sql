CREATE SCHEMA IF NOT EXISTS analytics;

-- Score of each province on each dimension, the reference when a province is chosen: projected
-- like Canada in analytics.national_dimensions.
CREATE OR REPLACE TABLE analytics.province_dimensions AS
WITH standardized_estimates AS (
    SELECT
        p.question,
        p.province_code,
        (p.estimate_mean - r.respondent_mean) / r.respondent_sd AS z_score
    FROM analytics.province_summaries AS p
    INNER JOIN analytics.respondent_scales AS r
        USING (question)
    WHERE p.category = 'mean'
)

SELECT
    l.dimension,
    z.province_code,
    sum(l.weight * z.z_score) AS score
FROM standardized_estimates AS z
INNER JOIN analytics.dimension_loadings AS l
    USING (question)
GROUP BY l.dimension, z.province_code
ORDER BY l.dimension, z.province_code;
