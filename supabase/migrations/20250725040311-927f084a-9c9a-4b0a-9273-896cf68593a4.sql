-- Enable RLS on existing tables that don't have it
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.target_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for existing tables (allowing all authenticated users for now)
CREATE POLICY "Authenticated users can view channels" 
ON public.channels 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can manage channels" 
ON public.channels 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can view daily sales" 
ON public.daily_sales 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can manage daily sales" 
ON public.daily_sales 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can view sales targets" 
ON public.sales_targets 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can manage sales targets" 
ON public.sales_targets 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can view target history" 
ON public.target_history 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can manage target history" 
ON public.target_history 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Fix the handle_new_user function with secure search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, first_login)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', true);
  RETURN new;
END;
$$;

-- Fix the update_updated_at_column function with secure search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;