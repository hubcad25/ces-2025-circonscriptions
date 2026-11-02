INSTALL spatial;
LOAD spatial;

CREATE SCHEMA IF NOT EXISTS staging;

-- A dissemination block ID is its dissemination area ID (8 digits) followed by 3 digits.
CREATE OR REPLACE TABLE staging.blocks AS
SELECT
    DBUID AS block_id,
    left(DBUID, 8) AS da_id,
    ST_Point(DBRPLAMX, DBRPLAMY) AS geom
FROM raw.block_points;

CREATE OR REPLACE TABLE staging.da_population AS
SELECT
    ALT_GEO_CODE AS da_id,
    OBS_VALUE::INTEGER AS population
FROM raw.da_population;
