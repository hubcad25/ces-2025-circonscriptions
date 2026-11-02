from pathlib import Path

from pipeline.extract.download import download

URL = "https://elections.ca/res/rep/off/ovrGE45/62/data_donnees/table_tableau12.csv"
SHA256 = "6ec3f8e1d8a555db36366223324bc53d95f4d095914012f27b6d0043cd6f90f9"
DESTINATION = Path("data/raw/results/table_tableau12.csv")

if __name__ == "__main__":
    download(URL, DESTINATION, SHA256)
