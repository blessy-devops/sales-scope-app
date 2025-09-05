
-- Create unified view for social media sales (Shopify + legacy)
CREATE OR REPLACE VIEW public.v_social_media_unified_sales AS
-- Shopify orders matched by social media coupons
SELECT
  (sog.created_at AT TIME ZONE 'America/Sao_Paulo')::date AS sale_date,
  sog.total_price::numeric                               AS total_price,
  sog.subtotal_price::numeric                            AS subtotal_price,
  'shopify_orders_gold'::text                            AS source_table
FROM public.shopify_orders_gold sog
JOIN public.social_media_coupons smc
  ON sog.coupon_code = smc.coupon_code

UNION ALL

-- Legacy social media sales table
SELECT
  (sms.order_created_at AT TIME ZONE 'America/Sao_Paulo')::date AS sale_date,
  sms.total_price::numeric                                     AS total_price,
  sms.subtotal_price::numeric                                  AS subtotal_price,
  'social_media_sales'::text                                   AS source_table
FROM public.social_media_sales sms;
