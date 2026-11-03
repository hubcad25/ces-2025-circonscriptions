from pathlib import Path

import duckdb

from pipeline.load import DATABASE

DESTINATION = Path("web/public/data")
TABLES = ["fed_summaries", "vote_gaps"]


def export(database: Path, destination: Path) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    with duckdb.connect(database, read_only=True) as con:
        for table in TABLES:
            path = destination / f"{table}.parquet"
            con.execute(f"COPY analytics.{table} TO '{path}' (FORMAT parquet, COMPRESSION zstd)")


if __name__ == "__main__":
    export(DATABASE, DESTINATION)
