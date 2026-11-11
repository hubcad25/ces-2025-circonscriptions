INSTALL spatial;
LOAD spatial;

CREATE SCHEMA IF NOT EXISTS staging;

-- Regions of the model: Statistics Canada economic regions, merged within a province so that
-- each region holds about three 2013 ridings or more. The Toronto economic region is split
-- later, in analytics.fed_regions, into the City of Toronto and its suburbs.
CREATE OR REPLACE TABLE staging.economic_regions AS
WITH regions AS (
    SELECT *
    FROM (
        VALUES
            ('1010', 'Avalon Peninsula'),
            ('1020', 'Rest of Newfoundland and Labrador'),
            ('1030', 'Rest of Newfoundland and Labrador'),
            ('1040', 'Rest of Newfoundland and Labrador'),
            ('1110', 'Prince Edward Island'),
            ('1210', 'Cape Breton and North Shore'),
            ('1220', 'Cape Breton and North Shore'),
            ('1230', 'Annapolis Valley and South Shore'),
            ('1240', 'Annapolis Valley and South Shore'),
            ('1250', 'Halifax'),
            ('1310', 'Northern New Brunswick'),
            ('1350', 'Northern New Brunswick'),
            ('1320', 'Southern New Brunswick'),
            ('1330', 'Southern New Brunswick'),
            ('1340', 'Southern New Brunswick'),
            ('2410', 'Eastern Quebec'),
            ('2415', 'Eastern Quebec'),
            ('2420', 'Capitale-Nationale'),
            ('2425', 'Chaudière-Appalaches'),
            ('2430', 'Estrie'),
            ('2433', 'Mauricie and Centre-du-Québec'),
            ('2470', 'Mauricie and Centre-du-Québec'),
            ('2435', 'Montérégie'),
            ('2440', 'Montréal'),
            ('2445', 'Laval'),
            ('2450', 'Lanaudière'),
            ('2455', 'Laurentides'),
            ('2460', 'Outaouais'),
            ('2465', 'Northern Quebec'),
            ('2480', 'Northern Quebec'),
            ('2490', 'Northern Quebec'),
            ('2475', 'Saguenay–Lac-Saint-Jean'),
            ('3510', 'Ottawa'),
            ('3515', 'Kingston–Pembroke'),
            ('3520', 'Muskoka–Kawarthas'),
            ('3530', 'Greater Toronto suburbs'),
            ('3540', 'Kitchener–Waterloo–Barrie'),
            ('3550', 'Hamilton–Niagara Peninsula'),
            ('3560', 'London'),
            ('3570', 'Windsor–Sarnia'),
            ('3580', 'Stratford–Bruce Peninsula'),
            ('3590', 'Northeastern Ontario'),
            ('3595', 'Northwestern Ontario'),
            ('4650', 'Winnipeg'),
            ('4610', 'Rest of Manitoba'),
            ('4620', 'Rest of Manitoba'),
            ('4630', 'Rest of Manitoba'),
            ('4640', 'Rest of Manitoba'),
            ('4660', 'Rest of Manitoba'),
            ('4670', 'Rest of Manitoba'),
            ('4680', 'Rest of Manitoba'),
            ('4710', 'Regina–Moose Mountain'),
            ('4730', 'Saskatoon–Biggar'),
            ('4720', 'Southern Saskatchewan'),
            ('4740', 'Southern Saskatchewan'),
            ('4750', 'Northern Saskatchewan'),
            ('4760', 'Northern Saskatchewan'),
            ('4830', 'Calgary'),
            ('4860', 'Edmonton'),
            ('4810', 'Southern Alberta'),
            ('4820', 'Central Alberta'),
            ('4840', 'Central Alberta'),
            ('4850', 'Central Alberta'),
            ('4870', 'Northern Alberta'),
            ('4880', 'Northern Alberta'),
            ('5910', 'Vancouver Island and Coast'),
            ('5920', 'Lower Mainland–Southwest'),
            ('5930', 'Southern Interior of British Columbia'),
            ('5940', 'Southern Interior of British Columbia'),
            ('5950', 'Northern British Columbia'),
            ('5960', 'Northern British Columbia'),
            ('5970', 'Northern British Columbia'),
            ('5980', 'Northern British Columbia'),
            ('6010', 'Yukon'),
            ('6110', 'Northwest Territories'),
            ('6210', 'Nunavut')
    ) AS mapping (er_id, region)
)

-- A left join keeps an economic region missing from the list, so that a test can catch it.
SELECT
    boundaries.ERUID AS er_id,
    split_part(boundaries.ERNAME, ' / ', 1) AS er_name,
    boundaries.PRUID::INTEGER AS province_code,
    regions.region,
    ST_Transform(boundaries.geom, 'EPSG:4326', 'EPSG:3347', always_xy := true) AS geom
FROM raw.region_boundaries AS boundaries
LEFT JOIN regions
    ON boundaries.ERUID = regions.er_id;
