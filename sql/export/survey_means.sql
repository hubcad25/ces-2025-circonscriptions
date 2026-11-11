-- The model's national estimate of every question next to the survey's own means: raw (one
-- respondent, one vote) and with the CES weights. Ordinal questions are compared on their mean
-- position on the scale (category 'mean'), the vote on each party's share. A question asked in
-- one province only is compared within that province. The vote also gets the official national
-- result.
WITH waves AS (
    -- Post-election respondents are a subset of the campaign wave: a question that only they
    -- answered comes from the post-election wave, and takes its weights.
    SELECT
        o.question,
        bool_and(r.in_post_election_wave) AS is_post_election
    FROM analytics.mrp_outcomes AS o
    INNER JOIN staging.respondents AS r
        USING (respondent_id)
    GROUP BY o.question
),

answers AS (
    SELECT
        o.question,
        o.category,
        s.rank,
        CASE WHEN w.is_post_election THEN r.weight_pes ELSE r.weight_cps END AS weight
    FROM analytics.mrp_outcomes AS o
    INNER JOIN staging.respondents AS r
        USING (respondent_id)
    INNER JOIN waves AS w
        USING (question)
    LEFT JOIN analytics.mrp_scales AS s
        USING (question, category)
    LEFT JOIN analytics.province_questions AS p
        USING (question)
    -- The first two digits of a riding code are the province code.
    WHERE p.province_code IS NULL OR r.fed13 // 1000 = p.province_code
),

ordinal_means AS (
    SELECT
        question,
        'mean' AS category,
        avg(rank) AS raw_mean,
        sum(rank * weight) / sum(weight) AS weighted_mean
    FROM answers
    WHERE rank IS NOT NULL
    GROUP BY question
),

category_totals AS (
    SELECT
        question,
        category,
        count(*) AS n,
        sum(weight) AS weight
    FROM answers
    WHERE rank IS NULL
    GROUP BY question, category
),

shares AS (
    SELECT
        question,
        category,
        n / sum(n) OVER (PARTITION BY question) AS raw_mean,
        weight / sum(weight) OVER (PARTITION BY question) AS weighted_mean
    FROM category_totals
),

model AS (
    SELECT question, category, estimate_mean AS model_mean
    FROM analytics.national_summaries
    UNION ALL
    SELECT s.question, s.category, s.estimate_mean
    FROM analytics.province_summaries AS s
    INNER JOIN analytics.province_questions AS p
        USING (question, province_code)
),

official AS (
    -- The Greens, the People's Party and the others are grouped, as in the model's categories.
    SELECT
        CASE WHEN party IN ('LPC', 'CPC', 'NDP', 'BQ') THEN party ELSE 'OTH' END AS category,
        sum(votes) / sum(sum(votes)) OVER () AS official_share
    FROM analytics.results_fed
    GROUP BY 1
),

survey AS (
    FROM ordinal_means
    UNION ALL
    FROM shares
)

SELECT
    question,
    category,
    ROUND(m.model_mean, 4) AS model_mean,
    ROUND(s.raw_mean, 4) AS raw_mean,
    ROUND(s.weighted_mean, 4) AS weighted_mean,
    ROUND(o.official_share, 4) AS official_share
FROM survey AS s
INNER JOIN model AS m
    USING (question, category)
LEFT JOIN official AS o
    ON s.question IN ('vote_post', 'vote_pre') AND s.category = o.category
SEMI JOIN site_questions
    USING (question)
ORDER BY question, category
