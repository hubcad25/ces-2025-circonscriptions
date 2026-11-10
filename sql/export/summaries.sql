-- The national and provincial estimate of every question and category, which the ridings are
-- compared with. The area is 'canada' or a province code.
WITH national AS (
    SELECT question, category, 'canada' AS area, estimate_mean
    FROM analytics.national_summaries
),

provincial AS (
    SELECT
        question,
        category,
        CASE province_code
            WHEN 10 THEN 'NL' WHEN 11 THEN 'PE' WHEN 12 THEN 'NS' WHEN 13 THEN 'NB'
            WHEN 24 THEN 'QC' WHEN 35 THEN 'ON' WHEN 46 THEN 'MB' WHEN 47 THEN 'SK'
            WHEN 48 THEN 'AB' WHEN 59 THEN 'BC' WHEN 60 THEN 'YT' WHEN 61 THEN 'NT'
            WHEN 62 THEN 'NU'
        END AS area,
        estimate_mean
    FROM analytics.province_summaries
),

areas AS (
    FROM national
    UNION ALL
    FROM provincial
)

SELECT question, category, area, ROUND(estimate_mean, 4) AS estimate_mean
FROM areas
SEMI JOIN site_questions
    USING (question)
ORDER BY question, category, area
