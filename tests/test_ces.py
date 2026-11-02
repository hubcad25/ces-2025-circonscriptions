def test_respondent_ids_are_unique(con):
    total, unique = con.execute(
        "SELECT count(*), count(DISTINCT respondent_id) FROM staging.respondents"
    ).fetchone()
    assert total == unique == 20180


def test_known_ridings_are_in_crosswalk(con):
    missing = con.execute("""
        SELECT count(*)
        FROM staging.respondents
        WHERE fed13 IS NOT NULL
            AND fed13 NOT IN (SELECT fed13 FROM analytics.fed_crosswalk)
    """).fetchone()[0]
    assert missing == 0


def test_poststratification_variables_are_complete(con):
    missing = con.execute("""
        SELECT count(*) FILTER (WHERE age_group IS NULL OR gender IS NULL OR province IS NULL)
        FROM staging.respondents
    """).fetchone()[0]
    assert missing == 0


def test_every_code_has_a_label(con):
    # -99 means "not selected" in multiple-choice questions and has no label.
    unlabeled = con.execute("""
        SELECT count(*)
        FROM staging.responses AS r
        ANTI JOIN staging.value_labels AS l
            ON l.variable = r.variable AND l.code = r.code
        WHERE r.code <> -99
    """).fetchone()[0]
    assert unlabeled == 0
