-- Corrige o cálculo de receita na função get_shopify_precise_sales
-- Inclui vendas com status 'paid' e 'pending'
-- Mantém order_count funcionando

DROP FUNCTION IF EXISTS public.get_shopify_precise_sales(date, date);

CREATE OR REPLACE FUNCTION public.get_shopify_precise_sales(start_date date, end_date date)
RETURNS TABLE(sale_date date, total_sales numeric, order_count bigint)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    DATE(g.created_at AT TIME ZONE 'America/Sao_Paulo') as sale_date,
    COALESCE(SUM((i.payload->>'current_total_price')::numeric), 0)::numeric as total_sales,
    COUNT(*)::bigint as order_count
  FROM public.shopify_orders_gold g
  JOIN public.shopify_orders_ingest i ON i.id = g.id
  WHERE 
    DATE(g.created_at AT TIME ZONE 'America/Sao_Paulo') BETWEEN start_date AND end_date
    AND COALESCE(g.test, false) = false
    AND g.financial_status IN ('paid', 'pending')
    AND g.cancelled_at IS NULL
  GROUP BY DATE(g.created_at AT TIME ZONE 'America/Sao_Paulo')
  ORDER BY sale_date;
END;
$function$;