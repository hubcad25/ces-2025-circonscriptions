-- One row per 2023 riding for the chosen question and category: the MRP estimate, its widened
-- interval and the national estimate. Categories excluded from a riding (no candidate) have an
-- estimate of exactly zero, which is what the filter drops.
SELECT
    s.fed23,
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
    n.estimate_mean AS national
FROM 'fed_summaries.parquet' AS s
LEFT JOIN 'national_summaries.parquet' AS n
    USING (question, category)
WHERE s.question = ? AND s.category = ? AND s.estimate_high <> 0
