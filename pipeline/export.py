from pathlib import Path

import duckdb

from pipeline.load import DATABASE

DESTINATION = Path("web/public/data")
TABLES = ["fed_summaries", "vote_gaps"]

# Boundaries are simplified to 200 m, well below the size of the smallest riding (6.7 km²),
# which keeps the file near 400 kB once compressed. Web maps expect longitude/latitude.
RIDINGS_QUERY = """
SELECT
    fed23,
    fed23_name,
    ST_Transform(
        ST_SimplifyPreserveTopology(geom, 200), 'EPSG:3347', 'EPSG:4326', always_xy := true
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
        con.execute(f"""
            COPY ({RIDINGS_QUERY}) TO '{destination / "ridings.geojson"}'
            WITH (FORMAT GDAL, DRIVER 'GeoJSON', LAYER_CREATION_OPTIONS 'COORDINATE_PRECISION=5')
        """)


if __name__ == "__main__":
    export(DATABASE, DESTINATION)
