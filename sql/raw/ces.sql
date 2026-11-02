CREATE SCHEMA IF NOT EXISTS raw;

CREATE OR REPLACE TABLE raw.ces AS
SELECT *
FROM 'data/raw/ces/ces.parquet';

CREATE OR REPLACE TABLE raw.ces_variables AS
SELECT *
FROM 'data/raw/ces/variables.parquet';

CREATE OR REPLACE TABLE raw.ces_value_labels AS
SELECT *
FROM 'data/raw/ces/value_labels.parquet';
