
-- Create or replace function to provide consolidated daily sales by channel,
-- switching between manual and automatic (Shopify) sources based on system setting.
CREATE OR REPLACE FUNCTION public.get_dashboard_sales(start_date date, end_date date)
RETURNS TABLE(sale_date date, amount numeric, channel_id uuid)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  data_source TEXT;
  shopify_channel_id uuid;
  start_ts timestamptz;
  end_ts timestamptz;
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
    -- Define São Paulo timezone window for the requested date range
    start_ts := (start_date::text || ' 00:00:00')::timestamp AT TIME ZONE 'America/Sao_Paulo';
    end_ts   := (end_date::text || ' 00:00:00')::timestamp AT TIME ZONE 'America/Sao_Paulo' + INTERVAL '1 day';

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

      -- 2) Automatic aggregation from Shopify orders (paid), grouped by SP-local day
      SELECT
        DATE(o.created_at AT TIME ZONE 'America/Sao_Paulo') AS sale_date,
        COALESCE(SUM(o.total_price), 0)::numeric            AS amount,
        shopify_channel_id                                   AS channel_id
      FROM public.shopify_orders_gold o
      WHERE o.created_at >= start_ts
        AND o.created_at <  end_ts
        AND o.financial_status = 'paid'
      GROUP BY DATE(o.created_at AT TIME ZONE 'America/Sao_Paulo')
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
$function$;
