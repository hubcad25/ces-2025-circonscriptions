# CES 2025 by riding

Riding-level estimates (2023 boundaries) of vote intention and political attitudes from the 2025 Canadian Election Study, using multilevel regression and poststratification (MRP).

<!--- Vote estimates are compared to the official results of the April 28, 2025 election. --->

Pipeline: Python and SQL (DuckDB). Website: https://hubcad25.github.io/ces-2025-circonscriptions/ (React, MapLibre), with a map and table of the estimates by riding, a page per riding, and a validation table against the official results.

## Run

Requires [uv](https://docs.astral.sh/uv/) (installs Python 3.12) and, for `make export`, [tippecanoe](https://github.com/felt/tippecanoe).

```bash
make install   # dependencies
make extract   # downloads raw data into data/raw/ (143 MB), checks SHA-256 (~9 min)
make build     # runs sql/raw, sql/staging, sql/analytics and the census raking (~1 min)
make mrp       # fits the MRP model for the vote and attitude questions (~75 min)
make export    # writes the website data to web/public/data/ (JSON, GeoJSON, PMTiles)
make tables    # lists tables and row counts
make show TABLE=analytics.results_fed   # previews a table
make ui        # DuckDB web UI, read-only
make lint      # ruff check + format --check
make test      # data quality checks on data/ces.duckdb
```

Times were measured on a 16-core laptop; `make mrp` runs four MCMC chains in parallel and is slower with fewer cores. A fit stops with an error if its chains disagree (split R-hat above 1.1), so that a stuck chain never reaches the estimates.

To check a code change without waiting for a full fit, `uv run python -m pipeline.mrp <question> --quick` runs 20 iterations per chain (about 20 s) and saves nothing.

`make test` reads the built database: run `make build` first. `make ui` opens the database read-only; close it before `make build`, since DuckDB allows a single writer.

## Sources

| Source | Data | Link |
|---|---|---|
| Canadian Election Study | 2025 CES, version 1 (CC BY-NC 4.0) | https://doi.org/10.7910/DVN/2YAQ8D |
| Elections Canada | 45th general election (April 28, 2025), table 12 "Detailed results by electoral district" | https://elections.ca/res/rep/off/ovrGE45/62/data_donnees/table_tableau12.csv |
| Elections Canada | 44th general election (September 20, 2021), tables 11 and 12 (turnout and results by electoral district, 2013 boundaries) | https://elections.ca/res/rep/off/ovr2021app/53/data_donnees/ |
| Natural Resources Canada | Federal electoral district boundaries, 2013 and 2023 representation orders | https://ftp.maps.canada.ca/pub/elections_elections/Electoral-districts_Circonscription-electorale/ |
| Statistics Canada | Representative points of 2021 dissemination blocks | https://geo.statcan.gc.ca/geo_wa/rest/services/2021/Cartographic_boundary_files/MapServer/13 |
| Statistics Canada | 2021 census subdivision boundaries, for the city names on the map | https://geo.statcan.gc.ca/geo_wa/rest/services/2021/Cartographic_boundary_files/MapServer/9 |
| Statistics Canada | 2021 census population of census subdivisions | https://api.statcan.gc.ca/census-recensement/profile/sdmx/rest/data/STC_CP,DF_CSD/A5..1.1.1 |
| Statistics Canada | 2021 economic region boundaries, merged into the regions of the model | https://geo.statcan.gc.ca/geo_wa/rest/services/2021/Cartographic_boundary_files/MapServer/2 |
| Statistics Canada | 2021 Census profile: population by dissemination area and by riding, education by gender by riding | https://api.statcan.gc.ca/census-recensement/profile/sdmx/rest |
| Statistics Canada | Table 98-10-0209: mother tongue by age and gender, 2013 ridings | https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=9810020901 |
| Statistics Canada | Table 98-10-0386: highest certificate by age and gender, provinces | https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=9810038601 |
| OpenFreeMap | Place names on the minimap of the riding page (OpenMapTiles, OpenStreetMap data), loaded by the browser | https://openfreemap.org |

Raw data is not versioned (`data/` is ignored by Git); the scripts download it again.

## Structure

- `pipeline/`: Python scripts (source extraction, running the SQL layers, census raking, MRP model)
- `sql/raw`: sources as received
- `sql/staging`: cleaned data, one table per source
- `sql/analytics`: analysis tables
- `sql/estimates`: poststratification and validation, run after the MRP model
- `sql/export`: the JSON files of the website (one per question, one per riding, validation) and the city names of the map, written by `make export`
- `tests/`: data quality checks
- `web/`: the website (React + Vite), deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`

Current tables:
- `raw.results`: raw Elections Canada export
- `raw.results_2021`, `raw.turnout_2021`: 2021 Elections Canada results and turnout, on 2013 boundaries
- `raw.ces`, `raw.ces_variables`, `raw.ces_value_labels`: the CES Stata file, converted to Parquet because DuckDB cannot read Stata
- `staging.respondents`: one row per CES respondent with 2013 riding, province and census-aligned age, gender, education and mother tongue, plus recalled 2021 vote (`past_vote`, "don't know" left null); non-binary respondents (0.8%) are grouped with men, since the census only publishes "Men+" and "Women+"; respondents who learned both English and French as children are classified by the language of the interview
- `staging.responses`: long format, one row per respondent × coded question (4.7M rows, 469 questions)
- `staging.variables`, `staging.value_labels`: question wording, survey wave and answer labels
- `staging.candidates`: one row per candidate; the party is parsed from the bilingual suffix attached to the name, the six main parties are kept apart, others are grouped as `OTH`
- `staging.ridings_2013`, `staging.ridings_2023`: riding boundaries, in EPSG:3347
- `staging.blocks`, `staging.da_population`: dissemination blocks (representative point) and dissemination area populations
- `staging.subdivisions`: census subdivisions (municipalities) with their population and English and French names; the 200 largest name places on the map, each at its population-weighted centre
- `staging.economic_regions`: the 76 economic regions, each assigned to one of 50 regions of the model (merged within a province so that a region holds about three ridings or more)
- `staging.riding_population`: official population by riding, 2013 and 2023 boundaries
- `staging.census_age_gender_language`, `staging.census_education_gender`, `staging.census_province_education`: census counts used to build poststratification cells
- `analytics.fed_crosswalk`: share of each 2013 riding's population in each 2023 riding, from a spatial join of blocks; a dissemination area's population is split evenly across its blocks (median gap with official riding populations 0.16%, max 4.2%)
- `analytics.census_cells`: adults by 2013 riding × age (8) × gender (2) × education (4) × mother tongue (3) × 2021 vote (6, non-voters included), built by iterative proportional fitting: a provincial age × gender × education structure, times the survey's 2021 vote by province and age, is raked to each riding's age × gender × language, education × gender and 2021 vote counts, since the census does not publish education by age for ridings
- `analytics.results_fed`: one row per riding × party (votes, share, rank, winner, lead over the next party); 343 ridings, matches the official seat count (169 LPC, 144 CPC, 22 BQ, 7 NDP, 1 GPC)
- `analytics.past_vote_fed`: share of 2021 electors by vote per 2013 riding, non-voters as `NONE`
- `analytics.fed_regions`: region of each 2013 riding, the one holding most of its population; the City of Toronto (census division 3520) is split from the rest of the Toronto economic region, for 51 regions
- `analytics.fed_predictors`: standardized riding predictors for the MRP model (French and other mother tongue, bachelor's degree, log density)
- `analytics.mrp_outcomes`: one row per respondent × question, recoded into the categories the model predicts: `vote_post`, `vote_pre` (LPC, CPC, NDP, BQ, OTH), and 42 ordinal attitude questions on government spending and responsibilities, the economy, Canada–US relations, Indigenous peoples, social values, democracy, immigration and language, Quebec and the federation (CES variable names in `sql/analytics/mrp_outcomes.sql`); "don't know" is dropped
- `analytics.province_questions`: questions asked in one province only (Quebec sovereignty); they are fitted and poststratified in that province and have no national summary
- `analytics.mrp_scales`: ordered categories of the ordinal questions, fitted with an ordered logit; the vote is fitted with a multinomial logit
- `analytics.mrp_draws`: 100 posterior draws of each category's probability per census cell (2021 vote averaged out), 32M rows per question
- `analytics.mrp_exclusions`: categories that cannot occur in a province (a party with no candidate there, i.e. the Bloc outside Quebec); the model gives them a probability of zero
- `analytics.fed_exclusions`: parties with no candidate in a 2023 riding (3 ridings in 2025, plus the Bloc outside Quebec)
- `analytics.fed_estimates`: poststratified share per 2023 riding × category × draw; a party with no candidate in the riding is set to zero and the other shares are rescaled
- `analytics.fed_summaries`: mean and widened 90% interval per question × 2023 riding × category, as read by the website; ordinal questions also get grouped answers and their mean position on the scale (`mean`)
- `analytics.national_summaries`: national share per question × category, from every census cell weighted by its adult population
- `analytics.province_summaries`: the same per province, which the map compares ridings with when a province is chosen
- `analytics.vote_gaps`, `analytics.interval_scale`: estimates of both vote questions against the 2025 results (mean absolute gap 3.92 points for `vote_post`, 5.14 for `vote_pre`), and the interval widening factor calibrated on `vote_post`

## Known limitations

- The CES under-represents people whose mother tongue is neither English nor French (6.7% of respondents vs 23.4% of adults in the census); poststratification restores their weight, but those cells rely on few respondents.
- Within a riding, the link between education and language is not constrained by any census table.
- Model intervals only reflect sampling uncertainty: on the 2025 vote, 90% intervals cover 72% of official results. Every interval is widened by a factor k (1.45, `analytics.interval_scale`) calibrated on the vote, assuming attitudes carry similar non-sampling error.
