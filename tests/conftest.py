import duckdb
import pytest

from pipeline.load import DATABASE


@pytest.fixture(scope="session")
def con():
    with duckdb.connect(DATABASE, read_only=True) as con:
        yield con
