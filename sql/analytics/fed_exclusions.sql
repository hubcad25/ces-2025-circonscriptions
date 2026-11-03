CREATE SCHEMA IF NOT EXISTS analytics;

-- Parties that ran no candidate in a 2023 riding. The model works on 2013 ridings, so these
-- are applied after poststratification: the party's estimate is set to zero and the other
-- categories are rescaled, as if its voters split like the rest of the riding. The Bloc
-- outside Quebec is listed too, but its estimate is already zero there.
CREATE OR REPLACE TABLE analytics.fed_exclusions AS
WITH vote_questions (question) AS (
    VALUES ('vote_post'), ('vote_pre')
),

parties (category) AS (
    VALUES ('LPC'), ('CPC'), ('NDP'), ('BQ')
)

SELECT
    q.question,
    r.fed23,
    p.category
FROM vote_questions AS q
CROSS JOIN parties AS p
CROSS JOIN staging.ridings_2023 AS r
ANTI JOIN staging.candidates AS c
    ON c.fed23 = r.fed23 AND c.party = p.category
ORDER BY ALL;
