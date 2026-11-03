INSTALL spatial;
LOAD spatial;

CREATE SCHEMA IF NOT EXISTS analytics;

-- Riding-level predictors for the MRP model, standardized so that their slopes share one prior.
CREATE OR REPLACE TABLE analytics.fed_predictors AS
WITH language_shares AS (
    SELECT
        fed13,
        sum(n) FILTER (WHERE language = 'french') / sum(n) AS french,
        sum(n) FILTER (WHERE language = 'other') / sum(n) AS other_language
    FROM staging.census_age_gender_language
    GROUP BY fed13
),

education_shares AS (
    SELECT
        fed13,
        sum(n) FILTER (WHERE education = 'bachelor_plus') / sum(n) AS bachelor_plus
    FROM staging.census_education_gender
    GROUP BY fed13
),

-- Areas come from EPSG:3347 (in metres), which is close enough to equal-area for a log scale.
densities AS (
    SELECT
        r.fed13,
        ln(p.population / (ST_Area(r.geom) / 1e6)) AS log_density
    FROM staging.ridings_2013 AS r
    INNER JOIN staging.riding_population AS p
        ON p.fed = r.fed13 AND p.representation_order = 2013
),

predictors AS (
    SELECT *
    FROM language_shares
    INNER JOIN education_shares USING (fed13)
    INNER JOIN densities USING (fed13)
)

SELECT
    fed13,
    (french - avg(french) OVER ()) / stddev(french) OVER () AS french,
    (other_language - avg(other_language) OVER ()) / stddev(other_language) OVER ()
        AS other_language,
    (bachelor_plus - avg(bachelor_plus) OVER ()) / stddev(bachelor_plus) OVER ()
        AS bachelor_plus,
    (log_density - avg(log_density) OVER ()) / stddev(log_density) OVER () AS log_density
FROM predictors
ORDER BY fed13;
