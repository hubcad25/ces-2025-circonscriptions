import hashlib
import urllib.request
from pathlib import Path


def download(url: str, destination: Path, sha256: str) -> None:
    if destination.exists():
        return
    content = urllib.request.urlopen(url).read()
    received = hashlib.sha256(content).hexdigest()
    if received != sha256:
        raise ValueError(f"{url} has changed: expected SHA-256 {sha256}, got {received}")
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(content)
