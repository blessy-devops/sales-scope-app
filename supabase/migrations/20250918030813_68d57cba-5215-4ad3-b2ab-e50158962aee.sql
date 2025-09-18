-- Fix get_shopify_precise_sales to use current_total_price from JSON payload
CREATE OR REPLACE FUNCTION public.get_shopify_precise_sales(start_date date, end_date date)
 RETURNS TABLE(sale_date date, total_sales numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(g.created_at AT TIME ZONE 'America/Sao_Paulo') as sale_date,
    COALESCE(SUM(COALESCE((i.payload->>'current_total_price')::numeric, 0)), 0)::numeric as total_sales
  FROM public.shopify_orders_gold g
  JOIN public.shopify_orders_ingest i ON g.id = i.id
  WHERE 
    -- Filter by São Paulo local date
    DATE(g.created_at AT TIME ZONE 'America/Sao_Paulo') BETWEEN start_date AND end_date
    -- Exclude test orders
    AND COALESCE(g.test, false) = false
    -- Include only paid orders
    AND g.financial_status = 'paid'
    -- Exclude cancelled orders
    AND g.cancelled_at IS NULL
  GROUP BY DATE(g.created_at AT TIME ZONE 'America/Sao_Paulo')
  ORDER BY sale_date;
END;
$function$;