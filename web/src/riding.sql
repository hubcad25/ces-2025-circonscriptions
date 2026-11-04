-- Every question and category for one 2023 riding, with the national and provincial estimates
-- for comparison. The official result only exists for the vote questions; it is null for a
-- party that ran no candidate in the riding.
SELECT
    s.question,
    s.category,
    s.fed23_name,
    -- The first two digits of a riding code are the province code.
    CASE s.fed23 // 1000
        WHEN 10 THEN 'NL' WHEN 11 THEN 'PE' WHEN 12 THEN 'NS' WHEN 13 THEN 'NB'
        WHEN 24 THEN 'QC' WHEN 35 THEN 'ON' WHEN 46 THEN 'MB' WHEN 47 THEN 'SK'
        WHEN 48 THEN 'AB' WHEN 59 THEN 'BC' WHEN 60 THEN 'YT' WHEN 61 THEN 'NT'
        WHEN 62 THEN 'NU'
    END AS province,
    s.estimate_mean,
    s.estimate_low,
    s.estimate_high,
    g.actual_share,
    n.estimate_mean AS national_share,
    p.estimate_mean AS provincial_share
FROM 'fed_summaries.parquet' AS s
LEFT JOIN 'vote_gaps.parquet' AS g
    USING (question, fed23, category)
INNER JOIN 'national_summaries.parquet' AS n
    USING (question, category)
LEFT JOIN 'province_summaries.parquet' AS p
    ON p.question = s.question
    AND p.category = s.category
    AND p.province_code = s.fed23 // 1000
-- Categories excluded from the province (the Bloc outside Quebec) have an estimate of zero.
WHERE s.fed23 = ? AND s.estimate_high > 0
