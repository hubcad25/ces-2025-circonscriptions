CREATE SCHEMA IF NOT EXISTS staging;

-- Categories follow the census so that respondents can be matched to poststratification cells.
CREATE OR REPLACE TABLE staging.respondents AS
SELECT
    cps25_ResponseId AS respondent_id,
    -- Codes ending in 999 mean the riding is unknown.
    CASE WHEN feduid % 1000 <> 999 THEN feduid::INTEGER END AS fed13,
    CASE cps25_province
        WHEN 1 THEN 'AB' WHEN 2 THEN 'BC' WHEN 3 THEN 'MB' WHEN 4 THEN 'NB'
        WHEN 5 THEN 'NL' WHEN 6 THEN 'NT' WHEN 7 THEN 'NS' WHEN 8 THEN 'NU'
        WHEN 9 THEN 'ON' WHEN 10 THEN 'PE' WHEN 11 THEN 'QC' WHEN 12 THEN 'SK'
        WHEN 13 THEN 'YT'
    END AS province,
    CASE
        WHEN cps25_age_in_years < 20 THEN '18-19'
        WHEN cps25_age_in_years < 25 THEN '20-24'
        WHEN cps25_age_in_years < 35 THEN '25-34'
        WHEN cps25_age_in_years < 45 THEN '35-44'
        WHEN cps25_age_in_years < 55 THEN '45-54'
        WHEN cps25_age_in_years < 65 THEN '55-64'
        WHEN cps25_age_in_years < 75 THEN '65-74'
        ELSE '75+'
    END AS age_group,
    -- The census only publishes "Men+" and "Women+"; non-binary respondents (0.8%) are grouped
    -- with men so that no one is dropped.
    CASE WHEN cps25_genderid = 2 THEN 'woman' ELSE 'man_plus' END AS gender,
    -- Highest certificate completed, as in the census: "some college" or "some university"
    -- without a diploma counts as secondary.
    CASE
        WHEN cps25_education <= 4 THEN 'none'
        WHEN cps25_education IN (5, 6, 8) THEN 'secondary'
        WHEN cps25_education = 7 THEN 'below_bachelor'
        WHEN cps25_education IN (9, 10, 11) THEN 'bachelor_plus'
    END AS education,
    cps25_language_1 = 1 AS learned_english,
    cps25_language_2 = 1 AS learned_french,
    cps25_weight_general_restricted IS NOT NULL AS in_restricted_sample,
    pes25_ResponseId <> '' AS in_post_election_wave,
    cps25_weight_general_all AS weight_cps,
    pes25_weight_general_all AS weight_pes
FROM raw.ces;
