-- Step 1: Remove duplicate records for September 2025, keeping the most recent ones
WITH duplicates_to_remove AS (
  SELECT id
  FROM (
    SELECT id, 
           ROW_NUMBER() OVER (
             PARTITION BY channel_id, COALESCE(sub_channel_id, '00000000-0000-0000-0000-000000000000'::uuid), month, year 
             ORDER BY created_at DESC
           ) as rn
    FROM sales_targets
    WHERE month = 9 AND year = 2025
  ) ranked
  WHERE rn > 1
)
DELETE FROM sales_targets 
WHERE id IN (SELECT id FROM duplicates_to_remove);

-- Step 2: Remove any other duplicates across all records
WITH all_duplicates_to_remove AS (
  SELECT id
  FROM (
    SELECT id, 
           ROW_NUMBER() OVER (
             PARTITION BY channel_id, COALESCE(sub_channel_id, '00000000-0000-0000-0000-000000000000'::uuid), month, year 
             ORDER BY created_at DESC
           ) as rn
    FROM sales_targets
  ) ranked
  WHERE rn > 1
)
DELETE FROM sales_targets 
WHERE id IN (SELECT id FROM all_duplicates_to_remove);

-- Step 3: Add unique constraint to prevent future duplicates
ALTER TABLE sales_targets 
ADD CONSTRAINT unique_sales_targets_channel_month_year 
UNIQUE (channel_id, sub_channel_id, month, year);