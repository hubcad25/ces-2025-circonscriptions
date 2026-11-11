import json
import shutil
import subprocess
from pathlib import Path

import duckdb

from pipeline.load import DATABASE

DESTINATION = Path("web/public/data")
QUERIES = Path("sql/export")
# Not a survey question: the official 2025 vote, as named in web/src/questions.ts.
OFFICIAL_RESULTS = "official_results"

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


# Vector tiles cut ahead of time, so that the browser does not have to cut the GeoJSON on every
# zoom. Zoom 8 is already finer than the 500 m simplification; MapLibre scales it past that.
# Shared nodes are kept so that neighbours simplify the same way at low zooms, without gaps;
# no feature or tile size limit, so that no riding is dropped or turned into a square.
def export_tiles(geojson: Path) -> None:
    subprocess.run(
        [
            "tippecanoe",
            f"--output={geojson.with_suffix('.pmtiles')}",
            "--force",
            "--quiet",
            "--layer=ridings",
            "--maximum-zoom=8",
            "--no-simplification-of-shared-nodes",
            "--no-tiny-polygon-reduction",
            "--no-feature-limit",
            "--no-tile-size-limit",
            str(geojson),
        ],
        check=True,
    )


def query(con: duckdb.DuckDBPyConnection, name: str) -> list[dict]:
    cursor = con.execute((QUERIES / f"{name}.sql").read_text())
    columns = [column[0] for column in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def write_json(path: Path, data: object) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")))


# National and provincial references: summaries[question][category][area].
def export_summaries(con: duckdb.DuckDBPyConnection, destination: Path) -> None:
    summaries = {}
    for row in query(con, "summaries"):
        categories = summaries.setdefault(row["question"], {})
        categories.setdefault(row["category"], {})[row["area"]] = row["estimate_mean"]
    write_json(destination / "summaries.json", summaries)


# One file per question for the map and table: [fed23, mean, low, high] by category. The
# official result is written as a question of its own, without uncertainty.
def export_questions(estimates: list[dict], destination: Path) -> None:
    questions = {}
    for row in estimates:
        interval = [row["estimate_mean"], row["estimate_low"], row["estimate_high"]]
        categories = questions.setdefault(row["question"], {})
        categories.setdefault(row["category"], []).append([row["fed23"], *interval])
        if row["question"] == "vote_post" and row["actual_share"] is not None:
            results = questions.setdefault(OFFICIAL_RESULTS, {}).setdefault(row["category"], [])
            results.append([row["fed23"], *[row["actual_share"]] * 3])
    folder = destination / "questions"
    shutil.rmtree(folder, ignore_errors=True)
    folder.mkdir()
    for question, categories in questions.items():
        write_json(folder / f"{question}.json", categories)


# One file per riding for its page: [mean, low, high] by question and category, followed by the
# official result for the vote, the similar and different ridings by topic, and the census traits
# that stand out: [trait, share, reference share] by reference (province or canada).
def export_ridings(
    con: duckdb.DuckDBPyConnection, estimates: list[dict], destination: Path
) -> None:
    ridings = {}
    for row in estimates:
        values = [row["estimate_mean"], row["estimate_low"], row["estimate_high"]]
        if row["actual_share"] is not None:
            values.append(row["actual_share"])
        riding = ridings.setdefault(row["fed23"], {"estimates": {}, "similar": {}, "census": {}})
        categories = riding["estimates"].setdefault(row["question"], {})
        categories[row["category"]] = values
    for row in query(con, "similar"):
        ridings[row["fed23"]]["similar"][row["topic"]] = {
            "similar": row["similar"],
            "different": row["different"],
        }
    for row in query(con, "census_highlights"):
        traits = ridings[row["fed23"]]["census"].setdefault(row["reference"], [])
        traits.append([row["trait"], row["share"], row["reference_share"]])
    folder = destination / "ridings"
    shutil.rmtree(folder, ignore_errors=True)
    folder.mkdir()
    for fed23, riding in ridings.items():
        write_json(folder / f"{fed23}.json", riding)


# Estimates against the official vote: [fed23, mean, low, high, result] by question and party.
def export_validation(estimates: list[dict], destination: Path) -> None:
    validation = {}
    for row in estimates:
        if row["actual_share"] is None:
            continue
        parties = validation.setdefault(row["question"], {})
        parties.setdefault(row["category"], []).append(
            [
                row["fed23"],
                row["estimate_mean"],
                row["estimate_low"],
                row["estimate_high"],
                row["actual_share"],
            ]
        )
    write_json(destination / "validation.json", validation)


# The attitude dimensions: [question, loading] and [fed23, mean, low, high] by dimension, and
# the score of Canada and of each province by dimension and area.
def export_dimensions(con: duckdb.DuckDBPyConnection, destination: Path) -> None:
    dimensions = {"loadings": {}, "ridings": {}, "references": {}}
    for row in query(con, "dimension_loadings"):
        loadings = dimensions["loadings"].setdefault(row["dimension"], [])
        loadings.append([row["question"], row["loading"]])
    for row in query(con, "dimension_scores"):
        ridings = dimensions["ridings"].setdefault(row["dimension"], [])
        ridings.append([row["fed23"], row["score_mean"], row["score_low"], row["score_high"]])
    for row in query(con, "dimension_references"):
        dimensions["references"].setdefault(row["dimension"], {})[row["area"]] = row["score"]
    write_json(destination / "dimensions.json", dimensions)


def export(database: Path, destination: Path) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    with duckdb.connect(database, read_only=True) as con:
        # A temporary table lives in memory, so it works on a read-only database.
        con.execute((QUERIES / "site_questions.sql").read_text())
        write_json(destination / "riding_names.json", query(con, "riding_names"))
        export_summaries(con, destination)
        estimates = query(con, "estimates")
        export_questions(estimates, destination)
        export_ridings(con, estimates, destination)
        export_validation(estimates, destination)
        write_json(destination / "survey_means.json", query(con, "survey_means"))
        export_dimensions(con, destination)
        con.execute("LOAD spatial")
        cities_query = (QUERIES / "cities.sql").read_text()
        for name, query_text in [("ridings", RIDINGS_QUERY), ("cities", cities_query)]:
            con.execute(f"""
                COPY ({query_text}) TO '{destination / f"{name}.geojson"}'
                WITH (
                    FORMAT GDAL, DRIVER 'GeoJSON', LAYER_CREATION_OPTIONS 'COORDINATE_PRECISION=5'
                )
            """)
    export_tiles(destination / "ridings.geojson")


if __name__ == "__main__":
    export(DATABASE, DESTINATION)
