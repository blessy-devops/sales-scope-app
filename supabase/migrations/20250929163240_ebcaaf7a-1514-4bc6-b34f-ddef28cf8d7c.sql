-- Create function to get campaign realized sales data with deduplication
CREATE OR REPLACE FUNCTION public.get_campaign_realized_data(campaign_uuid uuid)
RETURNS TABLE(
  utm_source text,
  revenue numeric,
  sales_count bigint,
  attribution_type text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  campaign_record RECORD;
  utm_filter_parts TEXT[] := ARRAY[]::TEXT[];
  utm_where_clause TEXT := '';
BEGIN
  -- 1. Buscar informações da campanha
  SELECT * INTO campaign_record
  FROM public.campaigns
  WHERE id = campaign_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign with id % not found', campaign_uuid;
  END IF;

  -- 2. Construir filtros UTM dinâmicos para vendas por UTM
  IF campaign_record.utm_campaign IS NOT NULL THEN
    utm_filter_parts := utm_filter_parts || 'sog.utm_campaign = ' || quote_literal(campaign_record.utm_campaign);
  END IF;
  
  IF campaign_record.utm_source IS NOT NULL THEN
    utm_filter_parts := utm_filter_parts || 'sog.utm_source = ' || quote_literal(campaign_record.utm_source);
  END IF;
  
  IF campaign_record.utm_medium IS NOT NULL THEN
    utm_filter_parts := utm_filter_parts || 'sog.utm_medium = ' || quote_literal(campaign_record.utm_medium);
  END IF;
  
  IF campaign_record.utm_content IS NOT NULL THEN
    utm_filter_parts := utm_filter_parts || 'sog.utm_content = ' || quote_literal(campaign_record.utm_content);
  END IF;
  
  IF campaign_record.utm_term IS NOT NULL THEN
    utm_filter_parts := utm_filter_parts || 'sog.utm_term = ' || quote_literal(campaign_record.utm_term);
  END IF;

  -- Se não há UTMs definidos na campanha, não haverá vendas por UTM
  IF array_length(utm_filter_parts, 1) > 0 THEN
    utm_where_clause := ' AND ' || array_to_string(utm_filter_parts, ' AND ');
  END IF;

  -- 3. Retornar dados unificados usando CTEs
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
        CASE 
          WHEN array_length(utm_filter_parts, 1) > 0 THEN
            -- Aplicar filtros UTM dinamicamente
            (CASE WHEN campaign_record.utm_campaign IS NOT NULL THEN sog.utm_campaign = campaign_record.utm_campaign ELSE true END)
            AND (CASE WHEN campaign_record.utm_source IS NOT NULL THEN sog.utm_source = campaign_record.utm_source ELSE true END)
            AND (CASE WHEN campaign_record.utm_medium IS NOT NULL THEN sog.utm_medium = campaign_record.utm_medium ELSE true END)
            AND (CASE WHEN campaign_record.utm_content IS NOT NULL THEN sog.utm_content = campaign_record.utm_content ELSE true END)
            AND (CASE WHEN campaign_record.utm_term IS NOT NULL THEN sog.utm_term = campaign_record.utm_term ELSE true END)
          ELSE false -- Se não há UTMs na campanha, não há vendas por UTM
        END
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
  -- 4. União final dos resultados
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

-- Adicionar comentário à função
COMMENT ON FUNCTION public.get_campaign_realized_data(uuid) IS 
'Calcula vendas realizadas de uma campanha específica, unificando dados de UTMs e cupons com deduplicação para evitar contagem dupla. Retorna utm_source, revenue, sales_count e attribution_type (utm ou coupon).';