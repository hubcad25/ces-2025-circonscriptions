CREATE SCHEMA IF NOT EXISTS analytics;

CREATE OR REPLACE TABLE analytics.results_fed AS
WITH party_votes AS (
    SELECT
        fed23,
        fed23_name,
        party,
        sum(votes)::BIGINT AS votes
    FROM staging.candidates
    GROUP BY fed23, fed23_name, party
),

shares AS (
    SELECT
        *,
        votes / sum(votes) OVER (PARTITION BY fed23) AS vote_share,
        rank() OVER (PARTITION BY fed23 ORDER BY votes DESC) AS rank
    FROM party_votes
)

SELECT
    fed23,
    fed23_name,
    party,
    votes,
    round(100 * vote_share, 2) AS vote_share,
    rank,
    rank = 1 AS is_winner,
    round(100 * (vote_share - lead(vote_share) OVER (PARTITION BY fed23 ORDER BY rank)), 2)
        AS lead_over_next
FROM shares
ORDER BY fed23, rank;
