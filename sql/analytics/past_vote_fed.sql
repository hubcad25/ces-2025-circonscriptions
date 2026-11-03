CREATE SCHEMA IF NOT EXISTS analytics;

-- Share of 2021 electors by vote, per 2013 riding, with non-voters as their own category so
-- that shares cover every adult, like the census cells.
CREATE OR REPLACE TABLE analytics.past_vote_fed AS
WITH party_votes AS (
    SELECT
        "Electoral District Number/Numéro de circonscription" AS fed13,
        CASE
            WHEN ends_with("Candidate/Candidat", ' Liberal/Libéral') THEN 'LPC'
            WHEN ends_with("Candidate/Candidat", ' Conservative/Conservateur') THEN 'CPC'
            WHEN ends_with("Candidate/Candidat", ' NDP-New Democratic Party/NPD-Nouveau Parti démocratique') THEN 'NDP'
            WHEN ends_with("Candidate/Candidat", ' Bloc Québécois/Bloc Québécois') THEN 'BQ'
            ELSE 'OTH'
        END AS past_vote,
        sum("Votes Obtained/Votes obtenus") AS votes
    FROM raw.results_2021
    GROUP BY ALL
),

non_voters AS (
    SELECT
        "Electoral District Number/Numéro de circonscription" AS fed13,
        'NONE' AS past_vote,
        "Electors/Électeurs" - "Valid Ballots/Bulletins valides" AS votes
    FROM raw.turnout_2021
),

all_electors AS (
    SELECT * FROM party_votes
    UNION ALL
    SELECT * FROM non_voters
)

SELECT
    fed13::INTEGER AS fed13,
    past_vote,
    votes / sum(votes) OVER (PARTITION BY fed13) AS share
FROM all_electors
ORDER BY fed13, past_vote;
