-- Every question the website shows, as listed in web/src/questions.ts. Each attitude carries the
-- topic it is compared on in the similar ridings of the riding page; the vote questions have none.
CREATE TEMP TABLE site_questions AS
SELECT *
FROM (
    VALUES
        ('spend_defence', 'economy'),
        ('spend_environment', 'economy'),
        ('decent_housing', 'economy'),
        ('spend_education', 'economy'),
        ('reduce_inequality', 'economy'),
        ('private_jobs', 'economy'),
        ('welfare_dependency', 'economy'),
        ('economy_past_year', 'economy'),
        ('trade_jobs', 'economy'),
        ('ties_us', 'economy'),
        ('tariffs_us', 'economy'),
        ('spend_reconciliation', 'social'),
        ('indigenous_deserve', 'social'),
        ('ban_abortion', 'social'),
        ('women_home', 'social'),
        ('religion_importance', 'social'),
        ('equal_rights', 'social'),
        ('newer_lifestyles', 'social'),
        ('family_values', 'social'),
        ('climate_change', 'social'),
        ('democracy_satisfaction', 'democracy'),
        ('politicians_trustworthy', 'democracy'),
        ('politicians_lie', 'democracy'),
        ('strong_leader', 'democracy'),
        ('no_say', 'democracy'),
        ('people_trusted', 'democracy'),
        ('province_treatment', 'democracy'),
        ('french_threatened', 'immigration'),
        ('immigration', 'immigration'),
        ('bilingualism', 'immigration'),
        ('spend_immigrants', 'immigration'),
        ('immigrants_jobs', 'immigration'),
        ('immigrants_crime', 'immigration'),
        ('immigrants_fit_in', 'immigration'),
        ('vote_post', NULL),
        ('vote_pre', NULL)
) AS questions (question, topic)
