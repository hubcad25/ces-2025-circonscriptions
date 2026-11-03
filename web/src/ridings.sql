-- One row per 2023 riding for the chosen party: the MRP estimate of the post-election vote,
-- with its widened interval, against the official 2025 result.
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
    g.actual_share,
    s.estimate_mean - g.actual_share AS gap,
    g.actual_share BETWEEN s.estimate_low AND s.estimate_high AS is_covered
FROM 'fed_summaries.parquet' AS s
INNER JOIN 'vote_gaps.parquet' AS g
    USING (fed23, category)
WHERE s.question = 'vote_post' AND s.category = ?
