import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAnomalyDetection } from '@/hooks/useAnomalyDetection';
import { useChannels } from '@/hooks/useChannels';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  XCircle,
  X,
  ExternalLink,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnomalySeverity, AnomalyType } from '@/types/anomaly';

const getSeverityConfig = (severity: AnomalySeverity) => {
  switch (severity) {
    case 'CRITICA':
      return {
        color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400',
        badgeColor: 'bg-red-500',
        icon: AlertTriangle,
        label: 'Crítico'
      };
    case 'ALTA':
      return {
        color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400',
        badgeColor: 'bg-orange-500',
        icon: AlertTriangle,
        label: 'Alto'
      };
    case 'MEDIA':
      return {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
        badgeColor: 'bg-yellow-500',
        icon: TrendingDown,
        label: 'Médio'
      };
    case 'INFO':
      return {
        color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
        badgeColor: 'bg-blue-500',
        icon: TrendingUp,
        label: 'Info'
      };
    default:
      return {
        color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400',
        badgeColor: 'bg-gray-500',
        icon: Bell,
        label: 'Info'
      };
  }
};

const getTypeIcon = (type: AnomalyType) => {
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
      return Bell;
  }
};

export function AnomalyAlertsCard() {
  const { anomalies, anomalyCounts, loading, dismissAnomaly } = useAnomalyDetection();
  const { channels } = useChannels();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const hasCriticalAlerts = anomalyCounts.critica > 0;

  const getChannelName = (channelId: string) => {
    return channels.find(c => c.id === channelId)?.name || 'Canal desconhecido';
  };

  const handleDismissAlert = async (anomalyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await dismissAnomaly(anomalyId);
    } catch (error) {
      console.error('Erro ao dispensar alerta:', error);
    }
  };

  const handleViewDetails = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    if (channel) {
      navigate(`/analises/performance-diaria?channel=${channelId}`);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle className="text-lg">Alertas de Performance</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando alertas...</p>
        </CardContent>
      </Card>
    );
  }

  if (anomalyCounts.total === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Alertas de Performance</CardTitle>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Tudo OK
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhuma anomalia detectada nas vendas recentes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "transition-colors duration-200",
      hasCriticalAlerts && "border-red-200 bg-red-50/30 dark:border-red-900 dark:bg-red-950/10"
    )}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Bell className={cn(
                    "h-5 w-5",
                    hasCriticalAlerts ? "text-red-600" : "text-orange-600"
                  )} />
                  {anomalyCounts.total > 0 && (
                    <div className={cn(
                      "absolute -top-1 -right-1 h-3 w-3 rounded-full text-xs flex items-center justify-center text-white font-bold",
                      hasCriticalAlerts ? "bg-red-500" : "bg-orange-500"
                    )}>
                      {anomalyCounts.total > 9 ? '9+' : anomalyCounts.total}
                    </div>
                  )}
                </div>
                <CardTitle className="text-lg">Alertas de Performance</CardTitle>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
              <div className="flex items-center gap-2">
                {anomalyCounts.critica > 0 && (
                  <Badge className="bg-red-500 text-white">
                    {anomalyCounts.critica} Crítico{anomalyCounts.critica > 1 ? 's' : ''}
                  </Badge>
                )}
                {anomalyCounts.alta > 0 && (
                  <Badge className="bg-orange-500 text-white">
                    {anomalyCounts.alta} Alto{anomalyCounts.alta > 1 ? 's' : ''}
                  </Badge>
                )}
                {anomalyCounts.info > 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30">
                    {anomalyCounts.info} Info
                  </Badge>
                )}
              </div>
            </div>
            <CardDescription>
              {anomalyCounts.total} {anomalyCounts.total === 1 ? 'anomalia detectada' : 'anomalias detectadas'} nas vendas recentes
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-3">
            {anomalies.map((anomaly) => {
              const severityConfig = getSeverityConfig(anomaly.severity);
              const TypeIcon = getTypeIcon(anomaly.type);
              const SeverityIcon = severityConfig.icon;
              
              return (
                <div
                  key={anomaly.id}
                  className={cn(
                    "p-3 rounded-lg border transition-colors",
                    severityConfig.color
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">
                        <SeverityIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <TypeIcon className="h-3 w-3" />
                          <span className="font-medium text-sm">
                            {getChannelName(anomaly.channel_id)}
                          </span>
                          <Badge 
                            variant="secondary" 
                            className={cn("text-xs px-1.5 py-0.5", severityConfig.badgeColor, "text-white")}
                          >
                            {severityConfig.label}
                          </Badge>
                        </div>
                        <p className="text-sm mb-2">{anomaly.message}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            Atual: R$ {anomaly.current_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span>
                            Esperado: R$ {anomaly.expected_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span>
                            Variação: {anomaly.variation_percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewDetails(anomaly.channel_id)}
                        className="h-8 px-2 text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Ver detalhes
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDismissAlert(anomaly.id, e)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}