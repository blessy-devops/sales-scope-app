-- Modify get_shopify_precise_sales to accept calculation_mode parameter
CREATE OR REPLACE FUNCTION public.get_shopify_precise_sales(
  start_date date, 
  end_date date,
  calculation_mode text DEFAULT 'paid_only'
)
RETURNS TABLE(sale_date date, total_sales numeric)
LANGUAGE plpgsql
AS $function$
BEGIN
  -- A cláusula RETURN QUERY executa a consulta a seguir e retorna o resultado.
  RETURN QUERY
  
  -- Use Common Table Expressions (CTEs) para organizar a lógica complexa.
  WITH params AS (
    -- Define o fuso horário para ser usado em toda a query.
    SELECT 'America/Sao_Paulo'::text AS tz
  ),
  base AS (
    -- Primeira etapa: extrai os valores brutos do payload JSON para cada pedido.
    SELECT
      g.id,
      -- Converte o timestamp para a data local de São Paulo.
      (g.created_at AT TIME ZONE p.tz)::date AS dia_local,

      -- COMPONENTES ORIGINAIS (pré devolução)
      COALESCE((i.payload->>'total_line_items_price')::numeric, 0) AS orig_gross_items,
      COALESCE((i.payload->>'subtotal_price')::numeric, 0) AS orig_subtotal,
      COALESCE(
        (i.payload->'total_shipping_price_set'->'shop_money'->>'amount')::numeric,
        (SELECT SUM(COALESCE((sl->>'price')::numeric,0)) FROM jsonb_array_elements(COALESCE(i.payload->'shipping_lines','[]'::jsonb)) sl),
        0
      ) AS orig_shipping,
      COALESCE((i.payload->>'total_tax')::numeric, 0) AS orig_tax,
      COALESCE((i.payload->'original_total_additional_fees_set'->'shop_money'->>'amount')::numeric, 0) AS orig_fees,

      -- COMPONENTES ATUAIS (pós devolução)
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

      -- CAMPOS DE APOIO
      COALESCE((i.payload->>'total_discounts')::numeric, 0) AS discounts,
      COALESCE((i.payload->>'current_total_price')::numeric, 0) AS curr_total_price,
      
      -- Campos para filtros
      g.financial_status,
      g.cancelled_at,
      COALESCE(g.test, false) as test
      
    FROM public.shopify_orders_gold g
    JOIN public.shopify_orders_ingest i USING (id)
    CROSS JOIN params p
    -- Filtra pelo intervalo de datas fornecido à função.
    WHERE (g.created_at AT TIME ZONE p.tz)::date BETWEEN start_date AND end_date
  ),
  calc AS (
    -- Segunda etapa: calcula as métricas do Shopify com base nos valores extraídos.
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
    -- Terceira etapa: aplica filtros baseados no calculation_mode
    SELECT
      calc.dia_local AS sale_date,
      calc.total_sales
    FROM calc
    WHERE 
      -- Sempre excluir testes
      calc.test = false
      -- Aplicar filtros baseados no modo
      AND (
        -- paid_only: apenas pagos, não cancelados
        (calculation_mode = 'paid_only' AND calc.financial_status = 'paid' AND calc.cancelled_at IS NULL)
        OR
        -- paid_with_cancelled: pagos, incluindo cancelados
        (calculation_mode = 'paid_with_cancelled' AND calc.financial_status = 'paid')
        OR
        -- all_orders: todos os pedidos (exceto testes)
        (calculation_mode = 'all_orders')
      )
  )
  -- Etapa final: Agrega os resultados por dia.
  SELECT
    filtered.sale_date,
    SUM(filtered.total_sales)::numeric AS total_sales
  FROM filtered
  GROUP BY filtered.sale_date
  ORDER BY filtered.sale_date;

END;
$function$;

-- Add default system_settings entry for calculation mode if not exists
INSERT INTO public.system_settings (key, value)
VALUES ('shopify_sales_calculation_mode', 'paid_only')
ON CONFLICT (key) DO NOTHING;
