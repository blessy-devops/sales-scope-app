-- Add checkouts column to ga4_daily_sessions table
ALTER TABLE public.ga4_daily_sessions 
ADD COLUMN checkouts integer;