-- Fix get_campaign_realized_data function by removing unused utm_filter_parts construction
CREATE OR REPLACE FUNCTION public.get_campaign_realized_data(campaign_uuid uuid)
 RETURNS TABLE(utm_source text, revenue numeric, sales_count bigint, attribution_type text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  campaign_record RECORD;
BEGIN
  -- 1. Buscar informações da campanha
  SELECT * INTO campaign_record
  FROM public.campaigns
  WHERE id = campaign_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign with id % not found', campaign_uuid;
  END IF;

  -- 2. Retornar dados unificados usando CTEs
  RETURN QUERY
  WITH utm_sales AS (
    -- CTE para vendas atribuídas por UTM
    SELECT 
      COALESCE(sog.utm_source, 'direct') as utm_source,
      SUM(sog.total_price) as revenue,
      COUNT(*)::bigint as sales_count,
      'utm'::text as attribution_type
    FROM public.shopify_orders_gold sog
    WHERE sog.financial_status = 'paid'
      AND COALESCE(sog.test, false) = false
      AND sog.cancelled_at IS NULL
      AND DATE(sog.created_at AT TIME ZONE 'America/Sao_Paulo') >= campaign_record.start_date
      AND DATE(sog.created_at AT TIME ZONE 'America/Sao_Paulo') <= campaign_record.end_date
      AND (
        -- Aplicar filtros UTM dinamicamente usando CASE statements
        (campaign_record.utm_campaign IS NULL OR sog.utm_campaign = campaign_record.utm_campaign)
        AND (campaign_record.utm_source IS NULL OR sog.utm_source = campaign_record.utm_source)
        AND (campaign_record.utm_medium IS NULL OR sog.utm_medium = campaign_record.utm_medium)
        AND (campaign_record.utm_content IS NULL OR sog.utm_content = campaign_record.utm_content)
        AND (campaign_record.utm_term IS NULL OR sog.utm_term = campaign_record.utm_term)
        -- Garantir que ao menos um UTM foi definido na campanha
        AND (
          campaign_record.utm_campaign IS NOT NULL 
          OR campaign_record.utm_source IS NOT NULL 
          OR campaign_record.utm_medium IS NOT NULL
          OR campaign_record.utm_content IS NOT NULL
          OR campaign_record.utm_term IS NOT NULL
        )
      )
    GROUP BY COALESCE(sog.utm_source, 'direct')
  ),
  coupon_sales AS (
    -- CTE para vendas atribuídas por cupom (excluindo as que já têm UTM da campanha)
    SELECT 
      COALESCE(sog.utm_source, 'coupon') as utm_source,
      SUM(sog.total_price) as revenue,
      COUNT(*)::bigint as sales_count,
      'coupon'::text as attribution_type
    FROM public.shopify_orders_gold sog
    INNER JOIN public.campaign_coupons cc ON cc.coupon_code = sog.coupon_code
    WHERE cc.campaign_id = campaign_uuid
      AND sog.financial_status = 'paid'
      AND COALESCE(sog.test, false) = false
      AND sog.cancelled_at IS NULL
      AND DATE(sog.created_at AT TIME ZONE 'America/Sao_Paulo') >= campaign_record.start_date
      AND DATE(sog.created_at AT TIME ZONE 'America/Sao_Paulo') <= campaign_record.end_date
      -- CRITÉRIO DE EXCLUSÃO: Não contar se já tem utm_campaign da campanha
      AND (
        campaign_record.utm_campaign IS NULL 
        OR sog.utm_campaign IS NULL 
        OR sog.utm_campaign != campaign_record.utm_campaign
      )
    GROUP BY COALESCE(sog.utm_source, 'coupon')
  )
  -- 3. União final dos resultados
  SELECT 
    us.utm_source,
    us.revenue,
    us.sales_count,
    us.attribution_type
  FROM utm_sales us
  
  UNION ALL
  
  SELECT 
    cs.utm_source,
    cs.revenue,
    cs.sales_count,
    cs.attribution_type
  FROM coupon_sales cs
  
  ORDER BY attribution_type, utm_source;
END;
$function$;