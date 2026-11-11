CREATE SCHEMA IF NOT EXISTS staging;

-- Census traits of each 2023 riding, as a count and the total it is a share of. Traits of the
-- same group (age, education, origin, income, housing) say related things: the riding page
-- shows at most one per group. Mother tongue and origin form one group, since in Quebec French
-- mother tongue and being born in Canada mostly overlap.
CREATE OR REPLACE TABLE staging.riding_traits AS
WITH traits (trait, trait_group, count_code, total_code) AS (
    VALUES
        ('age_65_plus', 'age', 24, 8),
        ('age_under_15', 'age', 9, 8),
        ('bachelor', 'education', 2024, 2014),
        ('french', 'origin', 383, 379),
        ('english', 'origin', 382, 379),
        ('other_language', 'origin', 384, 379),
        ('immigrants', 'origin', 1515, 1513),
        ('visible_minority', 'origin', 1670, 1669),
        ('indigenous', 'origin', 1389, 1388),
        ('low_income', 'income', 326, 321),
        ('owners', 'housing', 1401, 1400)
),

profile AS (
    SELECT
        ALT_GEO_CODE::INTEGER AS fed23,
        CHARACTERISTIC AS code,
        OBS_VALUE AS value
    FROM raw.riding_traits_2023
)

SELECT
    counts.fed23,
    t.trait,
    t.trait_group,
    counts.value AS count,
    totals.value AS total
FROM traits AS t
INNER JOIN profile AS counts
    ON counts.code = t.count_code
INNER JOIN profile AS totals
    ON totals.code = t.total_code AND totals.fed23 = counts.fed23;
