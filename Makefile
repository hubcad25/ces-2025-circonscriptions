install:
	uv sync

extract:
	uv run python -m pipeline.extract.results
	uv run python -m pipeline.extract.results_2021
	uv run python -m pipeline.extract.boundaries
	uv run python -m pipeline.extract.dissemination_areas
	uv run python -m pipeline.extract.census
	uv run python -m pipeline.extract.ces

build:
	uv run python -m pipeline.load
	uv run python -m pipeline.ipf

mrp:
	uv run python -m pipeline.mrp vote_post
	uv run python -m pipeline.mrp vote_pre
	uv run python -m pipeline.mrp immigration
	uv run python -m pipeline.mrp spend_defence
	uv run python -m pipeline.mrp bilingualism
	uv run python -m pipeline.mrp decent_housing
	uv run python -m pipeline.mrp spend_environment
	uv run python -m pipeline.mrp ties_us
	uv run python -m pipeline.mrp tariffs_us
	uv run python -m pipeline.mrp spend_reconciliation
	uv run python -m pipeline.mrp indigenous_deserve
	uv run python -m pipeline.mrp ban_abortion
	uv run python -m pipeline.mrp women_home
	uv run python -m pipeline.mrp religion_importance
	uv run python -m pipeline.mrp democracy_satisfaction
	uv run python -m pipeline.mrp politicians_trustworthy
	uv run python -m pipeline.mrp french_threatened
	uv run python -m pipeline.mrp immigrants_jobs
	uv run python -m pipeline.mrp immigrants_crime
	uv run python -m pipeline.mrp immigrants_fit_in
	uv run python -m pipeline.mrp reduce_inequality
	uv run python -m pipeline.mrp private_jobs
	uv run python -m pipeline.mrp welfare_dependency
	uv run python -m pipeline.mrp trade_jobs
	uv run python -m pipeline.mrp spend_education
	uv run python -m pipeline.mrp spend_immigrants
	uv run python -m pipeline.mrp equal_rights
	uv run python -m pipeline.mrp newer_lifestyles
	uv run python -m pipeline.mrp family_values
	uv run python -m pipeline.mrp climate_change
	uv run python -m pipeline.mrp politicians_lie
	uv run python -m pipeline.mrp strong_leader
	uv run python -m pipeline.mrp no_say
	uv run python -m pipeline.mrp people_trusted
	uv run python -m pipeline.mrp province_treatment
	uv run python -m pipeline.mrp economy_past_year
	uv run python -m pipeline.mrp quebec_sovereignty

export:
	uv run python -m pipeline.export

TABLE ?= staging.candidates
QUERY = uv run python -c "import duckdb, sys; duckdb.connect('data/ces.duckdb', read_only=True).sql(sys.argv[1]).show(max_rows=50)"

tables:
	$(QUERY) "SELECT schema_name, table_name, estimated_size AS rows FROM duckdb_tables() ORDER BY ALL"

show:
	$(QUERY) "FROM $(TABLE) LIMIT 50"

ui:
	uv run python -c "import duckdb; con = duckdb.connect(); con.sql(\"ATTACH 'data/ces.duckdb' AS ces (READ_ONLY); USE ces; CALL start_ui()\"); input('DuckDB UI at http://localhost:4213 - press Enter to stop')"

lint:
	uv run ruff check .
	uv run ruff format --check .

test:
	uv run pytest

.PHONY: install extract build mrp export tables show ui lint test
