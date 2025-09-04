
-- Migration: Create/replace Shopify debug functions
-- File: supabase/migrations/20250904093000_create_shopify_debug_functions.sql

BEGIN;

-- Replace function: compare_shopify_sales_debug(target_date date)
DROP FUNCTION IF EXISTS public.compare_shopify_sales_debug(date);

CREATE FUNCTION public.compare_shopify_sales_debug(target_date date)
RETURNS TABLE(
  manual_value numeric,
  automatic_value numeric,
  orders_count integer,
  difference numeric,
  difference_percent numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  shopify_channel_id uuid;
  manual_total numeric := 0;
  automatic_total numeric := 0;
  orders_count_int integer := 0;
  start_ts timestamptz;
  end_ts timestamptz;
BEGIN
  -- Resolve Shopify channel id (by name)
  SELECT c.id
    INTO shopify_channel_id
  FROM public.channels c
  WHERE c.name ILIKE '%shopify%'
  LIMIT 1;

  -- Manual total for the day (if channel exists)
  IF shopify_channel_id IS NOT NULL THEN
    SELECT COALESCE(SUM(ds.amount), 0)
      INTO manual_total
    FROM public.daily_sales ds
    WHERE ds.channel_id = shopify_channel_id
      AND ds.sale_date = target_date;
  END IF;

  -- Define São Paulo TZ day window [start_ts, end_ts)
  start_ts := (target_date::text || ' 00:00:00')::timestamp AT TIME ZONE 'America/Sao_Paulo';
  end_ts   := start_ts + INTERVAL '1 day';

  -- Automatic total (paid orders) and count within the SP-local day
  SELECT COALESCE(SUM(o.total_price), 0),
         COALESCE(COUNT(*), 0)::int
    INTO automatic_total, orders_count_int
  FROM public.shopify_orders_gold o
  WHERE o.created_at >= start_ts
    AND o.created_at < end_ts
    AND o.financial_status = 'paid';

  RETURN QUERY
  SELECT
    manual_total                                        AS manual_value,
    automatic_total                                     AS automatic_value,
    orders_count_int                                    AS orders_count,
    (automatic_total - manual_total)                    AS difference,
    CASE
      WHEN manual_total > 0
        THEN ((automatic_total - manual_total) / manual_total) * 100
      ELSE 0
    END                                                 AS difference_percent;
END;
$function$;


-- Replace function: get_shopify_orders_debug(target_date date)
DROP FUNCTION IF EXISTS public.get_shopify_orders_debug(date);

CREATE FUNCTION public.get_shopify_orders_debug(target_date date)
RETURNS TABLE(
  id bigint,
  order_number bigint,
  total_price numeric,
  financial_status text,
  created_at_sp timestamptz,
  included_in_filter boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.order_number,
    o.total_price::numeric,
    o.financial_status,
    -- Note: timestamptz stores an absolute instant; we filter by SP local date below
    -- and return the original instant (named created_at_sp) for client-side display.
    o.created_at AS created_at_sp,
    (o.financial_status = 'paid') AS included_in_filter
  FROM public.shopify_orders_gold o
  WHERE DATE(o.created_at AT TIME ZONE 'America/Sao_Paulo') = target_date
  ORDER BY o.created_at;
END;
$function$;

COMMIT;
