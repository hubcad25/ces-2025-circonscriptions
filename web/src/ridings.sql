-- One row per 2023 riding for the chosen party: the MRP estimate of the post-election vote,
-- with its widened interval, against the official 2025 result.
SELECT
    s.fed23,
    s.fed23_name,
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
