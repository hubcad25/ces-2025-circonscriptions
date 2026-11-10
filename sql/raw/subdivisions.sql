INSTALL spatial;
LOAD spatial;

CREATE SCHEMA IF NOT EXISTS raw;

CREATE OR REPLACE TABLE raw.subdivision_boundaries AS
SELECT *
FROM st_read('data/raw/subdivisions/boundaries.geojson');

CREATE OR REPLACE TABLE raw.subdivision_population AS
SELECT *
FROM read_csv('data/raw/subdivisions/population.csv', types = {'ALT_GEO_CODE': 'VARCHAR'});
