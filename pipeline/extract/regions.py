import urllib.parse
import urllib.request
from pathlib import Path

# Economic regions, merged into the regions of the model (sql/staging/regions.sql).
BOUNDARIES_URL = "https://geo.statcan.gc.ca/geo_wa/rest/services/2021/Cartographic_boundary_files/MapServer/2/query"
DESTINATION = Path("data/raw/regions/boundaries.geojson")

# All 76 economic regions fit in one page. Outlines are simplified to about 1 km: they only
# serve to find which region each dissemination area falls in.
PARAMS = {
    "where": "1=1",
    "outFields": "ERUID,ERNAME,PRUID",
    "outSR": "4326",
    "maxAllowableOffset": "0.01",
    "f": "geojson",
}


def download_boundaries(destination: Path) -> None:
    if destination.exists():
        return
    url = f"{BOUNDARIES_URL}?{urllib.parse.urlencode(PARAMS)}"
    content = urllib.request.urlopen(url).read()
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(content)


if __name__ == "__main__":
    download_boundaries(DESTINATION)
