CREATE SCHEMA IF NOT EXISTS analytics;

-- National share per question and category, as the website shows next to each riding:
-- every census cell weighted by its adult population, draw by draw, then summarized like
-- analytics.fed_summaries.
CREATE OR REPLACE TABLE analytics.national_summaries AS
WITH demographic_cells AS (
    SELECT fed13, age_group, gender, education, language, sum(n) AS n
    FROM analytics.census_cells
    GROUP BY fed13, age_group, gender, education, language
),

national_draws AS (
    SELECT
        d.question,
        d.draw,
        d.category,
        sum(d.probability * c.n) / sum(c.n) AS estimate
    FROM analytics.mrp_draws AS d
    INNER JOIN demographic_cells AS c
        USING (fed13, age_group, gender, education, language)
    GROUP BY d.question, d.draw, d.category
)

SELECT
    question,
    category,
    avg(estimate) AS estimate_mean
FROM national_draws
GROUP BY question, category
ORDER BY question, category;
