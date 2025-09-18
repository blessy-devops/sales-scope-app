-- Refactor all Shopify sales calculations to use get_shopify_precise_sales as single source of truth

-- 1. Update compare_shopify_sales_debug to use get_shopify_precise_sales
CREATE OR REPLACE FUNCTION public.compare_shopify_sales_debug(target_date date)
RETURNS TABLE(manual_value numeric, automatic_value numeric, orders_count integer, difference numeric, difference_percent numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Use get_shopify_precise_sales for automatic total
  SELECT COALESCE(total_sales, 0)
    INTO automatic_total
  FROM get_shopify_precise_sales(target_date, target_date)
  WHERE sale_date = target_date;

  -- Get orders count separately (since get_shopify_precise_sales doesn't return count)
  start_ts := (target_date::text || ' 00:00:00')::timestamp AT TIME ZONE 'America/Sao_Paulo';
  end_ts   := start_ts + INTERVAL '1 day';

  SELECT COALESCE(COUNT(*), 0)::int
    INTO orders_count_int
  FROM public.shopify_orders_gold o
  WHERE o.created_at >= start_ts
    AND o.created_at < end_ts
    AND o.financial_status = 'paid'
    AND COALESCE(o.test, false) = false
    AND o.cancelled_at IS NULL;

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
$$;

-- 2. Update get_dashboard_sales to use get_shopify_precise_sales
CREATE OR REPLACE FUNCTION public.get_dashboard_sales(start_date date, end_date date)
RETURNS TABLE(sale_date date, amount numeric, channel_id uuid)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  data_source TEXT;
  shopify_channel_id uuid;
BEGIN
  -- Resolve selected data source, default to 'manual'
  SELECT COALESCE(
           (SELECT value FROM public.system_settings WHERE key = 'shopify_data_source' LIMIT 1),
           'manual'
         )
    INTO data_source;

  -- Resolve the Shopify channel id (assumes it exists)
  SELECT c.id
    INTO shopify_channel_id
  FROM public.channels c
  WHERE c.name = 'Shopify'
  LIMIT 1;

  IF data_source = 'automatic' THEN
    RETURN QUERY
    (
      -- 1) Manual entries for non-Shopify channels
      SELECT
        ds.sale_date,
        ds.amount::numeric AS amount,
        ds.channel_id
      FROM public.daily_sales ds
      JOIN public.channels c
        ON c.id = ds.channel_id
      WHERE c.name <> 'Shopify'
        AND ds.sale_date >= start_date
        AND ds.sale_date <= end_date

      UNION ALL

      -- 2) Automatic aggregation from get_shopify_precise_sales
      SELECT
        gsp.sale_date,
        gsp.total_sales AS amount,
        shopify_channel_id AS channel_id
      FROM get_shopify_precise_sales(start_date, end_date) gsp
    );
  ELSE
    -- Manual source: return daily_sales for all channels
    RETURN QUERY
    SELECT
      ds.sale_date,
      ds.amount::numeric AS amount,
      ds.channel_id
    FROM public.daily_sales ds
    WHERE ds.sale_date >= start_date
      AND ds.sale_date <= end_date;
  END IF;
END;
$$;

-- 3. Convert v_social_media_unified_sales VIEW to function get_social_media_sales_unified
-- First drop the existing view
DROP VIEW IF EXISTS public.v_social_media_unified_sales;

-- Create the new function
CREATE OR REPLACE FUNCTION public.get_social_media_sales_unified(start_date date, end_date date)
RETURNS TABLE(sale_date date, total_price numeric, subtotal_price numeric, source_table text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- First part: social_media_sales table
  SELECT 
    (sms.order_created_at AT TIME ZONE 'America/Sao_Paulo')::date as sale_date,
    sms.total_price,
    sms.subtotal_price,
    'social_media_sales'::text as source_table
  FROM public.social_media_sales sms
  WHERE (sms.order_created_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN start_date AND end_date
  
  UNION ALL
  
  -- Second part: shopify_orders_gold with social media coupons using get_shopify_precise_sales logic
  SELECT 
    gsp.sale_date,
    -- Get detailed shopify data for social media coupons only
    COALESCE(SUM(sog.total_price), 0)::numeric as total_price,
    COALESCE(SUM(sog.subtotal_price), 0)::numeric as subtotal_price,
    'shopify_orders_gold'::text as source_table
  FROM get_shopify_precise_sales(start_date, end_date) gsp
  LEFT JOIN public.shopify_orders_gold sog ON 
    DATE(sog.created_at AT TIME ZONE 'America/Sao_Paulo') = gsp.sale_date
    AND COALESCE(sog.test, false) = false
    AND sog.financial_status = 'paid'
    AND sog.cancelled_at IS NULL
    AND sog.coupon_code IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.social_media_coupons smc 
      WHERE smc.coupon_code = sog.coupon_code
    )
  GROUP BY gsp.sale_date
  HAVING COALESCE(SUM(sog.total_price), 0) > 0;
END;
$$;