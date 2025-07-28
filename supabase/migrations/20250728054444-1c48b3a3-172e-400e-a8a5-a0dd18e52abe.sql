-- Criar tabela para logs de anomalias
CREATE TABLE public.anomaly_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('QUEDA_ABRUPTA', 'PICO_VENDAS', 'SEM_VENDAS', 'META_DISTANTE')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('CRITICA', 'ALTA', 'MEDIA', 'INFO')),
  message TEXT NOT NULL,
  current_value NUMERIC NOT NULL DEFAULT 0,
  expected_value NUMERIC NOT NULL DEFAULT 0,
  variation_percentage NUMERIC NOT NULL DEFAULT 0,
  detected_at DATE NOT NULL DEFAULT CURRENT_DATE,
  dismissed_at TIMESTAMP WITH TIME ZONE NULL,
  dismissed_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.anomaly_logs ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Authenticated users can view anomaly logs" 
ON public.anomaly_logs 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert anomaly logs" 
ON public.anomaly_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update anomaly logs" 
ON public.anomaly_logs 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete anomaly logs" 
ON public.anomaly_logs 
FOR DELETE 
USING (true);

-- Criar índices para melhor performance
CREATE INDEX idx_anomaly_logs_channel_date ON public.anomaly_logs(channel_id, detected_at);
CREATE INDEX idx_anomaly_logs_severity ON public.anomaly_logs(severity, detected_at);
CREATE INDEX idx_anomaly_logs_dismissed ON public.anomaly_logs(dismissed_at) WHERE dismissed_at IS NULL;

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_anomaly_logs_updated_at
BEFORE UPDATE ON public.anomaly_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();