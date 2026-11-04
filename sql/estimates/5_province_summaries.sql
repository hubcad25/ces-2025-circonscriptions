CREATE SCHEMA IF NOT EXISTS analytics;

-- Provincial share per question and category, computed like analytics.national_summaries but
-- within each province: the map compares ridings with their province when one is chosen. The
-- province is the first two digits of the riding code; 2013 ridings never cross a province.
CREATE OR REPLACE TABLE analytics.province_summaries AS
WITH demographic_cells AS (
    SELECT fed13, age_group, gender, education, language, sum(n) AS n
    FROM analytics.census_cells
    GROUP BY fed13, age_group, gender, education, language
),

province_draws AS (
    SELECT
        d.question,
        d.fed13 // 1000 AS province_code,
        d.draw,
        d.category,
        sum(d.probability * c.n) / sum(c.n) AS estimate
    FROM analytics.mrp_draws AS d
    INNER JOIN demographic_cells AS c
        USING (fed13, age_group, gender, education, language)
    GROUP BY d.question, province_code, d.draw, d.category
),

mean_draws AS (
    SELECT
        p.question,
        p.province_code,
        p.draw,
        'mean' AS category,
        sum(s.rank * p.estimate) AS estimate
    FROM province_draws AS p
    INNER JOIN analytics.mrp_scales AS s
        USING (question, category)
    GROUP BY p.question, p.province_code, p.draw
),

all_draws AS (
    SELECT * FROM province_draws
    UNION ALL
    SELECT * FROM mean_draws
)

SELECT
    question,
    province_code,
    category,
    avg(estimate) AS estimate_mean
FROM all_draws
GROUP BY question, province_code, category
ORDER BY question, province_code, category;
