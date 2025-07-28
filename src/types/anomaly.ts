export type AnomalyType = 'QUEDA_ABRUPTA' | 'PICO_VENDAS' | 'SEM_VENDAS' | 'META_DISTANTE';
export type AnomalySeverity = 'CRITICA' | 'ALTA' | 'MEDIA' | 'INFO';

export interface Anomaly {
  id: string;
  channel_id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  message: string;
  current_value: number;
  expected_value: number;
  variation_percentage: number;
  detected_at: string;
  dismissed_at?: string;
  dismissed_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DetectedAnomaly {
  tipo: AnomalyType;
  canal: string;
  channel_id: string;
  severidade: AnomalySeverity;
  mensagem: string;
  valor: number;
  mediaEsperada: number;
  variacaoPercentual: number;
}