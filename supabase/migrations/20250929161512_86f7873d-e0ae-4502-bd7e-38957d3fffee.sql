-- Create RLS policies for campaign_coupons table
CREATE POLICY "Authenticated users can view campaign coupons" 
ON public.campaign_coupons 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert campaign coupons" 
ON public.campaign_coupons 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update campaign coupons" 
ON public.campaign_coupons 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete campaign coupons" 
ON public.campaign_coupons 
FOR DELETE 
USING (true);