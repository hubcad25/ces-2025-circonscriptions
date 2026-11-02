from pathlib import Path

from pipeline.extract.download import download

BASE_URL = "https://ftp.maps.canada.ca/pub/elections_elections/Electoral-districts_Circonscription-electorale"
URL_2013 = f"{BASE_URL}/federal_electoral_districts_boundaries_2013/federal_electoral_districts_boundaries_2013_en.gdb.zip"
URL_2023 = f"{BASE_URL}/federal_electoral_districts_boundaries_2023/FED_CA_2023_EN-SHP.zip"

FILES = [
    (
        URL_2013,
        "ca84c13d4db88ce34b9ee638a5bce5c7064d04feb7c5365c1e0ae09ac3236b10",
        Path("data/raw/boundaries/fed2013.gdb.zip"),
    ),
    (
        URL_2023,
        "eab55b952164ba7e8bf569f00c1fe4b6480b532411e1436de427772d9cebae59",
        Path("data/raw/boundaries/fed2023_shp.zip"),
    ),
]

if __name__ == "__main__":
    for url, sha256, destination in FILES:
        download(url, destination, sha256)
