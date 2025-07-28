-- Allow authenticated users to insert system settings
CREATE POLICY "Authenticated users can insert system settings" 
ON public.system_settings 
FOR INSERT 
TO authenticated
WITH CHECK (true);