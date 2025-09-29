-- Update get_campaign_analytics_v2 to use the new get_campaign_realized_data function
CREATE OR REPLACE FUNCTION public.get_campaign_analytics_v2(campaign_uuid uuid)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  campaign_record RECORD;
  realized_data RECORD;
  performance_data JSON;
  total_revenue NUMERIC := 0;
  total_sales BIGINT := 0;
  utm_sources_array JSON;
  result JSON;
BEGIN
  -- 1. Buscar informações da campanha
  SELECT * INTO campaign_record
  FROM public.campaigns
  WHERE id = campaign_uuid;
  
  IF NOT FOUND THEN
    RETURN '{"error": "Campaign not found"}'::JSON;
  END IF;

  -- 2. Buscar dados realizados usando a nova função unificada
  -- Agregação dos totais
  SELECT 
    COALESCE(SUM(revenue), 0) as total_revenue,
    COALESCE(SUM(sales_count), 0) as total_sales
  INTO total_revenue, total_sales
  FROM get_campaign_realized_data(campaign_uuid);

  -- Agregação por utm_source com attribution_type
  SELECT json_agg(
    json_build_object(
      'utm_source', utm_source,
      'revenue', revenue,
      'sales', sales_count,
      'average_ticket', CASE 
        WHEN sales_count > 0 THEN revenue / sales_count
        ELSE 0 
      END,
      'attribution_type', attribution_type
    )
    ORDER BY revenue DESC
  ) INTO utm_sources_array
  FROM get_campaign_realized_data(campaign_uuid);

  -- 3. Buscar dados manuais de performance
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

  -- 4. Montar resultado final
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
    'shopify_analytics', json_build_object(
      'totals', json_build_object(
        'total_revenue', total_revenue,
        'total_sales', total_sales,
        'average_ticket', CASE 
          WHEN total_sales > 0 THEN total_revenue / total_sales
          ELSE 0 
        END
      ),
      'by_utm_source', COALESCE(utm_sources_array, '[]'::json)
    ),
    'performance_data', COALESCE(performance_data, '[]'::json)
  );

  RETURN result;
END;
$function$