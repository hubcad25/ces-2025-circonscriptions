from pathlib import Path

import duckdb

from pipeline.load import DATABASE

DESTINATION = Path("web/public/data")
TABLES = ["fed_summaries", "national_summaries", "vote_gaps"]

# Boundaries are simplified to 500 m, below the size of the smallest riding (6.7 km²),
# which keeps the file near 650 kB once compressed. Ridings are simplified together as a
# coverage so that neighbours keep a shared border, without gaps or overlaps. Web maps expect
# longitude/latitude.
RIDINGS_QUERY = """
WITH simplified AS (
    SELECT
        list(fed23 ORDER BY fed23) AS ridings,
        list(fed23_name ORDER BY fed23) AS names,
        ST_CoverageSimplify_Agg(geom::GEOMETRY, 500.0 ORDER BY fed23) AS coverage
    FROM staging.ridings_2023
),

-- The first path element is the riding's position in the coverage; ridings made of several
-- polygons (islands) come out as several parts with the same position.
parts AS (
    SELECT unnest(ST_Dump(coverage)) AS part, ridings, names
    FROM simplified
)

SELECT
    any_value(ridings[part.path[1]]) AS fed23,
    any_value(names[part.path[1]]) AS fed23_name,
    ST_Transform(
        ST_Collect(list(part.geom)), 'EPSG:3347', 'EPSG:4326', always_xy := true
    ) AS geom
FROM parts
GROUP BY part.path[1]
"""

# Canada's outline, coarse (3 km), used by the map to keep place names inside Canada.
CANADA_QUERY = """
SELECT ST_Transform(
    ST_SimplifyPreserveTopology(
        ST_Union_Agg(ST_SimplifyPreserveTopology(geom::GEOMETRY, 500)), 3000
    ),
    'EPSG:3347',
    'EPSG:4326',
    always_xy := true
) AS geom
FROM staging.ridings_2023
"""


def export(database: Path, destination: Path) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    with duckdb.connect(database, read_only=True) as con:
        for table in TABLES:
            path = destination / f"{table}.parquet"
            con.execute(f"COPY analytics.{table} TO '{path}' (FORMAT parquet, COMPRESSION zstd)")
        con.execute("LOAD spatial")
        for name, query in [("ridings", RIDINGS_QUERY), ("canada", CANADA_QUERY)]:
            con.execute(f"""
                COPY ({query}) TO '{destination / f"{name}.geojson"}'
                WITH (
                    FORMAT GDAL, DRIVER 'GeoJSON', LAYER_CREATION_OPTIONS 'COORDINATE_PRECISION=5'
                )
            """)


if __name__ == "__main__":
    export(DATABASE, DESTINATION)
