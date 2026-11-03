from pathlib import Path

import duckdb

DATABASE = Path("data/ces.duckdb")
SQL_LAYERS = [Path("sql/raw"), Path("sql/staging"), Path("sql/analytics")]


def run_scripts(con: duckdb.DuckDBPyConnection, directory: Path) -> None:
    for script in sorted(directory.glob("*.sql")):
        con.execute(script.read_text())


def build(database: Path) -> None:
    with duckdb.connect(database) as con:
        for layer in SQL_LAYERS:
            run_scripts(con, layer)


if __name__ == "__main__":
    build(DATABASE)
