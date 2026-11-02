CREATE SCHEMA IF NOT EXISTS raw;

CREATE OR REPLACE TABLE raw.block_points AS
SELECT *
FROM read_csv('data/raw/dissemination_areas/block_points.csv', types = {'DBUID': 'VARCHAR'});

CREATE OR REPLACE TABLE raw.da_population AS
SELECT *
FROM read_csv('data/raw/dissemination_areas/population.csv', types = {'ALT_GEO_CODE': 'VARCHAR'});
