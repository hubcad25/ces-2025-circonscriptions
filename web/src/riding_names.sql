-- Every 2023 riding, for the search box of the riding page.
SELECT DISTINCT fed23, fed23_name
FROM 'fed_summaries.parquet'
ORDER BY fed23_name
