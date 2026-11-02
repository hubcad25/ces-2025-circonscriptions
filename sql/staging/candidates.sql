CREATE SCHEMA IF NOT EXISTS staging;

-- The party is glued to the candidate name ("Paul Connors Liberal/Libéral"), so it is
-- matched on the exact bilingual suffix. Only the six main parties are kept apart; for the
-- others, candidate keeps the original label. "**" marks the incumbent.
CREATE OR REPLACE TABLE staging.candidates AS
WITH parties (suffix, party) AS (
    VALUES
        ('Liberal/Libéral', 'LPC'),
        ('Conservative/Conservateur', 'CPC'),
        ('NDP-New Democratic Party/NPD-Nouveau Parti démocratique', 'NDP'),
        ('Bloc Québécois/Bloc Québécois', 'BQ'),
        ('Green Party/Parti Vert', 'GPC'),
        ('People''s Party - PPC/Parti populaire - PPC', 'PPC')
),

source AS (
    SELECT
        "Electoral District Number/Numéro de circonscription" AS fed23,
        "Electoral District Name/Nom de circonscription" AS fed23_name,
        "Candidate/Candidat" AS candidate_party,
        "Votes Obtained/Votes obtenus" AS votes
    FROM raw.results
),

split AS (
    SELECT
        s.fed23,
        s.fed23_name,
        coalesce(
            trim(left(s.candidate_party, length(s.candidate_party) - length(p.suffix))),
            s.candidate_party
        ) AS candidate,
        coalesce(p.party, 'OTH') AS party,
        s.votes
    FROM source AS s
    LEFT JOIN parties AS p
        ON ends_with(s.candidate_party, ' ' || p.suffix)
)

SELECT
    fed23,
    fed23_name,
    trim(replace(candidate, '**', '')) AS candidate,
    party,
    contains(candidate, '**') AS is_incumbent,
    votes
FROM split;
