INSTALL spatial;
LOAD spatial;

CREATE SCHEMA IF NOT EXISTS staging;

-- The 2013 file uses EPSG:3978; everything else (2023 ridings, block points) uses EPSG:3347.
-- Some 2013 ridings are stored as several features, hence the union.
CREATE OR REPLACE TABLE staging.ridings_2013 AS
SELECT
    fednum AS fed13,
    any_value(name) AS fed13_name,
    ST_Transform(ST_Union_Agg(Shape), 'EPSG:3978', 'EPSG:3347', always_xy := true) AS geom
FROM raw.ridings_2013
GROUP BY fednum;

CREATE OR REPLACE TABLE staging.ridings_2023 AS
SELECT
    FED_NUM AS fed23,
    ED_NAMEE AS fed23_name,
    geom
FROM raw.ridings_2023;
