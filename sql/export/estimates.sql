-- Every riding estimate of the website questions, with its widened 90% interval and, for the
-- vote questions, the official 2025 result (null for a party that ran no candidate). Categories
-- excluded from a riding (the Bloc outside Quebec) have an estimate of exactly zero and are
-- dropped. A question asked in one province only has estimates in the ridings of that province
-- only. Four decimals (0.01 point) keep the files small.
SELECT
    s.question,
    s.category,
    s.fed23,
    ROUND(s.estimate_mean, 4) AS estimate_mean,
    ROUND(s.estimate_low, 4) AS estimate_low,
    ROUND(s.estimate_high, 4) AS estimate_high,
    ROUND(g.actual_share, 4) AS actual_share
FROM analytics.fed_summaries AS s
SEMI JOIN site_questions
    USING (question)
LEFT JOIN analytics.vote_gaps AS g
    USING (question, fed23, category)
WHERE s.estimate_high > 0
ORDER BY s.question, s.category, s.fed23
