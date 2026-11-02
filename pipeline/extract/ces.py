from pathlib import Path

from pipeline.extract.download import download

# 2025 Canadian Election Study, version 1: doi:10.7910/DVN/2YAQ8D (CC BY-NC 4.0).
URL = "https://dataverse.harvard.edu/api/access/datafile/13958997"
SHA256 = "e40bc83216cb4393d17e1b06b28c881a7358b43dfad7808e57705f41124e470d"
DESTINATION = Path("data/raw/ces/ces_2025_v1.dta")

if __name__ == "__main__":
    download(URL, DESTINATION, SHA256)
