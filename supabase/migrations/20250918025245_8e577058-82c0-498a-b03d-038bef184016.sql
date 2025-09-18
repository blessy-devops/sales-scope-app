-- Fix security warning: Add search_path to the function for security
CREATE OR REPLACE FUNCTION public.get_shopify_precise_sales(start_date date, end_date date)
RETURNS TABLE(sale_date date, total_sales numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(sog.created_at AT TIME ZONE 'America/Sao_Paulo') as sale_date,
    COALESCE(SUM(sog.total_price), 0)::numeric as total_sales
  FROM public.shopify_orders_gold sog
  WHERE 
    -- Filter by São Paulo local date
    DATE(sog.created_at AT TIME ZONE 'America/Sao_Paulo') BETWEEN start_date AND end_date
    -- Exclude test orders
    AND COALESCE(sog.test, false) = false
    -- Include only paid orders
    AND sog.financial_status = 'paid'
    -- Exclude cancelled orders
    AND sog.cancelled_at IS NULL
  GROUP BY DATE(sog.created_at AT TIME ZONE 'America/Sao_Paulo')
  ORDER BY sale_date;
END;
$$;