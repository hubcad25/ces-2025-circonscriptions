-- Score of Canada and of each province on every dimension, which the ridings are compared with.
-- The area is 'canada' or a province code, as in summaries.sql.
WITH provincial AS (
    SELECT
        dimension,
        CASE province_code
            WHEN 10 THEN 'NL' WHEN 11 THEN 'PE' WHEN 12 THEN 'NS' WHEN 13 THEN 'NB'
            WHEN 24 THEN 'QC' WHEN 35 THEN 'ON' WHEN 46 THEN 'MB' WHEN 47 THEN 'SK'
            WHEN 48 THEN 'AB' WHEN 59 THEN 'BC' WHEN 60 THEN 'YT' WHEN 61 THEN 'NT'
            WHEN 62 THEN 'NU'
        END AS area,
        score
    FROM analytics.province_dimensions
)

SELECT dimension, 'canada' AS area, ROUND(score, 4) AS score
FROM analytics.national_dimensions
UNION ALL
SELECT dimension, area, ROUND(score, 4) AS score
FROM provincial
ORDER BY dimension, area
