-- Criar tabela para metas anuais
CREATE TABLE public.yearly_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  total_revenue_target NUMERIC NOT NULL DEFAULT 0,
  total_margin_target NUMERIC NOT NULL DEFAULT 0,
  margin_percentage NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(year)
);

-- Criar tabela para distribuição trimestral
CREATE TABLE public.quarterly_distribution (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL CHECK (quarter >= 1 AND quarter <= 4),
  revenue_percentage NUMERIC NOT NULL DEFAULT 0,
  margin_percentage NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(year, quarter)
);

-- Criar tabela para metas mensais
CREATE TABLE public.monthly_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  quarter INTEGER NOT NULL CHECK (quarter >= 1 AND quarter <= 4),
  channel_id UUID NOT NULL,
  revenue_target NUMERIC NOT NULL DEFAULT 0,
  margin_target NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para distribuição de canais
CREATE TABLE public.channel_distribution (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  channel_id UUID NOT NULL,
  parent_channel_id UUID NULL,
  percentage NUMERIC NOT NULL DEFAULT 0,
  is_subchannel BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(year, channel_id)
);

-- Habilitar RLS
ALTER TABLE public.yearly_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quarterly_distribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_distribution ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para yearly_targets
CREATE POLICY "Authenticated users can view yearly targets" 
ON public.yearly_targets 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage yearly targets" 
ON public.yearly_targets 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Criar políticas RLS para quarterly_distribution
CREATE POLICY "Authenticated users can view quarterly distribution" 
ON public.quarterly_distribution 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage quarterly distribution" 
ON public.quarterly_distribution 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Criar políticas RLS para monthly_targets
CREATE POLICY "Authenticated users can view monthly targets" 
ON public.monthly_targets 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage monthly targets" 
ON public.monthly_targets 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Criar políticas RLS para channel_distribution
CREATE POLICY "Authenticated users can view channel distribution" 
ON public.channel_distribution 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage channel distribution" 
ON public.channel_distribution 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Criar trigger para atualizar updated_at em yearly_targets
CREATE TRIGGER update_yearly_targets_updated_at
BEFORE UPDATE ON public.yearly_targets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();