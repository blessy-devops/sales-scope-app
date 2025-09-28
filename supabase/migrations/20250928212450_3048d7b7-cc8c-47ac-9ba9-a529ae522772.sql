-- Just clean duplicate data - keep only the most recent record for each combination
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY channel_id, sub_channel_id, month, year 
      ORDER BY created_at DESC
    ) as rn
  FROM sales_targets
)
DELETE FROM sales_targets 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);