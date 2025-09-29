-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  -- UTMs: O 'campaign' é a chave principal de rastreamento
  utm_campaign TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_content TEXT,
  utm_term TEXT,
  -- Metas (Goals)
  goal_revenue NUMERIC,
  goal_sales INTEGER,
  goal_sessions INTEGER,
  goal_conversion_rate NUMERIC,
  goal_average_ticket NUMERIC,
  goal_cps NUMERIC, -- Custo por Sessão
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Restrições
  CONSTRAINT campaigns_utm_campaign_key UNIQUE (utm_campaign),
  CONSTRAINT end_date_after_start_date CHECK (end_date >= start_date)
);

-- Create campaign performance data table for manual metrics
CREATE TABLE public.campaign_performance_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sessions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  cost NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Unique constraint to prevent duplicate entries per campaign per date
  CONSTRAINT campaign_performance_data_unique UNIQUE (campaign_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_performance_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for campaigns
CREATE POLICY "Authenticated users can view campaigns" 
ON public.campaigns 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert campaigns" 
ON public.campaigns 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update campaigns" 
ON public.campaigns 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete campaigns" 
ON public.campaigns 
FOR DELETE 
USING (true);

-- Create RLS policies for campaign_performance_data
CREATE POLICY "Authenticated users can view campaign performance data" 
ON public.campaign_performance_data 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert campaign performance data" 
ON public.campaign_performance_data 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update campaign performance data" 
ON public.campaign_performance_data 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete campaign performance data" 
ON public.campaign_performance_data 
FOR DELETE 
USING (true);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_campaigns_updated_at();

CREATE TRIGGER update_campaign_performance_data_updated_at
BEFORE UPDATE ON public.campaign_performance_data
FOR EACH ROW
EXECUTE FUNCTION public.update_campaigns_updated_at();

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