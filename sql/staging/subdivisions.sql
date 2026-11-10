INSTALL spatial;
LOAD spatial;

CREATE SCHEMA IF NOT EXISTS staging;

-- Bilingual subdivisions are named "English / French"; the others have one name for both.
CREATE OR REPLACE TABLE staging.subdivisions AS
SELECT
    boundaries.CSDUID AS csd_id,
    split_part(boundaries.CSDNAME, ' / ', 1) AS name_en,
    coalesce(
        nullif(split_part(boundaries.CSDNAME, ' / ', 2), ''),
        boundaries.CSDNAME
    ) AS name_fr,
    population.OBS_VALUE::INTEGER AS population,
    ST_Transform(boundaries.geom, 'EPSG:4326', 'EPSG:3347', always_xy := true) AS geom
FROM raw.subdivision_boundaries AS boundaries
INNER JOIN raw.subdivision_population AS population
    ON boundaries.CSDUID = population.ALT_GEO_CODE;
