CREATE SCHEMA IF NOT EXISTS analytics;

-- Poststratify the MRP draws with the census cells of each 2013 riding, recompose the 2013
-- ridings into 2023 ridings with the crosswalk shares, which sum to one per 2023 riding, then
-- drop parties that ran no candidate in a riding.
CREATE OR REPLACE TABLE analytics.fed_estimates AS
WITH demographic_cells AS (
    SELECT fed13, age_group, gender, education, language, sum(n) AS n
    FROM analytics.census_cells
    GROUP BY fed13, age_group, gender, education, language
),

fed13_estimates AS (
    SELECT
        d.question,
        d.draw,
        d.fed13,
        d.category,
        sum(d.probability * c.n) / sum(c.n) AS estimate
    FROM analytics.mrp_draws AS d
    INNER JOIN demographic_cells AS c
        USING (fed13, age_group, gender, education, language)
    GROUP BY d.question, d.draw, d.fed13, d.category
),

fed23_estimates AS (
    SELECT
        e.question,
        e.draw,
        x.fed23,
        e.category,
        sum(x.share_of_fed23 * e.estimate) AS estimate
    FROM fed13_estimates AS e
    INNER JOIN analytics.fed_crosswalk AS x
        USING (fed13)
    GROUP BY e.question, e.draw, x.fed23, e.category
),

candidate_estimates AS (
    SELECT
        e.*,
        CASE WHEN x.category IS NULL THEN e.estimate ELSE 0 END AS kept_estimate
    FROM fed23_estimates AS e
    LEFT JOIN analytics.fed_exclusions AS x
        USING (question, fed23, category)
)

SELECT
    question,
    draw,
    fed23,
    category,
    kept_estimate / sum(kept_estimate) OVER (PARTITION BY question, draw, fed23) AS estimate
FROM candidate_estimates
ORDER BY question, category, fed23, draw;
