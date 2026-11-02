import urllib.request
from pathlib import Path

PROFILE_URL = "https://api.statcan.gc.ca/census-recensement/profile/sdmx/rest/data/STC_CP,DF_FED,{version}/A5..1.8.1"
# Census profile versions: 1.3 is the 2013 representation order, 2.0 the 2023 one.
# Characteristic 8 is the total population (age groups, 100% data).
VERSIONS = {"2013": "1.3", "2023": "2.0"}
DESTINATION = Path("data/raw/census/riding_population_{order}.csv")


def download_riding_population(order: str) -> None:
    destination = Path(str(DESTINATION).format(order=order))
    if destination.exists():
        return
    url = PROFILE_URL.format(version=VERSIONS[order])
    request = urllib.request.Request(url, headers={"Accept": "application/vnd.sdmx.data+csv"})
    content = urllib.request.urlopen(request).read()
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(content)


if __name__ == "__main__":
    for order in VERSIONS:
        download_riding_population(order)
