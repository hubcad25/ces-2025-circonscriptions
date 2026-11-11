-- What stands out in each riding's population: up to three census traits, compared with the
-- province and with Canada. Census counts have no sampling error, so a gap is measured against
-- the spread of the trait across the 343 ridings (z). A riding shows at most one trait per
-- group, across both references: in Acadie—Bathurst, "more French" against the province and
-- "less English" against Canada would say the same thing twice.
WITH shares AS (
    SELECT
        fed23,
        -- The first two digits of a riding code are the province code.
        fed23 // 1000 AS province_code,
        trait,
        trait_group,
        count,
        total,
        count / total AS share
    FROM staging.riding_traits
),

province_shares AS (
    SELECT province_code, trait, sum(count) / sum(total) AS province_share
    FROM shares
    GROUP BY province_code, trait
),

canada_shares AS (
    SELECT trait, sum(count) / sum(total) AS canada_share, stddev_pop(share) AS spread
    FROM shares
    GROUP BY trait
),

gaps AS (
    SELECT
        s.fed23,
        s.trait,
        s.trait_group,
        s.share,
        p.province_share,
        c.canada_share,
        (s.share - p.province_share) / c.spread AS z_province,
        (s.share - c.canada_share) / c.spread AS z_canada,
        -- A territory is a single riding: comparing it with itself says nothing.
        s.province_code >= 60 AS is_territory,
        -- As on the attitudes: the gap with Canada is mostly provincial when the province's own
        -- gap with Canada is larger than the riding's gap with its province.
        abs(p.province_share - c.canada_share) > abs(s.share - p.province_share) AS is_mostly_provincial
    FROM shares AS s
    INNER JOIN province_shares AS p
        USING (province_code, trait)
    INNER JOIN canada_shares AS c
        USING (trait)
),

province_picks AS (
    SELECT fed23, trait, trait_group, share, province_share AS reference_share, z_province AS z
    FROM gaps
    WHERE NOT is_territory AND abs(z_province) >= 1
    QUALIFY row_number() OVER (PARTITION BY fed23, trait_group ORDER BY abs(z_province) DESC) = 1
),

province_top AS (
    SELECT 'province' AS reference, *
    FROM province_picks
    QUALIFY row_number() OVER (PARTITION BY fed23 ORDER BY abs(z) DESC) <= 3
),

canada_picks AS (
    SELECT g.fed23, g.trait, g.trait_group, g.share, g.canada_share AS reference_share, g.z_canada AS z
    FROM gaps AS g
    ANTI JOIN province_top AS p
        USING (fed23, trait_group)
    WHERE abs(g.z_canada) >= 1 AND (g.is_territory OR NOT g.is_mostly_provincial)
    QUALIFY row_number() OVER (PARTITION BY g.fed23, g.trait_group ORDER BY abs(g.z_canada) DESC) = 1
),

canada_top AS (
    SELECT 'canada' AS reference, *
    FROM canada_picks
    QUALIFY row_number() OVER (PARTITION BY fed23 ORDER BY abs(z) DESC) <= 3
)

SELECT
    fed23,
    reference,
    trait,
    ROUND(share, 4) AS share,
    ROUND(reference_share, 4) AS reference_share
FROM (
    FROM province_top
    UNION ALL
    FROM canada_top
)
ORDER BY fed23, reference, abs(z) DESC
