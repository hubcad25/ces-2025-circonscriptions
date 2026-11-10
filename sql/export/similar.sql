-- For each 2023 riding and topic, the 10 most similar and the 10 most different ridings, by their
-- mean answers to the attitudes of the topic. 'all' compares on every attitude. A question asked
-- in one province only has no answer elsewhere, so it cannot compare ridings across Canada.
WITH attitudes AS (
    SELECT question, topic
    FROM site_questions
    ANTI JOIN analytics.province_questions
        USING (question)
    WHERE topic IS NOT NULL
),

topics AS (
    SELECT question, topic
    FROM attitudes
    WHERE topic <> 'all'
    UNION ALL
    SELECT question, 'all'
    FROM attitudes
),

-- Standardized across ridings, so that every attitude weighs the same in the distance.
z_scores AS (
    SELECT
        fed23,
        question,
        (estimate_mean - AVG(estimate_mean) OVER (PARTITION BY question))
            / STDDEV_POP(estimate_mean) OVER (PARTITION BY question) AS z_score
    FROM analytics.fed_summaries
    SEMI JOIN topics
        USING (question)
    WHERE category = 'mean'
),

-- Euclidean distance, divided by the number of attitudes so that topics compare.
distances AS (
    SELECT
        t.topic,
        a.fed23,
        b.fed23 AS other,
        SQRT(AVG((a.z_score - b.z_score) ** 2)) AS distance
    FROM z_scores AS a
    INNER JOIN z_scores AS b
        ON a.question = b.question
        AND a.fed23 <> b.fed23
    INNER JOIN topics AS t
        ON t.question = a.question
    GROUP BY t.topic, a.fed23, b.fed23
),

ranked AS (
    SELECT
        *,
        ROW_NUMBER() OVER (PARTITION BY topic, fed23 ORDER BY distance, other) AS closest,
        ROW_NUMBER() OVER (PARTITION BY topic, fed23 ORDER BY distance DESC, other) AS furthest
    FROM distances
)

SELECT
    topic,
    fed23,
    LIST(other ORDER BY closest) FILTER (WHERE closest <= 10) AS similar,
    LIST(other ORDER BY furthest) FILTER (WHERE furthest <= 10) AS different
FROM ranked
WHERE closest <= 10 OR furthest <= 10
GROUP BY topic, fed23
ORDER BY topic, fed23
