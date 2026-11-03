import pytest

# The crosswalk splits each dissemination area's population evenly across its blocks, so
# riding totals are approximate. Measured on 2026-11-02: median gap 0.16%, max 4.2%.
MAX_MEDIAN_GAP = 0.005
MAX_GAP = 0.05


@pytest.mark.parametrize("order", [2013, 2023])
def test_population_matches_official_counts(con, order):
    fed = f"fed{str(order)[2:]}"
    missing, median_gap, max_gap = con.execute(f"""
        WITH estimated AS (
            SELECT {fed} AS fed, sum(population) AS population
            FROM analytics.fed_crosswalk
            GROUP BY {fed}
        ),

        gaps AS (
            SELECT
                e.fed IS NULL AS is_missing,
                abs(e.population - o.population) / o.population AS gap
            FROM staging.riding_population AS o
            LEFT JOIN estimated AS e ON e.fed = o.fed
            WHERE o.representation_order = {order}
        )

        SELECT count(*) FILTER (WHERE is_missing), median(gap), max(gap)
        FROM gaps
    """).fetchone()
    assert missing == 0
    assert median_gap < MAX_MEDIAN_GAP
    assert max_gap < MAX_GAP


def test_shares_sum_to_one(con):
    max_error = con.execute("""
        SELECT max(abs(total - 1))
        FROM (SELECT sum(share_of_fed13) AS total FROM analytics.fed_crosswalk GROUP BY fed13)
    """).fetchone()[0]
    assert max_error < 1e-9


def test_pairs_stay_within_a_province(con):
    crossing = con.execute("""
        SELECT count(*) FROM analytics.fed_crosswalk WHERE fed13 // 1000 <> fed23 // 1000
    """).fetchone()[0]
    assert crossing == 0
