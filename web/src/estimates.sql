-- One row per 2023 riding for the chosen question and category: the MRP estimate and its
-- widened interval. Categories excluded from a riding (no candidate) have an estimate of zero.
SELECT
    fed23,
    fed23_name,
    -- The first two digits of a riding code are the province code.
    CASE fed23 // 1000
        WHEN 10 THEN 'NL' WHEN 11 THEN 'PE' WHEN 12 THEN 'NS' WHEN 13 THEN 'NB'
        WHEN 24 THEN 'QC' WHEN 35 THEN 'ON' WHEN 46 THEN 'MB' WHEN 47 THEN 'SK'
        WHEN 48 THEN 'AB' WHEN 59 THEN 'BC' WHEN 60 THEN 'YT' WHEN 61 THEN 'NT'
        WHEN 62 THEN 'NU'
    END AS province,
    estimate_mean,
    estimate_low,
    estimate_high
FROM 'fed_summaries.parquet'
WHERE question = ? AND category = ? AND estimate_high > 0
