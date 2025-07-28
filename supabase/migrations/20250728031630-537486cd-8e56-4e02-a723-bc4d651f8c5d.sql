-- Criar tabela para observações diárias
CREATE TABLE public.daily_observations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL,
  date DATE NOT NULL,
  observation TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar índices para melhor performance
CREATE INDEX idx_daily_observations_channel_date ON public.daily_observations(channel_id, date);
CREATE INDEX idx_daily_observations_date ON public.daily_observations(date);

-- Habilitar RLS
ALTER TABLE public.daily_observations ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Authenticated users can view daily observations" 
ON public.daily_observations 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert daily observations" 
ON public.daily_observations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update daily observations" 
ON public.daily_observations 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete daily observations" 
ON public.daily_observations 
FOR DELETE 
USING (true);

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_daily_observations_updated_at
BEFORE UPDATE ON public.daily_observations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();