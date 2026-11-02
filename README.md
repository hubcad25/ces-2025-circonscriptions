# CES 2025 by riding

Riding-level estimates (2023 boundaries) of vote intention and political attitudes from the 2025 Canadian Election Study, using multilevel regression and poststratification (MRP).

<!--- Vote estimates are compared to the official results of the April 28, 2025 election. --->

Pipeline: Python and SQL (DuckDB). Static dashboard: React.

## Run

Requires [uv](https://docs.astral.sh/uv/) (installs Python 3.12).

```bash
make install   # dependencies
make extract   # downloads raw data into data/raw/, checks SHA-256
make build     # runs sql/raw, sql/staging, then sql/analytics into data/ces.duckdb
make tables    # lists tables and row counts
make show TABLE=analytics.results_fed   # previews a table
make ui        # DuckDB web UI, read-only
make lint      # ruff check + format --check
make test      # data quality checks on data/ces.duckdb
```

`make test` reads the built database: run `make build` first. `make ui` opens the database read-only; close it before `make build`, since DuckDB allows a single writer.

## Sources

| Source | Data | Link |
|---|---|---|
| Canadian Election Study | 2025 CES, version 1 (CC BY-NC 4.0) | https://doi.org/10.7910/DVN/2YAQ8D |
| Elections Canada | 45th general election (April 28, 2025), table 12 "Detailed results by electoral district" | https://elections.ca/res/rep/off/ovrGE45/62/data_donnees/table_tableau12.csv |
| Natural Resources Canada | Federal electoral district boundaries, 2013 and 2023 representation orders | https://ftp.maps.canada.ca/pub/elections_elections/Electoral-districts_Circonscription-electorale/ |
| Statistics Canada | Representative points of 2021 dissemination blocks | https://geo.statcan.gc.ca/geo_wa/rest/services/2021/Cartographic_boundary_files/MapServer/13 |
| Statistics Canada | 2021 Census: population by dissemination area and by riding (2013 and 2023) | https://api.statcan.gc.ca/census-recensement/profile/sdmx/rest |

Raw data is not versioned (`data/` is ignored by Git); the scripts download it again.

## Structure

- `pipeline/`: Python scripts (source extraction, running the SQL layers)
- `sql/raw`: sources as received
- `sql/staging`: cleaned data, one table per source
- `sql/analytics`: analysis tables
- `tests/`: data quality checks

Current tables:
- `raw.results`: raw Elections Canada export
- `raw.ces`, `raw.ces_variables`, `raw.ces_value_labels`: the CES Stata file, converted to Parquet because DuckDB cannot read Stata
- `staging.respondents`: one row per CES respondent with 2013 riding, province and census-aligned age, gender and education; non-binary respondents (0.8%) are grouped with men, since the census only publishes "Men+" and "Women+"
- `staging.responses`: long format, one row per respondent × coded question (4.7M rows, 469 questions)
- `staging.variables`, `staging.value_labels`: question wording, survey wave and answer labels
- `staging.candidates`: one row per candidate; the party is parsed from the bilingual suffix attached to the name, the six main parties are kept apart, others are grouped as `OTH`
- `staging.ridings_2013`, `staging.ridings_2023`: riding boundaries, in EPSG:3347
- `staging.blocks`, `staging.da_population`: dissemination blocks (representative point) and dissemination area populations
- `staging.riding_population`: official population by riding, 2013 and 2023 boundaries
- `analytics.fed_crosswalk`: share of each 2013 riding's population in each 2023 riding, from a spatial join of blocks; a dissemination area's population is split evenly across its blocks (median gap with official riding populations 0.16%, max 4.2%)
- `analytics.results_fed`: one row per riding × party (votes, share, rank, winner, lead over the next party); 343 ridings, matches the official seat count (169 LPC, 144 CPC, 22 BQ, 7 NDP, 1 GPC)
