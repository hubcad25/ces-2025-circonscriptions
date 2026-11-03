CREATE SCHEMA IF NOT EXISTS analytics;

-- Ordered answer categories of the ordinal questions, from lowest to highest. The MRP model
-- fits these with an ordered logit (one effect per group and ordered cutpoints); questions
-- not listed here, such as the vote, are fitted with a multinomial logit.
CREATE OR REPLACE TABLE analytics.mrp_scales AS
SELECT *
FROM (
    VALUES
        ('immigration', 1, 'fewer'),
        ('immigration', 2, 'same'),
        ('immigration', 3, 'more'),
        ('spend_defence', 1, 'less'),
        ('spend_defence', 2, 'same'),
        ('spend_defence', 3, 'more'),
        ('bilingualism', 1, 'strongly_disagree'),
        ('bilingualism', 2, 'somewhat_disagree'),
        ('bilingualism', 3, 'neither'),
        ('bilingualism', 4, 'somewhat_agree'),
        ('bilingualism', 5, 'strongly_agree')
) AS scales (question, rank, category)
ORDER BY question, rank;
