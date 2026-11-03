CREATE SCHEMA IF NOT EXISTS staging;

-- The census groups 15 to 19 year olds; adults (18-19) are assumed to be 2 of those 5 years.
CREATE OR REPLACE MACRO adult_age_group(age) AS CASE age
    WHEN '15 to 19 years' THEN '18-19'
    WHEN '20 to 24 years' THEN '20-24'
    WHEN '25 to 34 years' THEN '25-34'
    WHEN '35 to 44 years' THEN '35-44'
    WHEN '45 to 54 years' THEN '45-54'
    WHEN '55 to 64 years' THEN '55-64'
    WHEN '65 to 74 years' THEN '65-74'
    WHEN '75 to 84 years' THEN '75+'
    WHEN '85 years and over' THEN '75+'
    WHEN '75 years and over' THEN '75+'
END;

CREATE OR REPLACE MACRO adult_share(age) AS CASE age WHEN '15 to 19 years' THEN 0.4 ELSE 1 END;

CREATE OR REPLACE MACRO census_gender(gender) AS CASE gender
    WHEN 'Men+' THEN 'man_plus'
    WHEN 'Women+' THEN 'woman'
END;

-- Mother tongue: a non-official language learned alongside English or French counts as
-- English or French, as in the CES recode. "English and French" (0.8% of adults) is split
-- evenly between the two.
CREATE OR REPLACE TABLE staging.census_age_gender_language AS
WITH source AS (
    SELECT
        right(DGUID, 5)::INTEGER AS fed13,
        adult_age_group("Age (27)") AS age_group,
        census_gender("Gender (3)") AS gender,
        adult_share("Age (27)") AS share,
        "Mother tongue (11):English and French[7]"
            + "Mother tongue (11):English, French and non-official language(s)[10]"
            AS english_and_french,
        "Mother tongue (11):English[2]"
            + "Mother tongue (11):English and non-official language(s)[8]"
            + english_and_french / 2 AS english,
        "Mother tongue (11):French[3]"
            + "Mother tongue (11):French and non-official language(s)[9]"
            + english_and_french / 2 AS french,
        "Mother tongue (11):Non-official language[4]"
            + "Mother tongue (11):Multiple non-official languages[11]" AS other
    FROM read_csv('data/raw/census/98100209.csv')
    WHERE DGUID LIKE '2013A0004%'
),

long AS (
    UNPIVOT source
    ON english, french, other
    INTO NAME language VALUE n
)

SELECT fed13, age_group, gender, language, sum(n * share) AS n
FROM long
WHERE age_group IS NOT NULL AND gender IS NOT NULL
GROUP BY ALL;

-- Population aged 15 and over, 25% sample.
CREATE OR REPLACE TABLE staging.census_education_gender AS
SELECT
    ALT_GEO_CODE::INTEGER AS fed13,
    CASE GENDER WHEN 2 THEN 'man_plus' WHEN 3 THEN 'woman' END AS gender,
    CASE CHARACTERISTIC
        WHEN 1999 THEN 'none'
        WHEN 2000 THEN 'secondary'
        WHEN 2002 THEN 'below_bachelor'
        WHEN 2008 THEN 'bachelor_plus'
    END AS education,
    OBS_VALUE AS n
FROM read_csv('data/raw/census/education_gender_2013.csv')
WHERE CHARACTERISTIC <> 1998;

-- Provincial age × gender × education structure, the starting point for raking.
CREATE OR REPLACE TABLE staging.census_province_education AS
WITH source AS (
    SELECT
        right(DGUID, 2)::INTEGER AS province_code,
        adult_age_group("Age (15A)") AS age_group,
        census_gender("Gender (3)") AS gender,
        "Highest certificate, diploma or degree (16):No certificate, diploma or degree[2]" AS none,
        "Highest certificate, diploma or degree (16):High (secondary) school diploma or equivalency certificate[3]"
            AS secondary,
        "Highest certificate, diploma or degree (16):Postsecondary certificate or diploma below bachelor level[5]"
            AS below_bachelor,
        "Highest certificate, diploma or degree (16):Bachelor’s degree or higher[11]" AS bachelor_plus
    FROM read_csv('data/raw/census/98100386.csv')
    WHERE DGUID LIKE '2021A0002%' AND "Statistics (6B)" = 'Count'
),

long AS (
    UNPIVOT source
    ON none, secondary, below_bachelor, bachelor_plus
    INTO NAME education VALUE n
)

SELECT province_code, age_group, gender, education, n
FROM long
WHERE age_group IS NOT NULL AND gender IS NOT NULL;
