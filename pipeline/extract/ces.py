from pathlib import Path

import duckdb
import pandas as pd
import pyreadstat

from pipeline.extract.download import download

# 2025 Canadian Election Study, version 1: doi:10.7910/DVN/2YAQ8D (CC BY-NC 4.0).
URL = "https://dataverse.harvard.edu/api/access/datafile/13958997"
SHA256 = "e40bc83216cb4393d17e1b06b28c881a7358b43dfad7808e57705f41124e470d"
DTA = Path("data/raw/ces/ces_2025_v1.dta")
OUTPUT_DIR = Path("data/raw/ces")


def write_parquet(frame: pd.DataFrame, destination: Path) -> None:
    with duckdb.connect() as con:
        con.register("frame", frame)
        con.execute(f"COPY frame TO '{destination}' (FORMAT parquet)")


# DuckDB cannot read Stata files, so the survey and its labels are converted to Parquet.
def convert_to_parquet(dta: Path, output_dir: Path) -> None:
    if (output_dir / "ces.parquet").exists():
        return
    data, meta = pyreadstat.read_dta(dta)
    variables = pd.DataFrame(
        {
            "variable": meta.column_names,
            "label": [meta.column_names_to_labels[name] for name in meta.column_names],
        }
    )
    value_labels = pd.DataFrame(
        [
            {"variable": variable, "code": code, "label": label}
            for variable, labels in meta.variable_value_labels.items()
            for code, label in labels.items()
        ]
    )
    # Integer columns with missing values come back as Python objects.
    write_parquet(data.convert_dtypes(), output_dir / "ces.parquet")
    write_parquet(variables, output_dir / "variables.parquet")
    write_parquet(value_labels, output_dir / "value_labels.parquet")


if __name__ == "__main__":
    download(URL, DTA, SHA256)
    convert_to_parquet(DTA, OUTPUT_DIR)
