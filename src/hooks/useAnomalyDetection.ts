import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useChannels } from './useChannels';
import { useDailySales } from './useDailySales';
import { DetectedAnomaly, Anomaly, AnomalyType, AnomalySeverity } from '@/types/anomaly';
import { format, subDays, startOfDay } from 'date-fns';

export function useAnomalyDetection() {
  const { channels } = useChannels();
  const { sales } = useDailySales();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);

  // Detectar anomalias
  const detectedAnomalies = useMemo(() => {
    if (!channels.length || !sales.length) return [];

    const anomalias: DetectedAnomaly[] = [];
    const hoje = new Date();
    const ontem = format(subDays(hoje, 1), 'yyyy-MM-dd');

    channels.forEach(canal => {
      // Pegar vendas dos últimos 30 dias (excluindo hoje)
      const vendas30Dias = sales
        .filter(sale => 
          sale.channel_id === canal.id && 
          sale.sale_date !== format(hoje, 'yyyy-MM-dd') &&
          new Date(sale.sale_date) >= subDays(hoje, 31)
        )
        .map(sale => sale.amount);

      // Pegar venda de ontem
      const vendaOntem = sales.find(sale => 
        sale.channel_id === canal.id && 
        sale.sale_date === ontem
      );

      if (vendas30Dias.length === 0) return;

      const media30Dias = vendas30Dias.reduce((sum, val) => sum + val, 0) / vendas30Dias.length;
      const valorOntem = vendaOntem?.amount || 0;
      const variacaoPercentual = media30Dias > 0 
        ? ((valorOntem - media30Dias) / media30Dias) * 100 
        : 0;

      // Detectar queda abrupta
      if (variacaoPercentual < -30) {
        anomalias.push({
          tipo: 'QUEDA_ABRUPTA',
          canal: canal.name,
          channel_id: canal.id,
          severidade: variacaoPercentual < -50 ? 'CRITICA' : 'ALTA',
          mensagem: `${canal.name} caiu ${Math.abs(variacaoPercentual).toFixed(0)}% vs média de 30 dias`,
          valor: valorOntem,
          mediaEsperada: media30Dias,
          variacaoPercentual
        });
      }

      // Detectar pico de vendas
      if (variacaoPercentual > 100) {
        anomalias.push({
          tipo: 'PICO_VENDAS',
          canal: canal.name,
          channel_id: canal.id,
          severidade: 'INFO',
          mensagem: `${canal.name} teve pico de ${variacaoPercentual.toFixed(0)}% acima da média`,
          valor: valorOntem,
          mediaEsperada: media30Dias,
          variacaoPercentual
        });
      }

      // Detectar ausência de vendas
      if (valorOntem === 0 && media30Dias > 0) {
        anomalias.push({
          tipo: 'SEM_VENDAS',
          canal: canal.name,
          channel_id: canal.id,
          severidade: 'ALTA',
          mensagem: `${canal.name} não registrou vendas ontem`,
          valor: valorOntem,
          mediaEsperada: media30Dias,
          variacaoPercentual: -100
        });
      }
    });

    return anomalias;
  }, [channels, sales]);

  // Buscar anomalias salvas
  useEffect(() => {
    fetchAnomalies();
  }, []);

  const fetchAnomalies = async () => {
    try {
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('anomaly_logs')
        .select('*')
        .gte('detected_at', thirtyDaysAgo)
        .is('dismissed_at', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAnomalies((data as Anomaly[]) || []);
    } catch (error) {
      console.error('Error fetching anomalies:', error);
    } finally {
      setLoading(false);
    }
  };

  // Salvar nova anomalia
  const saveAnomaly = async (anomaly: DetectedAnomaly): Promise<void> => {
    try {
      const { error } = await supabase
        .from('anomaly_logs')
        .insert({
          channel_id: anomaly.channel_id,
          type: anomaly.tipo,
          severity: anomaly.severidade,
          message: anomaly.mensagem,
          current_value: anomaly.valor,
          expected_value: anomaly.mediaEsperada,
          variation_percentage: anomaly.variacaoPercentual,
          detected_at: format(subDays(new Date(), 1), 'yyyy-MM-dd') // Data de ontem
        });
      
      if (error) throw error;
      await fetchAnomalies();
    } catch (error) {
      console.error('Error saving anomaly:', error);
      throw error;
    }
  };

  // Dispensar anomalia
  const dismissAnomaly = async (anomalyId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('anomaly_logs')
        .update({
          dismissed_at: new Date().toISOString()
        })
        .eq('id', anomalyId);
      
      if (error) throw error;
      await fetchAnomalies();
    } catch (error) {
      console.error('Error dismissing anomaly:', error);
      throw error;
    }
  };

  // Verificar se anomalia já foi salva
  const isAnomalyAlreadySaved = (anomaly: DetectedAnomaly): boolean => {
    const ontem = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    return anomalies.some(saved => 
      saved.channel_id === anomaly.channel_id &&
      saved.type === anomaly.tipo &&
      saved.detected_at === ontem
    );
  };

  // Salvar novas anomalias detectadas
  const processDetectedAnomalies = async (): Promise<void> => {
    for (const anomaly of detectedAnomalies) {
      if (!isAnomalyAlreadySaved(anomaly)) {
        await saveAnomaly(anomaly);
      }
    }
  };

  // Anomalias ativas (não dispensadas)
  const activeAnomalies = anomalies.filter(a => !a.dismissed_at);

  // Contar por severidade
  const anomalyCounts = {
    total: activeAnomalies.length,
    critica: activeAnomalies.filter(a => a.severity === 'CRITICA').length,
    alta: activeAnomalies.filter(a => a.severity === 'ALTA').length,
    media: activeAnomalies.filter(a => a.severity === 'MEDIA').length,
    info: activeAnomalies.filter(a => a.severity === 'INFO').length
  };

  return {
    anomalies: activeAnomalies,
    detectedAnomalies,
    anomalyCounts,
    loading,
    dismissAnomaly,
    processDetectedAnomalies,
    isAnomalyAlreadySaved
  };
}