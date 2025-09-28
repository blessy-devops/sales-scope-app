-- Remove the existing constraint that prevents sub-channel targets
ALTER TABLE sales_targets DROP CONSTRAINT IF EXISTS sales_targets_channel_id_month_year_key;

-- Create new constraint that allows both parent channel and sub-channel targets
ALTER TABLE sales_targets ADD CONSTRAINT sales_targets_unique_key 
UNIQUE (channel_id, sub_channel_id, month, year);