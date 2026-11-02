from pathlib import Path

import duckdb

DATABASE = Path("data/ces.duckdb")
SQL_LAYERS = [Path("sql/raw"), Path("sql/staging"), Path("sql/analytics")]


def build(database: Path) -> None:
    with duckdb.connect(database) as con:
        for layer in SQL_LAYERS:
            for script in sorted(layer.glob("*.sql")):
                con.execute(script.read_text())


if __name__ == "__main__":
    build(DATABASE)
