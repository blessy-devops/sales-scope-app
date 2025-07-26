import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Treemap } from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/DatePicker';
import { DashboardChart } from '@/components/DashboardChart';
import { LoadingCard } from '@/components/LoadingCard';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import { useDailySales } from '@/hooks/useDailySales';
import { useTargets } from '@/hooks/useTargets';
import { useChannels } from '@/hooks/useChannels';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { format, startOfMonth, endOfMonth, subDays, getDaysInMonth, differenceInDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  DollarSign,
  Target,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
  ArrowRight,
  ShoppingBag,
  BarChart3,
  Wifi,
  WifiOff,
  ArrowUp,
  ArrowDown,
  Activity,
  ChartLine,
  Zap,
  ChevronDown,
  ChevronUp,
  Award,
  TrendingDown as TrendingDownIcon,
  Calculator,
  Eye
} from 'lucide-react';

type PeriodFilter = 'hoje' | '7dias' | 'mes' | 'customizado';

const Index = () => {
  const [loading, setLoading] = useState(false);
  const { isConnected, lastUpdate } = useRealTimeUpdates();
  const { channels } = useChannels();
  const { getSalesForDate, getSaleAmount } = useDailySales();
  const { getTargetsForMonth } = useTargets();
  const { getPreference } = useUserPreferences();
  
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('mes');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [expandedAnalysis, setExpandedAnalysis] = useState(false);
  const [viewFilter, setViewFilter] = useState<string>('global');

  // Persistência do filtro de visão
  useEffect(() => {
    const savedView = localStorage.getItem('dashboard-view-filter');
    if (savedView) {
      setViewFilter(savedView);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dashboard-view-filter', viewFilter);
  }, [viewFilter]);
  
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  // Obter canal selecionado
  const selectedChannel = viewFilter === 'global' ? null : channels.find(c => c.id === viewFilter);
  const activeChannels = channels.filter(c => c.is_active).sort((a, b) => a.name.localeCompare(b.name));

  // Cálculos das métricas baseados no filtro de visão
  const currentMonthTargets = getTargetsForMonth(currentMonth, currentYear);
  
  // Filtrar metas conforme visão selecionada
  const filteredTargets = viewFilter === 'global' 
    ? currentMonthTargets 
    : currentMonthTargets.filter(t => t.channel_id === viewFilter);
  
  const totalTargetMonth = filteredTargets.reduce((sum, target) => sum + target.target_amount, 0);
  
  // Calcular vendas do mês atual filtradas conforme visão
  const startMonth = startOfMonth(currentDate);
  const endMonth = endOfMonth(currentDate);
  let totalSalesMonth = 0;
  
  // Iterar por todos os dias do mês para somar as vendas
  for (let d = new Date(startMonth); d <= endMonth; d.setDate(d.getDate() + 1)) {
    const dateStr = format(d, 'yyyy-MM-dd');
    const daySales = getSalesForDate(dateStr);
    
    if (viewFilter === 'global') {
      totalSalesMonth += daySales.reduce((sum, sale) => sum + sale.amount, 0);
    } else {
      totalSalesMonth += getSaleAmount(viewFilter, dateStr);
    }
  }
  
  // NOVOS CÁLCULOS
  const daysInMonth = getDaysInMonth(currentDate);
  const daysPassed = currentDate.getDate();
  
  // Meta esperada até hoje = (Meta Mensal / Dias do Mês) × Dias passados
  const expectedTargetToday = (totalTargetMonth / daysInMonth) * daysPassed;
  
  // Desempenho R$ = Realizado - Meta esperada até hoje
  const performanceValue = totalSalesMonth - expectedTargetToday;
  
  // Desempenho % = (Desempenho R$ / Meta esperada até hoje) × 100
  const performancePercent = expectedTargetToday > 0 ? (performanceValue / expectedTargetToday) * 100 : 0;
  
  // Saldo Meta R$ = Meta Mensal - Realizado
  const remainingTargetValue = totalTargetMonth - totalSalesMonth;
  
  // Saldo Meta % = (Saldo Meta R$ / Meta Mensal) × 100
  const remainingTargetPercent = totalTargetMonth > 0 ? (remainingTargetValue / totalTargetMonth) * 100 : 0;
  
  const remainingDays = Math.max(0, daysInMonth - currentDate.getDate());
  const originalDailyTarget = totalTargetMonth / daysInMonth;
  const adjustedDailyTarget = remainingDays > 0 ? Math.max(0, remainingTargetValue) / remainingDays : 0;

  // CÁLCULOS DE RITMO
  const currentPace = daysPassed > 0 ? totalSalesMonth / daysPassed : 0; // Ritmo atual
  const projectedTotal = currentPace * daysInMonth; // Projetado
  const projectedPercent = totalTargetMonth > 0 ? (projectedTotal / totalTargetMonth) * 100 : 0;
  const requiredPace = remainingDays > 0 ? Math.max(0, remainingTargetValue) / remainingDays : 0; // Ritmo necessário
  
  const [simulatedPace, setSimulatedPace] = useState<number[]>([currentPace || 0]);

  // Função para obter ícone do canal
  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'Marketplace': return ShoppingBag;
      case 'E-commerce': return BarChart3;
      case 'Landing Page': return Target;
      default: return ShoppingBag;
    }
  };

  // Calcular dados dos canais baseado apenas no mês atual (não impactado pelos filtros)
  const getChannelData = () => {
    return channels.filter(c => c.is_active).map(channel => {
      let channelSales = 0;
      let channelTarget = 0;
      
      // Sempre usar dados do mês atual para os cards de canal
      for (let d = new Date(startMonth); d <= endMonth; d.setDate(d.getDate() + 1)) {
        const dateStr = format(d, 'yyyy-MM-dd');
        channelSales += getSaleAmount(channel.id, dateStr);
      }
      // Meta do mês
      const target = currentMonthTargets.find(t => t.channel_id === channel.id);
      channelTarget = target?.target_amount || 0;
      
      const progress = channelTarget > 0 ? (channelSales / channelTarget) * 100 : 0;
      // Calcular desempenho do canal com a nova fórmula
      const channelExpectedTarget = (channelTarget / daysInMonth) * daysPassed;
      const channelPerformanceValue = channelSales - channelExpectedTarget;
      const channelPerformancePercent = channelExpectedTarget > 0 ? (channelPerformanceValue / channelExpectedTarget) * 100 : 0;
      
      // Cálculos de ritmo do canal
      const channelCurrentPace = daysPassed > 0 ? channelSales / daysPassed : 0;
      const channelProjectedTotal = channelCurrentPace * daysInMonth;
      const channelProjectedPercent = channelTarget > 0 ? (channelProjectedTotal / channelTarget) * 100 : 0;
      const channelRemainingTarget = channelTarget - channelSales;
      const channelRequiredPace = remainingDays > 0 ? Math.max(0, channelRemainingTarget) / remainingDays : 0;
      
      return {
        ...channel,
        sales: channelSales,
        target: channelTarget,
        progress: Math.min(progress, 100),
        performanceValue: channelPerformanceValue,
        performancePercent: channelPerformancePercent,
        currentPace: channelCurrentPace,
        projectedTotal: channelProjectedTotal,
        projectedPercent: channelProjectedPercent,
        requiredPace: channelRequiredPace
      };
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Carregar configurações do dashboard
  const dashboardConfig = getPreference('dashboard_config', {
    showRealizadoGlobal: true,
    showMetaGlobal: true,
    showDesempenhoPercent: true,
    showDesempenhoValue: true,
    showSaldoMeta: true,
    showRitmoAtual: true,
    showProjetado: true,
    showRitmoNecessario: true,
    showMetaDiariaOriginal: true,
    showMetaDiariaAjustada: false,
    showChart: true,
    showChannelGrid: true,
  });

  // Função para obter insight automático
  const getPerformanceInsight = (percent: number) => {
    if (percent > 10) return "Excelente! 🎉";
    if (percent >= 0) return "No caminho certo! 👍";
    if (percent >= -10) return "Atenção necessária ⚠️";
    return "Ação urgente! 🚨";
  };

  const allMetrics = [
    {
      key: 'showRealizadoGlobal',
      title: 'Realizado',
      value: formatCurrency(totalSalesMonth),
      icon: DollarSign,
      color: 'text-primary',
      tooltip: 'Total de vendas realizadas no mês atual'
    },
    {
      key: 'showMetaGlobal',
      title: 'Meta Mensal',
      value: formatCurrency(totalTargetMonth),
      icon: Target,
      color: 'text-primary',
      tooltip: 'Total de metas definidas para o mês'
    },
    {
      key: 'showDesempenhoPercent',
      title: 'Desempenho %',
      value: `${performancePercent >= 0 ? '+' : ''}${performancePercent.toFixed(1)}%`,
      icon: performancePercent >= 0 ? TrendingUp : TrendingDown,
      color: performancePercent >= 0 ? 'text-emerald-600' : 'text-red-500',
      bgColor: performancePercent >= 0 ? 'bg-emerald-50/50' : 'bg-red-50/50',
      borderColor: performancePercent >= 0 ? 'border-emerald-200/50' : 'border-red-200/50',
      tooltip: 'Diferença entre realizado e esperado até hoje',
      isPerformance: true,
      progressValue: Math.abs(performancePercent),
      insight: getPerformanceInsight(performancePercent)
    },
    {
      key: 'showDesempenhoValue',
      title: 'Desempenho R$',
      value: `${performanceValue >= 0 ? '+' : ''}${formatCurrency(Math.abs(performanceValue))}`,
      icon: performanceValue >= 0 ? TrendingUp : TrendingDown,
      color: performanceValue >= 0 ? 'text-emerald-600' : 'text-red-500',
      bgColor: performanceValue >= 0 ? 'bg-emerald-50/50' : 'bg-red-50/50',
      borderColor: performanceValue >= 0 ? 'border-emerald-200/50' : 'border-red-200/50',
      tooltip: 'Diferença entre realizado e esperado até hoje',
      isPerformance: true,
      progressValue: Math.abs(performancePercent),
      insight: getPerformanceInsight(performancePercent)
    },
    {
      key: 'showSaldoMeta',
      title: 'Saldo Meta',
      value: `${formatCurrency(Math.abs(remainingTargetValue))} (${Math.abs(remainingTargetPercent).toFixed(1)}%)`,
      icon: Target,
      color: 'text-slate-600',
      tooltip: 'Quanto falta para atingir a meta total do mês'
    },
    {
      key: 'showMetaDiariaOriginal',
      title: 'Meta Diária Original',
      value: formatCurrency(originalDailyTarget),
      icon: Target,
      color: 'text-muted-foreground',
      tooltip: 'Meta mensal dividida pelos dias do mês'
    },
    {
      key: 'showRitmoAtual',
      title: 'Ritmo Atual',
      value: formatCurrency(currentPace),
      subtitle: 'Média diária até hoje',
      icon: Activity,
      color: 'text-primary',
      isRhythm: true,
      tooltip: 'Média de vendas por dia até hoje'
    },
    {
      key: 'showProjetado',
      title: 'Projetado',
      value: formatCurrency(projectedTotal),
      subtitle: `${projectedPercent.toFixed(1)}% da meta`,
      icon: ChartLine,
      color: projectedPercent >= 100 ? 'text-emerald-600' : projectedPercent >= 95 ? 'text-yellow-600' : 'text-red-500',
      subtitleColor: projectedPercent >= 100 ? 'text-emerald-600' : projectedPercent >= 95 ? 'text-yellow-600' : 'text-red-500',
      isRhythm: true,
      tooltip: 'Projeção baseada no ritmo atual'
    },
    {
      key: 'showRitmoNecessario',
      title: 'Ritmo Necessário',
      value: formatCurrency(requiredPace),
      subtitle: 'Para atingir a meta',
      icon: Zap,
      color: requiredPace <= currentPace ? 'text-emerald-600' : 'text-red-500',
      isRhythm: true,
      tooltip: 'Vendas diárias necessárias para atingir a meta'
    },
    {
      key: 'showMetaDiariaAjustada',
      title: 'Meta Diária Ajustada',
      value: formatCurrency(adjustedDailyTarget),
      icon: Target,
      color: 'text-warning',
      tooltip: 'Meta ajustada para atingir o saldo restante nos dias que faltam'
    }
  ];

  const metrics = allMetrics.filter(metric => dashboardConfig[metric.key as keyof typeof dashboardConfig]);
  const channelData = getChannelData();

  return (
    <TooltipProvider>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER COM FILTROS */}
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Tabs value="mes" className="pointer-events-none">
                  <TabsList className="grid w-full grid-cols-4 sm:w-auto opacity-75">
                    <TabsTrigger value="hoje" disabled>Hoje</TabsTrigger>
                    <TabsTrigger value="7dias" disabled>Últimos 7 dias</TabsTrigger>
                    <TabsTrigger value="mes">Este mês</TabsTrigger>
                    <TabsTrigger value="customizado" disabled>Customizado</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                {/* DROPDOWN DE VISÃO POR CANAL */}
                <Select value={viewFilter} onValueChange={setViewFilter}>
                  <SelectTrigger className="w-48 transition-all duration-200">
                    <Eye className="w-4 h-4 mr-2 text-primary" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg">
                    <SelectItem value="global" className="cursor-pointer">
                      Visão Global
                    </SelectItem>
                    {activeChannels.map(channel => (
                      <SelectItem key={channel.id} value={channel.id} className="cursor-pointer">
                        {channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col items-end gap-1">
                <div className="text-sm text-muted-foreground">
                  Métricas baseadas no mês atual
                </div>
                {viewFilter !== 'global' && selectedChannel && (
                  <Badge variant="secondary" className="text-xs">
                    Filtrando: {selectedChannel.name}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TOP SECTION - Métricas */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <LoadingCard key={index} />
            ))}
          </div>
        ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
           {metrics.map((metric, index) => {
             const IconComponent = metric.icon;
             const isPerformanceCard = metric.isPerformance;
             const isRhythmCard = metric.isRhythm;
             
             return (
               <Tooltip key={index}>
                 <TooltipTrigger asChild>
                      <Card className={`border-border/50 cursor-help transition-all duration-500 ease-in-out animate-fade-in ${
                        isRhythmCard ? 'border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10' : ''
                      } ${viewFilter !== 'global' ? 'border-accent/30 bg-gradient-to-br from-accent/5 to-accent/10' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <IconComponent className={`w-5 h-5 ${metric.color}`} />
                          {viewFilter !== 'global' && (
                            <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                              {selectedChannel?.name || 'Canal'}
                            </Badge>
                          )}
                        </div>
                       <div className="space-y-2">
                         <p className="text-sm font-medium text-muted-foreground">
                           {metric.title}
                         </p>
                         <p className={`text-lg font-bold ${metric.color}`}>
                           {metric.value}
                         </p>
                         
                         {metric.subtitle && (
                           <p className={`text-xs font-medium ${
                             metric.subtitleColor || 'text-muted-foreground'
                           }`}>
                             {metric.subtitle}
                           </p>
                         )}
                         
                         {isPerformanceCard && (
                           <>
                             {/* Barra de progresso visual */}
                             <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                               <div className="absolute inset-0 flex items-center justify-center">
                                 <div className="w-0.5 h-full bg-muted-foreground/30"></div>
                               </div>
                               <div 
                                 className={`h-full transition-all duration-500 ${
                                   performancePercent >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                                 }`}
                                 style={{
                                   width: `${Math.min(Math.abs(performancePercent), 50)}%`,
                                   marginLeft: performancePercent >= 0 ? '50%' : `${50 - Math.min(Math.abs(performancePercent), 50)}%`
                                 }}
                               />
                             </div>
                             
                             {/* Insight automático */}
                             <p className="text-xs text-muted-foreground font-medium">
                               {metric.insight}
                             </p>
                           </>
                         )}
                       </div>
                     </CardContent>
                   </Card>
                 </TooltipTrigger>
                 <TooltipContent>
                   <p>{metric.tooltip}</p>
                 </TooltipContent>
               </Tooltip>
             );
             })}
          </div>
        )}

        {/* GRÁFICO */}
        {dashboardConfig.showChart && (
          <DashboardChart 
            viewFilter={viewFilter} 
            selectedChannel={selectedChannel}
          />
        )}

        {/* ANÁLISE DETALHADA DE RITMO */}
        <Card className="border-border/50">
          <CardContent className="p-6">
            <Button
              variant="ghost"
              onClick={() => setExpandedAnalysis(!expandedAnalysis)}
              className="w-full flex items-center justify-between p-4 h-auto"
            >
              <span className="text-lg font-semibold">Ver análise detalhada de ritmo</span>
              {expandedAnalysis ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </Button>
            
            {expandedAnalysis && (
              <div className="mt-6 space-y-8 animate-fade-in">
                {/* Gráfico de Linha */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Evolução dos Últimos 15 Dias</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={(() => {
                          const ultimos15Dias = [];
                          for (let i = 14; i >= 0; i--) {
                            const date = subDays(currentDate, i);
                            const dateStr = format(date, 'yyyy-MM-dd');
                            const daySales = getSalesForDate(dateStr);
                            const totalDay = daySales.reduce((sum, sale) => sum + sale.amount, 0);
                            
                            ultimos15Dias.push({
                              data: format(date, 'dd/MM'),
                              vendas: totalDay,
                              ritmoNecessario: requiredPace,
                              metaDiariaOriginal: originalDailyTarget
                            });
                          }
                          return ultimos15Dias;
                        })()}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="data" 
                          className="fill-muted-foreground text-xs"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          className="fill-muted-foreground text-xs"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                        />
                        <RechartsTooltip 
                          formatter={(value: number, name: string) => {
                            const legendMap: Record<string, string> = {
                              'vendas': 'Vendas Diárias',
                              'ritmoNecessario': 'Ritmo Necessário', 
                              'metaDiariaOriginal': 'Meta Diária Original'
                            };
                            return [formatCurrency(value), legendMap[name] || name];
                          }}
                          labelStyle={{ color: 'hsl(var(--foreground))' }}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))' 
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="vendas" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                          name="Vendas Diárias"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="ritmoNecessario" 
                          stroke="hsl(var(--destructive))" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                          name="Ritmo Necessário"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="metaDiariaOriginal" 
                          stroke="hsl(var(--muted-foreground))" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                          name="Meta Diária Original"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Tabela Comparativa de Canais */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Comparativo de Ritmo por Canal</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Canal</th>
                          <th className="text-right p-3 text-sm font-semibold text-muted-foreground">Ritmo Atual</th>
                          <th className="text-right p-3 text-sm font-semibold text-muted-foreground">Necessário</th>
                          <th className="text-center p-3 text-sm font-semibold text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {channelData.map(canal => {
                          const status = canal.currentPace >= canal.requiredPace;
                          return (
                            <tr key={canal.id} className="border-b border-border/50">
                              <td className="p-3 text-sm font-medium">{canal.name}</td>
                              <td className="p-3 text-sm text-right">R$ {canal.currentPace.toFixed(0)}</td>
                              <td className="p-3 text-sm text-right">R$ {canal.requiredPace.toFixed(0)}</td>
                              <td className="p-3 text-center text-lg">{status ? '✅' : '⚠️'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Previsão */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Previsão para Fim do Mês</h3>
                  <Card className="p-4 bg-muted/30">
                    <p className="text-sm font-medium">
                      {(() => {
                        const diasParaMeta = Math.ceil(remainingTargetValue / currentPace);
                        const dataProjetada = addDays(new Date(), diasParaMeta);
                        
                        if (currentPace >= requiredPace) {
                          return `Meta será atingida ${diasParaMeta <= remainingDays ? 
                            `em ${format(dataProjetada, 'dd/MM')}` : 
                            'dentro do prazo ✅'}`;
                        } else {
                          const deficitProjetado = remainingTargetValue - (currentPace * remainingDays);
                          return `Projeção: R$ ${deficitProjetado.toFixed(0)} abaixo da meta ⚠️`;
                        }
                      })()}
                    </p>
                  </Card>
                </div>

                {/* Três Métricas Rápidas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Métricas dos Últimos 15 Dias</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(() => {
                      const ultimos15DiasDados = [];
                      for (let i = 14; i >= 0; i--) {
                        const date = subDays(currentDate, i);
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const daySales = getSalesForDate(dateStr);
                        const totalDay = daySales.reduce((sum, sale) => sum + sale.amount, 0);
                        ultimos15DiasDados.push({
                          date,
                          dateStr,
                          valor: totalDay
                        });
                      }
                      
                      const melhorDia = ultimos15DiasDados.reduce((max, day) => day.valor > max.valor ? day : max);
                      const piorDia = ultimos15DiasDados.reduce((min, day) => day.valor < min.valor ? day : min);
                      const ultimos7Dias = ultimos15DiasDados.slice(-7);
                      const mediaUltimos7 = ultimos7Dias.reduce((sum, day) => sum + day.valor, 0) / 7;
                      
                      return [
                        {
                          title: 'Melhor Dia',
                          value: formatCurrency(melhorDia.valor),
                          subtitle: `(${format(melhorDia.date, 'dd/MM')})`,
                          icon: Award,
                          color: 'text-emerald-600'
                        },
                        {
                          title: 'Pior Dia',
                          value: formatCurrency(piorDia.valor),
                          subtitle: `(${format(piorDia.date, 'dd/MM')})`,
                          icon: TrendingDownIcon,
                          color: 'text-red-500'
                        },
                        {
                          title: 'Média Últimos 7 Dias',
                          value: formatCurrency(mediaUltimos7),
                          subtitle: 'Ritmo semanal',
                          icon: Activity,
                          color: 'text-primary'
                        }
                      ];
                    })().map((metrica, index) => {
                      const IconComponent = metrica.icon;
                      return (
                        <Card key={index} className="p-4">
                          <div className="flex items-center gap-3">
                            <IconComponent className={`w-5 h-5 ${metrica.color}`} />
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">{metrica.title}</p>
                              <p className={`text-lg font-bold ${metrica.color}`}>{metrica.value}</p>
                              <p className="text-xs text-muted-foreground">{metrica.subtitle}</p>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                   </div>
                </div>

                {/* Simulador de Ritmo */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-primary" />
                    Simulador de Ritmo
                  </h3>
                  <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Ritmo Diário Simulado</Label>
                          <span className="text-sm font-semibold text-primary">
                            {formatCurrency(simulatedPace[0])}
                          </span>
                        </div>
                        <Slider
                          value={simulatedPace}
                          onValueChange={setSimulatedPace}
                          max={Math.max(currentPace * 2, 50000)}
                          min={0}
                          step={100}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>R$ 0</span>
                          <span>Atual: {formatCurrency(currentPace)}</span>
                          <span>{formatCurrency(Math.max(currentPace * 2, 50000))}</span>
                        </div>
                      </div>
                      
                      <div className="bg-background/60 rounded-lg p-4 border border-border/50">
                        {(() => {
                          const simulatedTotal = simulatedPace[0] * daysInMonth;
                          const simulatedPercent = totalTargetMonth > 0 ? (simulatedTotal / totalTargetMonth) * 100 : 0;
                          const difference = simulatedTotal - totalTargetMonth;
                          const isAboveTarget = simulatedPercent >= 100;
                          
                          return (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Projeção Final:</span>
                                <span className="font-semibold text-lg">
                                  {formatCurrency(simulatedTotal)}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Percentual da Meta:</span>
                                <span className={`font-bold text-lg ${
                                  isAboveTarget ? 'text-emerald-600' : 'text-red-500'
                                }`}>
                                  {simulatedPercent.toFixed(1)}%
                                </span>
                              </div>
                              
                              <div className="mt-4 p-3 rounded-lg bg-muted/30">
                                <p className="text-sm font-medium">
                                  {isAboveTarget ? (
                                    <>
                                      🎯 <span className="text-emerald-600">
                                        Se mantiver R$ {formatCurrency(simulatedPace[0])}/dia, superará a meta em {formatCurrency(Math.abs(difference))} ({(simulatedPercent - 100).toFixed(1)}%)
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      ⚠️ <span className="text-red-500">
                                        Com R$ {formatCurrency(simulatedPace[0])}/dia, ficará {formatCurrency(Math.abs(difference))} abaixo da meta ({(100 - simulatedPercent).toFixed(1)}%)
                                      </span>
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* BOTTOM SECTION - Grid de Canais */}
        {dashboardConfig.showChannelGrid && (
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-foreground mb-4">Desempenho por Canal</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {channelData.map((channel) => {
                const IconComponent = getChannelIcon(channel.type);
                return (
                  <Card key={channel.id} className="border-border/50 hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">{channel.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {channel.type}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Realizado</span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(channel.sales)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Meta</span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(channel.target)}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-medium text-foreground">
                              {channel.progress.toFixed(1)}%
                            </span>
                          </div>
                          <Progress 
                            value={channel.progress} 
                            className="h-2"
                          />
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Desempenho</span>
                          <span className={`font-medium ${
                            channel.performancePercent >= 0 ? 'text-emerald-600' : 'text-red-500'
                          }`}>
                            {channel.performancePercent >= 0 ? '+' : ''}{channel.performancePercent.toFixed(1)}%
                          </span>
                        </div>
                        
                        {/* Seção de Ritmo */}
                        <div className="border-t pt-3 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Ritmo</span>
                            <span className="font-medium text-primary">
                              {formatCurrency(channel.currentPace)}/dia
                            </span>
                          </div>
                          
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Projetado</span>
                            <span className={`font-medium ${
                              channel.projectedPercent >= 100 ? 'text-emerald-600' : 
                              channel.projectedPercent >= 95 ? 'text-yellow-600' : 'text-red-500'
                            }`}>
                              {formatCurrency(channel.projectedTotal)} ({channel.projectedPercent.toFixed(1)}%)
                            </span>
                          </div>
                          
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Ritmo Necessário</span>
                            <span className={`font-medium ${
                              channel.requiredPace <= channel.currentPace ? 'text-emerald-600' : 'text-red-500'
                            }`}>
                              {formatCurrency(channel.requiredPace)}/dia
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* VISÃO ANALÍTICA - Gráfico de Árvore e Ranking */}
        <div className="space-y-6">
          <h2 className="text-lg md:text-xl font-semibold text-foreground">Análise de Representatividade</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico de Árvore - 65% */}
            <div className="lg:col-span-2">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Representatividade por Canal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full">
                    {(() => {
                      // Cores predefinidas para os canais
                      const coresCanais = [
                        '#3B82F6', // Blue
                        '#10B981', // Green
                        '#F59E0B', // Yellow
                        '#EF4444', // Red
                        '#8B5CF6', // Purple
                        '#F97316', // Orange
                        '#06B6D4', // Cyan
                        '#84CC16', // Lime
                      ];

                      const gerarCorPorIndice = (index) => {
                        return coresCanais[index % coresCanais.length];
                      };

                      // Preparar dados dos canais com vendas
                      const canaisComVendas = channelData
                        .filter(channel => channel.sales > 0)
                        .map((channel, index) => ({
                          name: channel.name,
                          total_vendas: channel.sales || 0,
                          fill: gerarCorPorIndice(index)
                        }))
                        .sort((a, b) => b.total_vendas - a.total_vendas);

                      // Preparar dados corretamente para o Treemap
                      const dadosTreemap = canaisComVendas.map((canal, index) => ({
                        name: canal.name,
                        size: canal.total_vendas,
                        fill: gerarCorPorIndice(index)
                      }));

                      // Calcular total para porcentagens
                      const totalVendas = canaisComVendas.reduce((sum, canal) => sum + canal.total_vendas, 0);

                      // Log para debug
                      console.log('Dados Treemap:', { dadosTreemap, totalVendas, canaisComVendas });

                      // Verificar se há dados
                      if (canaisComVendas.length === 0 || totalVendas === 0) {
                        return (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <div className="text-center">
                              <p className="text-lg font-medium">Nenhuma venda registrada</p>
                              <p className="text-sm mt-2">Os dados aparecerão aqui quando houver vendas nos canais</p>
                            </div>
                          </div>
                        );
                      }

                      // Custom content simplificado
                      const CustomizedContent = (props) => {
                        const { x, y, width, height, payload } = props;
                        
                        if (!payload || !payload.size || width < 40 || height < 30) {
                          return null;
                        }

                        const porcentagem = totalVendas > 0 ? 
                          ((payload.size / totalVendas) * 100).toFixed(1) : 0;

                        const mostrarTexto = width > 80 && height > 60;

                        return (
                          <g>
                            <rect
                              x={x}
                              y={y}
                              width={width}
                              height={height}
                              fill={payload.fill}
                              stroke="#fff"
                              strokeWidth={2}
                              rx={4}
                            />
                            
                            {mostrarTexto && (
                              <g>
                                <text
                                  x={x + width / 2}
                                  y={y + height / 2 - 8}
                                  textAnchor="middle"
                                  fill="white"
                                  fontSize="12"
                                  fontWeight="600"
                                >
                                  {payload.name}
                                </text>
                                <text
                                  x={x + width / 2}
                                  y={y + height / 2 + 8}
                                  textAnchor="middle"
                                  fill="white"
                                  fontSize="11"
                                >
                                  {porcentagem}%
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      };

                      return (
                        <ResponsiveContainer width="100%" height={400}>
                          <Treemap
                            data={dadosTreemap}
                            dataKey="size"
                            stroke="#fff"
                            content={<CustomizedContent />}
                          />
                        </ResponsiveContainer>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ranking Top 3 - 35% */}
            <div className="lg:col-span-1">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Top 3 Canais do Mês</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {channelData
                      .sort((a, b) => b.sales - a.sales)
                      .slice(0, 3)
                      .map((channel, index) => {
                        const totalSales = channelData.reduce((sum, ch) => sum + ch.sales, 0);
                        const percentage = totalSales > 0 ? (channel.sales / totalSales) * 100 : 0;
                        const IconComponent = getChannelIcon(channel.type);
                        
                        return (
                          <div key={channel.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm ${
                              index === 0 ? 'bg-yellow-500' : 
                              index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                            }`}>
                              {index + 1}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <IconComponent className="w-4 h-4 text-primary" />
                                <h4 className="font-medium text-sm truncate">{channel.name}</h4>
                              </div>
                              
                              <p className="text-lg font-bold text-foreground">
                                {formatCurrency(channel.sales)}
                              </p>
                              
                              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                                <span>{percentage.toFixed(1)}% do total</span>
                                <span className={channel.sales >= channel.target ? 'text-emerald-600' : 'text-red-500'}>
                                  {((channel.sales / channel.target) * 100).toFixed(0)}% da meta
                                </span>
                              </div>
                              
                              <div className="mt-2">
                                <Progress 
                                  value={Math.min((channel.sales / channel.target) * 100, 100)} 
                                  className="h-1"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  
                  {/* Resumo Total */}
                  <div className="mt-6 pt-4 border-t border-border">
                    <div className="text-center space-y-1">
                      <p className="text-sm text-muted-foreground">Total Geral</p>
                      <p className="text-lg font-bold text-foreground">
                        {formatCurrency(channelData.reduce((sum, ch) => sum + ch.sales, 0))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {channelData.length} canais ativos
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      </div>
    </TooltipProvider>
  );
};

export default Index;
