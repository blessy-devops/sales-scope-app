-- Rename utm_matching_type to utm_medium_matching_type to reflect that it only applies to medium
ALTER TABLE public.sub_channels 
RENAME COLUMN utm_matching_type TO utm_medium_matching_type;

-- Update the default value to be more explicit
ALTER TABLE public.sub_channels 
ALTER COLUMN utm_medium_matching_type SET DEFAULT 'exact';