CREATE SCHEMA IF NOT EXISTS raw;

CREATE OR REPLACE TABLE raw.results_2021 AS
SELECT *
FROM read_csv('data/raw/results_2021/table_tableau12.csv');

CREATE OR REPLACE TABLE raw.turnout_2021 AS
SELECT *
FROM read_csv('data/raw/results_2021/table_tableau11.csv');
