import csv
import json
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

BLOCKS_URL = "https://geo.statcan.gc.ca/geo_wa/rest/services/2021/Cartographic_boundary_files/MapServer/13/query"
POPULATION_URL = (
    "https://api.statcan.gc.ca/census-recensement/profile/sdmx/rest/data/STC_CP,DF_DA/A5..1.1.1"
)
BLOCKS_DESTINATION = Path("data/raw/dissemination_areas/block_points.csv")
POPULATION_DESTINATION = Path("data/raw/dissemination_areas/population.csv")
PAGE_SIZE = 6000
ATTEMPTS = 5


# The StatCan server sometimes refuses connections during long pagination.
def fetch_json(url: str, params: dict) -> dict:
    for attempt in range(1, ATTEMPTS + 1):
        try:
            with urllib.request.urlopen(f"{url}?{urllib.parse.urlencode(params)}") as response:
                return json.load(response)
        except urllib.error.URLError:
            if attempt == ATTEMPTS:
                raise
            time.sleep(10 * attempt)


def download_block_points(destination: Path) -> None:
    if destination.exists():
        return
    count_params = {"where": "1=1", "returnCountOnly": "true", "f": "json"}
    count = fetch_json(BLOCKS_URL, count_params)["count"]
    rows = []
    for offset in range(0, count, PAGE_SIZE):
        page = fetch_json(
            BLOCKS_URL,
            {
                "where": "1=1",
                "outFields": "DBUID,DBRPLAMX,DBRPLAMY",
                "orderByFields": "OBJECTID",
                "resultOffset": offset,
                "resultRecordCount": PAGE_SIZE,
                "returnGeometry": "false",
                "f": "json",
            },
        )
        rows += [feature["attributes"] for feature in page["features"]]
    if len(rows) != count:
        raise ValueError(f"Expected {count} blocks, got {len(rows)}")
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("w", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=["DBUID", "DBRPLAMX", "DBRPLAMY"])
        writer.writeheader()
        writer.writerows(rows)


def download_population(destination: Path) -> None:
    if destination.exists():
        return
    request = urllib.request.Request(
        POPULATION_URL, headers={"Accept": "application/vnd.sdmx.data+csv"}
    )
    content = urllib.request.urlopen(request).read()
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(content)


if __name__ == "__main__":
    download_block_points(BLOCKS_DESTINATION)
    download_population(POPULATION_DESTINATION)
