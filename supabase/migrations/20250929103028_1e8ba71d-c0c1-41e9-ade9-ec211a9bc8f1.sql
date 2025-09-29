-- Add utm_matching_type column to sub_channels table
ALTER TABLE public.sub_channels 
ADD COLUMN utm_matching_type VARCHAR(10) NOT NULL DEFAULT 'exact'
CHECK (utm_matching_type IN ('exact', 'contains'));