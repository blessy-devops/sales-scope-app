
-- Create or replace function to fetch attendant sales by period
CREATE OR REPLACE FUNCTION get_attendant_sales_by_period(start_date date, end_date date)
RETURNS TABLE (
  sale_date date,
  total_revenue numeric,
  total_sales bigint,
  attendant_name text,
  attendant_utm text,
  order_number bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (sog.created_at AT TIME ZONE 'America/Sao_Paulo')::date as sale_date,
    sog.total_price as total_revenue,
    1::bigint as total_sales,
    att.full_name as attendant_name,
    att.utm_identifier as attendant_utm,
    sog.order_number
  FROM
    public.shopify_orders_gold AS sog
  JOIN
    public.attendants AS att ON sog.utm_medium = att.utm_identifier
  WHERE
    (sog.created_at AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;
