INSTALL spatial;
LOAD spatial;

CREATE SCHEMA IF NOT EXISTS analytics;

-- Share of each 2013 riding's population that falls in each 2023 riding. Block populations
-- are not published, so a dissemination area's population is split evenly across its blocks.
CREATE OR REPLACE TABLE analytics.fed_crosswalk AS
WITH block_population AS (
    SELECT
        b.block_id,
        b.geom,
        p.population / count(*) OVER (PARTITION BY b.da_id) AS population
    FROM staging.blocks AS b
    INNER JOIN staging.da_population AS p
        ON b.da_id = p.da_id
),

block_ridings AS (
    SELECT
        r13.fed13,
        r23.fed23,
        bp.population
    FROM block_population AS bp
    INNER JOIN staging.ridings_2013 AS r13
        ON ST_Within(bp.geom, r13.geom)
    INNER JOIN staging.ridings_2023 AS r23
        ON ST_Within(bp.geom, r23.geom)
),

pairs AS (
    SELECT
        fed13,
        fed23,
        sum(population) AS population
    FROM block_ridings
    GROUP BY fed13, fed23
)

SELECT
    fed13,
    fed23,
    round(population)::INTEGER AS population,
    population / sum(population) OVER (PARTITION BY fed13) AS share_of_fed13,
    population / sum(population) OVER (PARTITION BY fed23) AS share_of_fed23
FROM pairs
ORDER BY fed13, fed23;
