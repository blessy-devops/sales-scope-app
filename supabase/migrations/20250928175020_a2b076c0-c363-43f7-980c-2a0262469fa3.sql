-- Remove duplicate sales_targets records, keeping only the most recent ones
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY channel_id, sub_channel_id, month, year 
      ORDER BY created_at DESC
    ) as rn
  FROM sales_targets
  WHERE month = 9 AND year = 2025
)
DELETE FROM sales_targets 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Add a unique constraint to prevent future duplicates
ALTER TABLE sales_targets 
ADD CONSTRAINT unique_target_per_channel_month 
UNIQUE (channel_id, sub_channel_id, month, year);