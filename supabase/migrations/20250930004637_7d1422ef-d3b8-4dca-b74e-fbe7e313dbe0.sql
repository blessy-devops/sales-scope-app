-- Remover funções existentes
DROP FUNCTION IF EXISTS public.get_shopify_precise_sales(date, date);
DROP FUNCTION IF EXISTS public.get_dashboard_sales(date, date);

-- Recriar get_shopify_precise_sales com order_count
CREATE OR REPLACE FUNCTION public.get_shopify_precise_sales(start_date date, end_date date)
 RETURNS TABLE(sale_date date, total_sales numeric, order_count bigint)
 LANGUAGE plpgsql
AS $function$BEGIN
  RETURN QUERY
  
  WITH params AS (
    SELECT 'America/Sao_Paulo'::text AS tz
  ),
  base AS (
    SELECT
      g.id,
      (g.created_at AT TIME ZONE p.tz)::date AS dia_local,

      COALESCE((i.payload->>'total_line_items_price')::numeric, 0) AS orig_gross_items,
      COALESCE((i.payload->>'subtotal_price')::numeric, 0) AS orig_subtotal,
      COALESCE(
        (i.payload->'total_shipping_price_set'->'shop_money'->>'amount')::numeric,
        (SELECT SUM(COALESCE((sl->>'price')::numeric,0)) FROM jsonb_array_elements(COALESCE(i.payload->'shipping_lines','[]'::jsonb)) sl),
        0
      ) AS orig_shipping,
      COALESCE((i.payload->>'total_tax')::numeric, 0) AS orig_tax,
      COALESCE((i.payload->'original_total_additional_fees_set'->'shop_money'->>'amount')::numeric, 0) AS orig_fees,

      COALESCE((i.payload->>'current_subtotal_price')::numeric, 0) AS curr_subtotal,
      COALESCE((i.payload->>'current_total_tax')::numeric, 0) AS curr_tax,
      COALESCE((i.payload->'current_total_additional_fees_set'->'shop_money'->>'amount')::numeric, 0) AS curr_fees,
      COALESCE(
        (i.payload->>'current_total_price')::numeric
        - COALESCE((i.payload->>'current_subtotal_price')::numeric, 0)
        - COALESCE((i.payload->>'current_total_tax')::numeric, 0)
        - COALESCE((i.payload->'current_total_additional_fees_set'->'shop_money'->>'amount')::numeric, 0),
        0
      ) AS curr_shipping,

      COALESCE((i.payload->>'total_discounts')::numeric, 0) AS discounts,
      COALESCE((i.payload->>'current_total_price')::numeric, 0) AS curr_total_price,
      
      g.financial_status,
      g.cancelled_at,
      COALESCE(g.test, false) as test
      
    FROM public.shopify_orders_gold g
    JOIN public.shopify_orders_ingest i USING (id)
    CROSS JOIN params p
    WHERE (g.created_at AT TIME ZONE p.tz)::date BETWEEN start_date AND end_date
  ),
  calc AS (
    SELECT
      dia_local,
      (orig_subtotal - curr_subtotal)
      + (orig_shipping - curr_shipping)
      + (orig_tax - curr_tax)
      + (orig_fees - curr_fees) AS returns_raw,
      curr_subtotal AS net_sales,
      curr_shipping AS shipping_charges,
      curr_tax AS taxes,
      curr_total_price AS total_sales,
      financial_status,
      cancelled_at,
      test
    FROM base
  ),
  filtered AS (
    SELECT
      calc.dia_local AS sale_date,
      calc.total_sales
    FROM calc
    WHERE 
      calc.test = false
      AND calc.financial_status = 'paid'
      AND calc.cancelled_at IS NULL
  )
  SELECT
    filtered.sale_date,
    SUM(filtered.total_sales)::numeric AS total_sales,
    COUNT(*)::bigint AS order_count
  FROM filtered
  GROUP BY filtered.sale_date
  ORDER BY filtered.sale_date;

END;$function$;

-- Recriar get_dashboard_sales com order_count
CREATE OR REPLACE FUNCTION public.get_dashboard_sales(start_date date, end_date date)
 RETURNS TABLE(sale_date date, amount numeric, channel_id uuid, order_count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  data_source TEXT;
  shopify_channel_id uuid;
BEGIN
  SELECT COALESCE(
           (SELECT value FROM public.system_settings WHERE key = 'shopify_data_source' LIMIT 1),
           'manual'
         )
    INTO data_source;

  SELECT c.id
    INTO shopify_channel_id
  FROM public.channels c
  WHERE c.name = 'Shopify'
  LIMIT 1;

  IF data_source = 'automatic' THEN
    RETURN QUERY
    (
      SELECT
        ds.sale_date,
        ds.amount::numeric AS amount,
        ds.channel_id,
        0::bigint AS order_count
      FROM public.daily_sales ds
      JOIN public.channels c
        ON c.id = ds.channel_id
      WHERE c.name <> 'Shopify'
        AND ds.sale_date >= start_date
        AND ds.sale_date <= end_date

      UNION ALL

      SELECT
        gsp.sale_date,
        gsp.total_sales AS amount,
        shopify_channel_id AS channel_id,
        gsp.order_count
      FROM get_shopify_precise_sales(start_date, end_date) gsp
    );
  ELSE
    RETURN QUERY
    SELECT
      ds.sale_date,
      ds.amount::numeric AS amount,
      ds.channel_id,
      0::bigint AS order_count
    FROM public.daily_sales ds
    WHERE ds.sale_date >= start_date
      AND ds.sale_date <= end_date;
  END IF;
END;
$function$;