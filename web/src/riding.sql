-- Every question and category for one 2023 riding. The official result only exists for the
-- post-election vote; it is null for a party that ran no candidate in the riding.
SELECT
    s.question,
    s.category,
    s.fed23_name,
    s.estimate_mean,
    s.estimate_low,
    s.estimate_high,
    g.actual_share
FROM 'fed_summaries.parquet' AS s
LEFT JOIN 'vote_gaps.parquet' AS g
    ON g.fed23 = s.fed23 AND g.category = s.category AND s.question = 'vote_post'
-- Categories excluded from the province (the Bloc outside Quebec) have an estimate of zero.
WHERE s.fed23 = ? AND s.estimate_high > 0
