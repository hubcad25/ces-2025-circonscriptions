CREATE SCHEMA IF NOT EXISTS staging;

CREATE OR REPLACE TABLE staging.riding_population AS
SELECT
    2013 AS representation_order,
    ALT_GEO_CODE::INTEGER AS fed,
    OBS_VALUE::INTEGER AS population
FROM raw.riding_population_2013
UNION ALL
SELECT
    2023 AS representation_order,
    ALT_GEO_CODE::INTEGER AS fed,
    OBS_VALUE::INTEGER AS population
FROM raw.riding_population_2023;
