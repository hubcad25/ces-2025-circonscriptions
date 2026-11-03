import urllib.request
import zipfile
from pathlib import Path

from pipeline.extract.download import download

PROFILE_URL = "https://api.statcan.gc.ca/census-recensement/profile/sdmx/rest/data/STC_CP,DF_FED,{version}/{key}"
# Census profile versions: 1.3 is the 2013 representation order, 2.0 the 2023 one.
VERSIONS = {"2013": "1.3", "2023": "2.0"}
# Key: frequency.area.gender.characteristic.statistic. Characteristic 8 is the total population.
POPULATION_KEY = "A5..1.8.1"
# Highest certificate for men+ and women+ aged 15+: total, none, secondary, postsecondary
# below bachelor, bachelor or higher.
EDUCATION_KEY = "A5..2+3.1998+1999+2000+2002+2008.1"

TABLE_URL = "https://www150.statcan.gc.ca/n1/tbl/csv/{table}-eng.zip"
TABLES = {
    # Mother tongue by age and gender, 2013 ridings.
    "98100209": "d4a6a50bf3741fea23b36ea684639ae0584e2ec116128bae5ca9fa5409444cd0",
    # Highest certificate by age and gender, provinces.
    "98100386": "b41cf099e5ce22f6467bdcfd57ef9d736e2be52143b0982f9b1424ac26b4fee2",
}
OUTPUT_DIR = Path("data/raw/census")


def download_profile(version: str, key: str, destination: Path) -> None:
    if destination.exists():
        return
    url = PROFILE_URL.format(version=version, key=key)
    request = urllib.request.Request(url, headers={"Accept": "application/vnd.sdmx.data+csv"})
    content = urllib.request.urlopen(request).read()
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(content)


if __name__ == "__main__":
    for order, version in VERSIONS.items():
        download_profile(version, POPULATION_KEY, OUTPUT_DIR / f"riding_population_{order}.csv")
    download_profile(VERSIONS["2013"], EDUCATION_KEY, OUTPUT_DIR / "education_gender_2013.csv")
    for table, sha256 in TABLES.items():
        archive = OUTPUT_DIR / f"{table}.zip"
        download(TABLE_URL.format(table=table), archive, sha256)
        zipfile.ZipFile(archive).extract(f"{table}.csv", OUTPUT_DIR)
