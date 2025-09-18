-- Update get_shopify_orders_debug to use same filtering criteria as get_shopify_precise_sales
CREATE OR REPLACE FUNCTION public.get_shopify_orders_debug(target_date date)
 RETURNS TABLE(id bigint, order_number bigint, total_price numeric, financial_status text, created_at_sp timestamp with time zone, included_in_filter boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.order_number,
    o.total_price::numeric,
    o.financial_status,
    -- Return the original timestamp for display purposes
    o.created_at AS created_at_sp,
    -- Use EXACT same filtering criteria as get_shopify_precise_sales
    (
      DATE(o.created_at AT TIME ZONE 'America/Sao_Paulo') = target_date
      AND COALESCE(o.test, false) = false
      AND o.financial_status = 'paid'
      AND o.cancelled_at IS NULL
    ) AS included_in_filter
  FROM public.shopify_orders_gold o
  WHERE DATE(o.created_at AT TIME ZONE 'America/Sao_Paulo') = target_date
  ORDER BY o.created_at;
END;
$function$;