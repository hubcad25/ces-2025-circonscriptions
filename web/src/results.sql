-- One row per 2023 riding for the chosen party: the official 2025 vote share, with the same
-- columns as estimates.sql. A party that ran no candidate in a riding has no row.
SELECT
    g.fed23,
    s.fed23_name,
    -- The first two digits of a riding code are the province code.
    CASE g.fed23 // 1000
        WHEN 10 THEN 'NL' WHEN 11 THEN 'PE' WHEN 12 THEN 'NS' WHEN 13 THEN 'NB'
        WHEN 24 THEN 'QC' WHEN 35 THEN 'ON' WHEN 46 THEN 'MB' WHEN 47 THEN 'SK'
        WHEN 48 THEN 'AB' WHEN 59 THEN 'BC' WHEN 60 THEN 'YT' WHEN 61 THEN 'NT'
        WHEN 62 THEN 'NU'
    END AS province,
    g.actual_share AS estimate_mean,
    -- An official result has no uncertainty: both bounds are the share itself.
    g.actual_share AS estimate_low,
    g.actual_share AS estimate_high
FROM 'vote_gaps.parquet' AS g
INNER JOIN 'fed_summaries.parquet' AS s
    USING (question, fed23, category)
-- The official result is the same for both vote questions.
WHERE g.question = 'vote_post' AND g.category = ?
