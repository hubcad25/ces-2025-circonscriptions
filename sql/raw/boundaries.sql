INSTALL spatial;
LOAD spatial;

CREATE SCHEMA IF NOT EXISTS raw;

CREATE OR REPLACE TABLE raw.ridings_2013 AS
SELECT *
FROM st_read('/vsizip/data/raw/boundaries/fed2013.gdb.zip/federal_electoral_districts_boundaries_2013_en.gdb');

CREATE OR REPLACE TABLE raw.ridings_2023 AS
SELECT *
FROM st_read('/vsizip/data/raw/boundaries/fed2023_shp.zip/FED_CA_2023_EN.shp');
