def test_cells_match_age_gender_language_counts(con):
    max_gap = con.execute("""
        WITH cells AS (
            SELECT fed13, age_group, gender, language, sum(n) AS n
            FROM analytics.census_cells
            GROUP BY ALL
        )
        SELECT max(abs(c.n - m.n))
        FROM cells AS c
        INNER JOIN staging.census_age_gender_language AS m
            USING (fed13, age_group, gender, language)
    """).fetchone()[0]
    assert max_gap < 1


def test_cells_match_education_shares(con):
    # Education counts cover ages 15+, so only the shares within riding and gender are compared.
    max_gap = con.execute("""
        WITH cells AS (
            SELECT
                fed13, gender, education,
                sum(n) / sum(sum(n)) OVER (PARTITION BY fed13, gender) AS share
            FROM analytics.census_cells
            GROUP BY fed13, gender, education
        ),

        census AS (
            SELECT
                fed13, gender, education,
                n / sum(n) OVER (PARTITION BY fed13, gender) AS share
            FROM staging.census_education_gender
        )

        SELECT max(abs(c.share - m.share))
        FROM cells AS c
        INNER JOIN census AS m USING (fed13, gender, education)
    """).fetchone()[0]
    assert max_gap < 1e-6
