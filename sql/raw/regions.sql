INSTALL spatial;
LOAD spatial;

CREATE SCHEMA IF NOT EXISTS raw;

CREATE OR REPLACE TABLE raw.region_boundaries AS
SELECT *
FROM st_read('data/raw/regions/boundaries.geojson');
