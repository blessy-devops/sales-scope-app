CREATE TABLE public.campaign_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  coupon_code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, coupon_code)
);

COMMENT ON TABLE public.campaign_coupons IS 'Tabela de associação entre campanhas e os códigos de cupom usados nelas.';

ALTER TABLE public.campaign_coupons ENABLE ROW LEVEL SECURITY;