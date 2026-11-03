CREATE SCHEMA IF NOT EXISTS analytics;

-- Ordered answer categories of the ordinal questions, from lowest to highest. The MRP model
-- fits these with an ordered logit (one effect per group and ordered cutpoints); questions
-- not listed here, such as the vote, are fitted with a multinomial logit. The side groups the
-- answers for the website (e.g. both "agree" answers as high) and gives the net score.
CREATE OR REPLACE TABLE analytics.mrp_scales AS
SELECT *
FROM (
    VALUES
        ('immigration', 1, 'fewer', 'low'),
        ('immigration', 2, 'same', 'middle'),
        ('immigration', 3, 'more', 'high'),
        ('spend_defence', 1, 'less', 'low'),
        ('spend_defence', 2, 'same', 'middle'),
        ('spend_defence', 3, 'more', 'high'),
        ('bilingualism', 1, 'strongly_disagree', 'low'),
        ('bilingualism', 2, 'somewhat_disagree', 'low'),
        ('bilingualism', 3, 'neither', 'middle'),
        ('bilingualism', 4, 'somewhat_agree', 'high'),
        ('bilingualism', 5, 'strongly_agree', 'high')
) AS scales (question, rank, category, side)
ORDER BY question, rank;
