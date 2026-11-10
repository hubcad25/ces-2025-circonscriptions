-- The 200 most populous municipalities, each placed at its population-weighted centre rather
-- than at the middle of its outline: Halifax or Wood Buffalo cover large empty areas.
WITH da_points AS (
    SELECT
        da_id,
        ST_Point(avg(ST_X(geom)), avg(ST_Y(geom))) AS geom
    FROM staging.blocks
    GROUP BY da_id
),

da_subdivisions AS (
    SELECT
        subdivisions.csd_id,
        da_points.geom,
        da_population.population
    FROM da_points
    INNER JOIN staging.da_population AS da_population USING (da_id)
    INNER JOIN staging.subdivisions AS subdivisions
        ON ST_Within(da_points.geom, subdivisions.geom)
),

centres AS (
    SELECT
        csd_id,
        ST_Point(
            sum(ST_X(geom) * population) / sum(population),
            sum(ST_Y(geom) * population) / sum(population)
        ) AS geom
    FROM da_subdivisions
    WHERE population > 0
    GROUP BY csd_id
)

SELECT
    subdivisions.name_en,
    subdivisions.name_fr,
    subdivisions.population,
    ST_Transform(centres.geom, 'EPSG:3347', 'EPSG:4326', always_xy := true) AS geom
FROM staging.subdivisions AS subdivisions
INNER JOIN centres USING (csd_id)
ORDER BY subdivisions.population DESC
LIMIT 200
