from pathlib import Path

from pipeline.extract.download import download

# The 2021 election used the 2013 boundaries, the same as the CES riding codes.
BASE_URL = "https://elections.ca/res/rep/off/ovr2021app/53/data_donnees"
FILES = {
    "table_tableau11.csv": "de9e2c378c8ad480825bd5de8a58ba578388e9451402d25c4343119d7b698032",
    "table_tableau12.csv": "c4c6649bbaf17637327613cb71c40fd18bd42d3c3b32e0968ace4c08b6e176c1",
}
DESTINATION = Path("data/raw/results_2021")

if __name__ == "__main__":
    for name, sha256 in FILES.items():
        download(f"{BASE_URL}/{name}", DESTINATION / name, sha256)
