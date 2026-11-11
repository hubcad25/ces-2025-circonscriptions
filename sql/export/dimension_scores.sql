-- Score of every riding on every dimension, with its 90% interval, for the Dimensions map.
SELECT
    dimension,
    fed23,
    ROUND(score_mean, 4) AS score_mean,
    ROUND(score_low, 4) AS score_low,
    ROUND(score_high, 4) AS score_high
FROM analytics.fed_dimensions
ORDER BY dimension, fed23
