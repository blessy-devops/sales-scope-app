-- Create campaign analytics function
CREATE OR REPLACE FUNCTION public.get_campaign_analytics_v2(campaign_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  campaign_record RECORD;
  utm_filter_parts TEXT[] := ARRAY[]::TEXT[];
  base_query TEXT;
  final_query TEXT;
  shopify_results JSON;
  performance_data JSON;
  result JSON;
BEGIN
  -- 1. Buscar informações da campanha
  SELECT * INTO campaign_record
  FROM public.campaigns
  WHERE id = campaign_uuid;
  
  IF NOT FOUND THEN
    RETURN '{"error": "Campaign not found"}'::JSON;
  END IF;

  -- 2. Construir filtros UTM dinâmicos
  IF campaign_record.utm_campaign IS NOT NULL THEN
    utm_filter_parts := utm_filter_parts || 'utm_campaign = ' || quote_literal(campaign_record.utm_campaign);
  END IF;
  
  IF campaign_record.utm_source IS NOT NULL THEN
    utm_filter_parts := utm_filter_parts || 'utm_source = ' || quote_literal(campaign_record.utm_source);
  END IF;
  
  IF campaign_record.utm_medium IS NOT NULL THEN
    utm_filter_parts := utm_filter_parts || 'utm_medium = ' || quote_literal(campaign_record.utm_medium);
  END IF;
  
  IF campaign_record.utm_content IS NOT NULL THEN
    utm_filter_parts := utm_filter_parts || 'utm_content = ' || quote_literal(campaign_record.utm_content);
  END IF;
  
  IF campaign_record.utm_term IS NOT NULL THEN
    utm_filter_parts := utm_filter_parts || 'utm_term = ' || quote_literal(campaign_record.utm_term);
  END IF;

  -- 3. Construir query para análise de vendas Shopify
  base_query := '
    WITH campaign_sales AS (
      SELECT 
        DATE(sog.created_at AT TIME ZONE ''America/Sao_Paulo'') as sale_date,
        COALESCE(sog.utm_source, ''direct'') as utm_source,
        sog.total_price,
        1 as sales_count
      FROM public.shopify_orders_gold sog
      WHERE sog.financial_status = ''paid''
        AND COALESCE(sog.test, false) = false
        AND sog.cancelled_at IS NULL
        AND DATE(sog.created_at AT TIME ZONE ''America/Sao_Paulo'') >= ' || quote_literal(campaign_record.start_date) || '
        AND DATE(sog.created_at AT TIME ZONE ''America/Sao_Paulo'') <= ' || quote_literal(campaign_record.end_date);
  
  IF array_length(utm_filter_parts, 1) > 0 THEN
    base_query := base_query || ' AND ' || array_to_string(utm_filter_parts, ' AND ');
  END IF;
  
  final_query := base_query || '
    )
    SELECT json_build_object(
      ''totals'', json_build_object(
        ''total_revenue'', COALESCE(SUM(total_price), 0),
        ''total_sales'', COALESCE(SUM(sales_count), 0),
        ''average_ticket'', CASE 
          WHEN SUM(sales_count) > 0 THEN SUM(total_price) / SUM(sales_count)
          ELSE 0 
        END
      ),
      ''by_utm_source'', COALESCE(
        json_agg(
          json_build_object(
            ''utm_source'', utm_source,
            ''revenue'', source_revenue,
            ''sales'', source_sales,
            ''average_ticket'', CASE 
              WHEN source_sales > 0 THEN source_revenue / source_sales
              ELSE 0 
            END
          )
          ORDER BY source_revenue DESC
        ) FILTER (WHERE utm_source IS NOT NULL),
        ''[]''::json
      )
    )
    FROM (
      SELECT 
        utm_source,
        SUM(total_price) as source_revenue,
        SUM(sales_count) as source_sales
      FROM campaign_sales
      GROUP BY utm_source
    ) source_summary';

  -- 4. Executar query dinâmica
  EXECUTE final_query INTO shopify_results;

  -- 5. Buscar dados manuais de performance
  SELECT json_agg(
    json_build_object(
      'date', date,
      'sessions', sessions,
      'clicks', clicks,
      'impressions', impressions,
      'cost', cost
    )
    ORDER BY date
  ) INTO performance_data
  FROM public.campaign_performance_data
  WHERE campaign_id = campaign_uuid
    AND date >= campaign_record.start_date
    AND date <= campaign_record.end_date;

  -- 6. Montar resultado final
  result := json_build_object(
    'campaign_info', json_build_object(
      'id', campaign_record.id,
      'name', campaign_record.name,
      'description', campaign_record.description,
      'start_date', campaign_record.start_date,
      'end_date', campaign_record.end_date,
      'utm_campaign', campaign_record.utm_campaign,
      'utm_source', campaign_record.utm_source,
      'utm_medium', campaign_record.utm_medium,
      'utm_content', campaign_record.utm_content,
      'utm_term', campaign_record.utm_term
    ),
    'goals', json_build_object(
      'revenue', campaign_record.goal_revenue,
      'sales', campaign_record.goal_sales,
      'sessions', campaign_record.goal_sessions,
      'conversion_rate', campaign_record.goal_conversion_rate,
      'average_ticket', campaign_record.goal_average_ticket,
      'cps', campaign_record.goal_cps
    ),
    'shopify_analytics', COALESCE(shopify_results, '{"totals": {"total_revenue": 0, "total_sales": 0, "average_ticket": 0}, "by_utm_source": []}'::json),
    'performance_data', COALESCE(performance_data, '[]'::json)
  );

  RETURN result;
END;
$$;