CREATE SCHEMA IF NOT EXISTS analytics;

-- National share per question and category, as the website shows next to each riding:
-- every census cell weighted by its adult population, draw by draw, then summarized like
-- analytics.fed_summaries. Ordinal questions also get their grouped answers and their national
-- mean position on the scale (category "mean"), the reference the map compares ridings with.
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
),

mean_draws AS (
    SELECT
        n.question,
        n.draw,
        'mean' AS category,
        sum(s.rank * n.estimate) AS estimate
    FROM national_draws AS n
    INNER JOIN analytics.mrp_scales AS s
        USING (question, category)
    GROUP BY n.question, n.draw
),

grouped_draws AS (
    SELECT
        n.question,
        n.draw,
        'grouped_' || s.side AS category,
        sum(n.estimate) AS estimate
    FROM national_draws AS n
    INNER JOIN analytics.mrp_scales AS s
        USING (question, category)
    GROUP BY n.question, n.draw, s.side
),

all_draws AS (
    SELECT * FROM national_draws
    UNION ALL
    SELECT * FROM grouped_draws
    UNION ALL
    SELECT * FROM mean_draws
)

SELECT
    question,
    category,
    avg(estimate) AS estimate_mean
FROM all_draws
GROUP BY question, category
ORDER BY question, category;
