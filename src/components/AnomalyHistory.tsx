import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useChannels } from '@/hooks/useChannels';
import { Anomaly } from '@/types/anomaly';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  TrendingDown, 
  TrendingUp, 
  XCircle, 
  Target,
  AlertTriangle,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'QUEDA_ABRUPTA':
      return TrendingDown;
    case 'PICO_VENDAS':
      return TrendingUp;
    case 'SEM_VENDAS':
      return XCircle;
    case 'META_DISTANTE':
      return Target;
    default:
      return AlertTriangle;
  }
};

const getSeverityConfig = (severity: string) => {
  switch (severity) {
    case 'CRITICA':
      return {
        color: 'text-red-600 bg-red-100 border-red-200 dark:bg-red-900/30 dark:text-red-400',
        label: 'Crítico',
        badgeVariant: 'destructive' as const
      };
    case 'ALTA':
      return {
        color: 'text-orange-600 bg-orange-100 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400',
        label: 'Alto',
        badgeVariant: 'secondary' as const
      };
    case 'MEDIA':
      return {
        color: 'text-yellow-600 bg-yellow-100 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
        label: 'Médio',
        badgeVariant: 'secondary' as const
      };
    case 'INFO':
      return {
        color: 'text-blue-600 bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
        label: 'Info',
        badgeVariant: 'secondary' as const
      };
    default:
      return {
        color: 'text-gray-600 bg-gray-100 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400',
        label: 'Info',
        badgeVariant: 'secondary' as const
      };
  }
};

export function AnomalyHistory() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const { channels } = useChannels();

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('anomaly_logs')
        .select('*')
        .gte('detected_at', thirtyDaysAgo)
        .order('detected_at', { ascending: false });
      
      if (error) throw error;
      setAnomalies((data as Anomaly[]) || []);
    } catch (error) {
      console.error('Error fetching anomaly history:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAnomalies = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('process-anomalies');
      
      if (error) {
        console.error('Erro ao processar anomalias:', error);
      } else {
        console.log('Anomalias processadas com sucesso');
        await fetchAnomalies();
      }
    } catch (error) {
      console.error('Erro ao chamar função de processamento:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const getChannelName = (channelId: string) => {
    return channels.find(c => c.id === channelId)?.name || 'Canal desconhecido';
  };

  const activeAnomalies = anomalies.filter(a => !a.dismissed_at);
  const dismissedAnomalies = anomalies.filter(a => a.dismissed_at);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico de Anomalias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando histórico...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Histórico de Anomalias
            </CardTitle>
            <CardDescription>
              Últimas 30 dias de anomalias detectadas
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={processAnomalies}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Detectar Novas
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Anomalias Ativas */}
        {activeAnomalies.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-foreground">
              Anomalias Ativas ({activeAnomalies.length})
            </h3>
            <div className="space-y-2">
              {activeAnomalies.map((anomaly) => {
                const severityConfig = getSeverityConfig(anomaly.severity);
                const TypeIcon = getTypeIcon(anomaly.type);
                
                return (
                  <div
                    key={anomaly.id}
                    className={cn(
                      "p-3 rounded-lg border",
                      severityConfig.color
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <TypeIcon className="h-4 w-4 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {getChannelName(anomaly.channel_id)}
                            </span>
                            <Badge variant={severityConfig.badgeVariant} className="text-xs">
                              {severityConfig.label}
                            </Badge>
                          </div>
                          <p className="text-sm mb-2">{anomaly.message}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              {format(new Date(anomaly.detected_at), "dd 'de' MMM", { locale: ptBR })}
                            </span>
                            <span>
                              Variação: {anomaly.variation_percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Anomalias Dispensadas */}
        {dismissedAnomalies.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">
              Anomalias Dispensadas ({dismissedAnomalies.length})
            </h3>
            <div className="space-y-2">
              {dismissedAnomalies.slice(0, 5).map((anomaly) => {
                const TypeIcon = getTypeIcon(anomaly.type);
                
                return (
                  <div
                    key={anomaly.id}
                    className="p-3 rounded-lg border border-muted bg-muted/30 opacity-60"
                  >
                    <div className="flex items-start gap-3">
                      <TypeIcon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-muted-foreground">
                            {getChannelName(anomaly.channel_id)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            Dispensada
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{anomaly.message}</p>
                        <div className="text-xs text-muted-foreground mt-1">
                          Detectada em {format(new Date(anomaly.detected_at), "dd 'de' MMM", { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {dismissedAnomalies.length > 5 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  ... e mais {dismissedAnomalies.length - 5} anomalias dispensadas
                </p>
              )}
            </div>
          </div>
        )}

        {anomalies.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Nenhuma anomalia encontrada nos últimos 30 dias
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}