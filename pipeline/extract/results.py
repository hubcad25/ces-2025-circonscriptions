import hashlib
import urllib.request
from pathlib import Path

URL = "https://elections.ca/res/rep/off/ovrGE45/62/data_donnees/table_tableau12.csv"
SHA256 = "6ec3f8e1d8a555db36366223324bc53d95f4d095914012f27b6d0043cd6f90f9"
DESTINATION = Path("data/raw/results/table_tableau12.csv")


def download(url: str, destination: Path, sha256: str) -> None:
    if destination.exists():
        return
    content = urllib.request.urlopen(url).read()
    received = hashlib.sha256(content).hexdigest()
    if received != sha256:
        raise ValueError(f"{url} has changed: expected SHA-256 {sha256}, got {received}")
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(content)


if __name__ == "__main__":
    download(URL, DESTINATION, SHA256)
