CREATE SCHEMA IF NOT EXISTS raw;

CREATE OR REPLACE TABLE raw.results AS
SELECT *
FROM read_csv('data/raw/results/table_tableau12.csv');
