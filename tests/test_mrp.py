def test_ordinal_answers_are_on_their_scale(con):
    # An answer missing from the scale would get the code -1 in the model, without any error.
    off_scale = con.execute("""
        SELECT count(*)
        FROM analytics.mrp_outcomes AS o
        ANTI JOIN analytics.mrp_scales AS s
            USING (question, category)
        WHERE o.question IN (SELECT question FROM analytics.mrp_scales)
    """).fetchone()[0]
    assert off_scale == 0


def test_scale_ranks_run_from_one_without_gaps(con):
    broken = con.execute("""
        SELECT count(*)
        FROM (
            SELECT question
            FROM analytics.mrp_scales
            GROUP BY question
            HAVING min(rank) <> 1 OR max(rank) <> count(DISTINCT rank) OR count(*) <> max(rank)
        )
    """).fetchone()[0]
    assert broken == 0


def test_province_questions_stay_in_their_province(con):
    outside = con.execute("""
        SELECT count(*)
        FROM analytics.fed_summaries AS s
        INNER JOIN analytics.province_questions AS q
            USING (question)
        WHERE s.fed23 // 1000 <> q.province_code
    """).fetchone()[0]
    assert outside == 0


def test_province_questions_have_no_national_share(con):
    national = con.execute("""
        SELECT count(*)
        FROM analytics.national_summaries
        SEMI JOIN analytics.province_questions
            USING (question)
    """).fetchone()[0]
    assert national == 0
