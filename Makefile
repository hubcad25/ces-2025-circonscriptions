install:
	uv sync

extract:
	uv run python -m pipeline.extract.results
	uv run python -m pipeline.extract.boundaries
	uv run python -m pipeline.extract.dissemination_areas
	uv run python -m pipeline.extract.census

build:
	uv run python -m pipeline.load

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

.PHONY: install extract build tables show ui lint test
