-- Create sub_channels table
CREATE TABLE public.sub_channels (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    utm_source TEXT NOT NULL,
    utm_medium TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint to prevent duplicate UTM combinations per channel
ALTER TABLE public.sub_channels 
ADD CONSTRAINT sub_channels_unique_utm_per_channel 
UNIQUE (parent_channel_id, utm_source, utm_medium);

-- Enable Row Level Security
ALTER TABLE public.sub_channels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sub_channels
CREATE POLICY "Authenticated users can view sub_channels" 
ON public.sub_channels 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage sub_channels" 
ON public.sub_channels 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add sub_channel_id column to sales_targets
ALTER TABLE public.sales_targets 
ADD COLUMN sub_channel_id UUID REFERENCES public.sub_channels(id) ON DELETE CASCADE;

-- Add CHECK constraint to ensure only one of channel_id or sub_channel_id is filled
ALTER TABLE public.sales_targets 
ADD CONSTRAINT channel_or_sub_channel_check 
CHECK (
    (channel_id IS NOT NULL AND sub_channel_id IS NULL) OR 
    (channel_id IS NULL AND sub_channel_id IS NOT NULL)
);