CREATE SCHEMA IF NOT EXISTS raw;

CREATE OR REPLACE TABLE raw.riding_population_2013 AS
SELECT *
FROM read_csv('data/raw/census/riding_population_2013.csv');

CREATE OR REPLACE TABLE raw.riding_population_2023 AS
SELECT *
FROM read_csv('data/raw/census/riding_population_2023.csv');

CREATE OR REPLACE TABLE raw.riding_traits_2023 AS
SELECT *
FROM read_csv('data/raw/census/riding_traits_2023.csv');
