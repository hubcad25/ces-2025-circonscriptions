CREATE SCHEMA IF NOT EXISTS analytics;

-- Poststratify the MRP draws with the census cells of each 2013 riding, then recompose the
-- 2013 ridings into 2023 ridings with the crosswalk shares, which sum to one per 2023 riding.
CREATE OR REPLACE TABLE analytics.fed_estimates AS
WITH fed13_estimates AS (
    SELECT
        d.question,
        d.draw,
        d.fed13,
        d.category,
        sum(d.probability * c.n) / sum(c.n) AS estimate
    FROM analytics.mrp_draws AS d
    INNER JOIN analytics.census_cells AS c
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
)

SELECT * FROM fed23_estimates
ORDER BY question, category, fed23, draw;
