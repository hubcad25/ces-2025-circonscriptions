INSTALL spatial;
LOAD spatial;

CREATE SCHEMA IF NOT EXISTS analytics;

-- Region of each 2013 riding: the region that holds most of its population. Each dissemination
-- area is placed at the mean of its blocks, as in sql/export/cities.sql.
CREATE OR REPLACE TABLE analytics.fed_regions AS
WITH da_points AS (
    SELECT
        da_id,
        ST_Point(avg(ST_X(geom)), avg(ST_Y(geom))) AS geom
    FROM staging.blocks
    GROUP BY da_id
),

-- The first four digits of a dissemination area ID are its census division: 3520 is the City
-- of Toronto, split from the rest of the Toronto economic region.
da_regions AS (
    SELECT
        da_points.da_id,
        CASE
            WHEN left(da_points.da_id, 4) = '3520' THEN 'City of Toronto'
            ELSE regions.region
        END AS region,
        da_points.geom
    FROM da_points
    INNER JOIN staging.economic_regions AS regions
        ON ST_Within(da_points.geom, regions.geom)
),

riding_regions AS (
    SELECT
        ridings.fed13,
        da_regions.region,
        sum(da_population.population) AS population
    FROM da_regions
    INNER JOIN staging.da_population AS da_population USING (da_id)
    INNER JOIN staging.ridings_2013 AS ridings
        ON ST_Within(da_regions.geom, ridings.geom)
    GROUP BY ridings.fed13, da_regions.region
)

SELECT
    fed13,
    arg_max(region, population) AS region
FROM riding_regions
GROUP BY fed13
ORDER BY fed13;
