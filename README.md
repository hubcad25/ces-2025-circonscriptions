# CES 2025 by riding

Riding-level estimates (2023 boundaries) of vote intention and political attitudes from the 2025 Canadian Election Study, using multilevel regression and poststratification (MRP).

<!--- Vote estimates are compared to the official results of the April 28, 2025 election. --->

Pipeline: Python and SQL (DuckDB). Static dashboard: React.

## Run

Requires [uv](https://docs.astral.sh/uv/) (installs Python 3.12).

```bash
make install   # dependencies
make extract   # downloads raw data into data/raw/ (127 MB), checks SHA-256 (~9 min)
make build     # runs sql/raw, sql/staging, sql/analytics and the census raking (~30 s)
make mrp       # fits the MRP model for both survey waves (~10 min)
make tables    # lists tables and row counts
make show TABLE=analytics.results_fed   # previews a table
make ui        # DuckDB web UI, read-only
make lint      # ruff check + format --check
make test      # data quality checks on data/ces.duckdb
```

Times were measured on a 16-core laptop; `make mrp` runs four MCMC chains in parallel and is slower with fewer cores.

`make test` reads the built database: run `make build` first. `make ui` opens the database read-only; close it before `make build`, since DuckDB allows a single writer.

## Sources

| Source | Data | Link |
|---|---|---|
| Canadian Election Study | 2025 CES, version 1 (CC BY-NC 4.0) | https://doi.org/10.7910/DVN/2YAQ8D |
| Elections Canada | 45th general election (April 28, 2025), table 12 "Detailed results by electoral district" | https://elections.ca/res/rep/off/ovrGE45/62/data_donnees/table_tableau12.csv |
| Elections Canada | 44th general election (September 20, 2021), tables 11 and 12 (turnout and results by electoral district, 2013 boundaries) | https://elections.ca/res/rep/off/ovr2021app/53/data_donnees/ |
| Natural Resources Canada | Federal electoral district boundaries, 2013 and 2023 representation orders | https://ftp.maps.canada.ca/pub/elections_elections/Electoral-districts_Circonscription-electorale/ |
| Statistics Canada | Representative points of 2021 dissemination blocks | https://geo.statcan.gc.ca/geo_wa/rest/services/2021/Cartographic_boundary_files/MapServer/13 |
| Statistics Canada | 2021 Census profile: population by dissemination area and by riding, education by gender by riding | https://api.statcan.gc.ca/census-recensement/profile/sdmx/rest |
| Statistics Canada | Table 98-10-0209: mother tongue by age and gender, 2013 ridings | https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=9810020901 |
| Statistics Canada | Table 98-10-0386: highest certificate by age and gender, provinces | https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=9810038601 |

Raw data is not versioned (`data/` is ignored by Git); the scripts download it again.

## Structure

- `pipeline/`: Python scripts (source extraction, running the SQL layers, census raking, MRP model)
- `sql/raw`: sources as received
- `sql/staging`: cleaned data, one table per source
- `sql/analytics`: analysis tables
- `sql/estimates`: poststratification and validation, run after the MRP model
- `tests/`: data quality checks

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
- `staging.riding_population`: official population by riding, 2013 and 2023 boundaries
- `staging.census_age_gender_language`, `staging.census_education_gender`, `staging.census_province_education`: census counts used to build poststratification cells
- `analytics.fed_crosswalk`: share of each 2013 riding's population in each 2023 riding, from a spatial join of blocks; a dissemination area's population is split evenly across its blocks (median gap with official riding populations 0.16%, max 4.2%)
- `analytics.census_cells`: adults by 2013 riding × age (8) × gender (2) × education (4) × mother tongue (3) × 2021 vote (6, non-voters included), built by iterative proportional fitting: a provincial age × gender × education structure, times the survey's 2021 vote by province and age, is raked to each riding's age × gender × language, education × gender and 2021 vote counts, since the census does not publish education by age for ridings
- `analytics.results_fed`: one row per riding × party (votes, share, rank, winner, lead over the next party); 343 ridings, matches the official seat count (169 LPC, 144 CPC, 22 BQ, 7 NDP, 1 GPC)
- `analytics.past_vote_fed`: share of 2021 electors by vote per 2013 riding, non-voters as `NONE`
- `analytics.fed_predictors`: standardized riding predictors for the MRP model (French and other mother tongue, bachelor's degree, log density)
- `analytics.mrp_outcomes`: one row per respondent × question, recoded into the categories the model predicts (`vote_post`, `vote_pre`: LPC, CPC, NDP, BQ, OTH)
- `analytics.mrp_draws`: 100 posterior draws of each category's probability per census cell (2021 vote averaged out), 32M rows per question
- `analytics.fed_estimates`: poststratified share per 2023 riding × category × draw
- `analytics.vote_gaps`, `analytics.interval_scale`: `vote_post` estimates against the 2025 results (mean absolute gap 3.95 points), and the interval widening factor calibrated on them

## Known limitations

- The CES under-represents people whose mother tongue is neither English nor French (6.7% of respondents vs 23.4% of adults in the census); poststratification restores their weight, but those cells rely on few respondents.
- Within a riding, the link between education and language is not constrained by any census table.
- Model intervals only reflect sampling uncertainty: on the 2025 vote, 90% intervals cover 71% of official results. Every interval is widened by a factor k (1.46, `analytics.interval_scale`) calibrated on the vote, assuming attitudes carry similar non-sampling error.
