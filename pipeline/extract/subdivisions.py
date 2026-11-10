import urllib.parse
import urllib.request
from pathlib import Path

# Census subdivisions (municipalities), used to place city names on the map.
BOUNDARIES_URL = "https://geo.statcan.gc.ca/geo_wa/rest/services/2021/Cartographic_boundary_files/MapServer/9/query"
POPULATION_URL = (
    "https://api.statcan.gc.ca/census-recensement/profile/sdmx/rest/data/STC_CP,DF_CSD/A5..1.1.1"
)
BOUNDARIES_DESTINATION = Path("data/raw/subdivisions/boundaries.geojson")
POPULATION_DESTINATION = Path("data/raw/subdivisions/population.csv")

# All 5,161 subdivisions fit in one page (the server allows 6,000). Outlines are simplified to
# about 1 km: they only serve to find which subdivision each dissemination area falls in.
BOUNDARIES_PARAMS = {
    "where": "1=1",
    "outFields": "CSDUID,CSDNAME,CSDTYPE",
    "outSR": "4326",
    "maxAllowableOffset": "0.01",
    "resultRecordCount": "6000",
    "f": "geojson",
}


def download_boundaries(destination: Path) -> None:
    if destination.exists():
        return
    url = f"{BOUNDARIES_URL}?{urllib.parse.urlencode(BOUNDARIES_PARAMS)}"
    content = urllib.request.urlopen(url).read()
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(content)


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
    download_boundaries(BOUNDARIES_DESTINATION)
    download_population(POPULATION_DESTINATION)
