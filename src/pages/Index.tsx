import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DatePicker } from '@/components/DatePicker';
import { DashboardChart } from '@/components/DashboardChart';
import { LoadingCard } from '@/components/LoadingCard';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import { useDailySales } from '@/hooks/useDailySales';
import { useTargets } from '@/hooks/useTargets';
import { useChannels } from '@/hooks/useChannels';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { format, startOfMonth, endOfMonth, subDays, getDaysInMonth, differenceInDays } from 'date-fns';
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
  Zap
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
  
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  // Cálculos das métricas
  const currentMonthTargets = getTargetsForMonth(currentMonth, currentYear);
  const totalTargetMonth = currentMonthTargets.reduce((sum, target) => sum + target.target_amount, 0);
  
  // Calcular vendas do mês atual (soma de todas as vendas dos dias do mês)
  const startMonth = startOfMonth(currentDate);
  const endMonth = endOfMonth(currentDate);
  let totalSalesMonth = 0;
  
  // Iterar por todos os dias do mês para somar as vendas
  for (let d = new Date(startMonth); d <= endMonth; d.setDate(d.getDate() + 1)) {
    const dateStr = format(d, 'yyyy-MM-dd');
    const daySales = getSalesForDate(dateStr);
    totalSalesMonth += daySales.reduce((sum, sale) => sum + sale.amount, 0);
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

        {/* FILTRO ESTÁTICO PARA MÉTRICAS */}
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <Tabs value="mes" className="pointer-events-none">
                <TabsList className="grid w-full grid-cols-4 md:w-auto opacity-75">
                  <TabsTrigger value="hoje" disabled>Hoje</TabsTrigger>
                  <TabsTrigger value="7dias" disabled>Últimos 7 dias</TabsTrigger>
                  <TabsTrigger value="mes">Este mês</TabsTrigger>
                  <TabsTrigger value="customizado" disabled>Customizado</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="text-sm text-muted-foreground">
                Métricas sempre baseadas no mês atual
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
                    <Card className={`border-border/50 cursor-help transition-all duration-300 animate-fade-in ${
                      isRhythmCard ? 'border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10' : ''
                    }`}>
                     <CardContent className="p-4">
                       <div className="flex items-center justify-between mb-2">
                         <IconComponent className={`w-5 h-5 ${metric.color}`} />
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
        {dashboardConfig.showChart && <DashboardChart />}

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

        {/* Quick Actions */}
        <div className="border-t pt-6 md:pt-8">
          <h2 className="text-lg md:text-xl font-semibold text-foreground mb-4">Acesso Rápido</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border/50 hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                  Canais de Venda
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  onClick={() => window.location.href = '/channels'}
                  variant="outline"
                  className="w-full gap-2"
                >
                  Gerenciar
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="w-4 h-4 text-primary" />
                  Metas
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  onClick={() => window.location.href = '/targets'}
                  variant="outline"
                  className="w-full gap-2"
                >
                  Configurar
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Lançar Vendas
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  onClick={() => window.location.href = '/sales'}
                  variant="outline"
                  className="w-full gap-2"
                >
                  Registrar
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </TooltipProvider>
  );
};

export default Index;
