def test_every_economic_region_has_a_region(con):
    unmapped = con.execute("""
        SELECT count(*) FROM staging.economic_regions WHERE region IS NULL
    """).fetchone()[0]
    assert unmapped == 0


def test_every_riding_has_one_region(con):
    missing, duplicated = con.execute("""
        SELECT
            count(*) FILTER (WHERE f.fed13 IS NULL),
            count(*) - count(DISTINCT r.fed13)
        FROM staging.ridings_2013 AS r
        LEFT JOIN analytics.fed_regions AS f
            USING (fed13)
    """).fetchone()
    assert missing == 0
    assert duplicated == 0


def test_regions_stay_within_their_province(con):
    crossing = con.execute("""
        SELECT count(*)
        FROM analytics.fed_regions AS f
        INNER JOIN staging.economic_regions AS e
            USING (region)
        WHERE e.province_code <> f.fed13 // 1000
    """).fetchone()[0]
    assert crossing == 0


def test_every_region_has_a_riding(con):
    empty = con.execute("""
        SELECT count(*)
        FROM (SELECT DISTINCT region FROM staging.economic_regions)
        ANTI JOIN analytics.fed_regions
            USING (region)
    """).fetchone()[0]
    assert empty == 0
