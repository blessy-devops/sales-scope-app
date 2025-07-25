import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DatePicker } from '@/components/DatePicker';
import { DashboardChart } from '@/components/DashboardChart';
import { LoadingCard } from '@/components/LoadingCard';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import { useDailySales } from '@/hooks/useDailySales';
import { useTargets } from '@/hooks/useTargets';
import { useChannels } from '@/hooks/useChannels';
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
  WifiOff
} from 'lucide-react';

type PeriodFilter = 'hoje' | '7dias' | 'mes' | 'customizado';

const Index = () => {
  const [loading, setLoading] = useState(false);
  const { isConnected, lastUpdate } = useRealTimeUpdates();
  const { channels } = useChannels();
  const { getSalesForDate, getSaleAmount } = useDailySales();
  const { getTargetsForMonth } = useTargets();
  
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
  
  const gapValue = totalSalesMonth - totalTargetMonth;
  const gapPercent = totalTargetMonth > 0 ? (gapValue / totalTargetMonth) * 100 : 0;
  
  const daysInMonth = getDaysInMonth(currentDate);
  const remainingDays = Math.max(0, daysInMonth - currentDate.getDate() + 1);
  const originalDailyTarget = totalTargetMonth / daysInMonth;
  const adjustedDailyTarget = remainingDays > 0 ? Math.max(0, -gapValue) / remainingDays : 0;

  // Função para obter ícone do canal
  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'Marketplace': return ShoppingBag;
      case 'E-commerce': return BarChart3;
      case 'Landing Page': return Target;
      default: return ShoppingBag;
    }
  };

  // Calcular dados dos canais baseado no período selecionado
  const getChannelData = () => {
    return channels.filter(c => c.is_active).map(channel => {
      let channelSales = 0;
      let channelTarget = 0;
      
      if (periodFilter === 'mes') {
        // Vendas do mês
        for (let d = new Date(startMonth); d <= endMonth; d.setDate(d.getDate() + 1)) {
          const dateStr = format(d, 'yyyy-MM-dd');
          channelSales += getSaleAmount(channel.id, dateStr);
        }
        // Meta do mês
        const target = currentMonthTargets.find(t => t.channel_id === channel.id);
        channelTarget = target?.target_amount || 0;
      } else if (periodFilter === 'hoje') {
        const today = format(currentDate, 'yyyy-MM-dd');
        channelSales = getSaleAmount(channel.id, today);
        channelTarget = originalDailyTarget; // Usar meta diária
      } else if (periodFilter === '7dias') {
        // Últimos 7 dias
        for (let i = 0; i < 7; i++) {
          const date = subDays(currentDate, i);
          const dateStr = format(date, 'yyyy-MM-dd');
          channelSales += getSaleAmount(channel.id, dateStr);
        }
        channelTarget = originalDailyTarget * 7; // Meta de 7 dias
      }
      
      const progress = channelTarget > 0 ? (channelSales / channelTarget) * 100 : 0;
      const channelGap = channelTarget > 0 ? ((channelSales - channelTarget) / channelTarget) * 100 : 0;
      
      return {
        ...channel,
        sales: channelSales,
        target: channelTarget,
        progress: Math.min(progress, 100),
        gap: channelGap
      };
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const metrics = [
    {
      title: 'Realizado Global',
      value: formatCurrency(totalSalesMonth),
      icon: DollarSign,
      color: 'text-primary'
    },
    {
      title: 'Meta Global',
      value: formatCurrency(totalTargetMonth),
      icon: Target,
      color: 'text-primary'
    },
    {
      title: 'GAP %',
      value: `${gapPercent >= 0 ? '+' : ''}${gapPercent.toFixed(1)}%`,
      icon: gapPercent >= 0 ? TrendingUp : TrendingDown,
      color: gapPercent >= 0 ? 'text-success' : 'text-destructive'
    },
    {
      title: 'GAP R$',
      value: formatCurrency(gapValue),
      icon: gapValue >= 0 ? TrendingUp : TrendingDown,
      color: gapValue >= 0 ? 'text-success' : 'text-destructive'
    },
    {
      title: 'Meta Diária Original',
      value: formatCurrency(originalDailyTarget),
      icon: Target,
      color: 'text-muted-foreground'
    },
    {
      title: 'Meta Diária Ajustada',
      value: formatCurrency(adjustedDailyTarget),
      icon: Target,
      color: 'text-warning'
    }
  ];

  const channelData = getChannelData();

  return (
    <div className="bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Dashboard de Vendas</h1>
            <p className="text-muted-foreground">
              Acompanhe o desempenho das suas vendas vs metas em tempo real
            </p>
          </div>
          
          {/* Status de Conexão */}
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-success" />
                <span className="text-success">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Offline</span>
              </>
            )}
            {lastUpdate && (
              <span className="text-muted-foreground">
                · Atualizado {format(lastUpdate, 'HH:mm', { locale: ptBR })}
              </span>
            )}
          </div>
        </div>

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
            return (
              <Card key={index} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <IconComponent className={`w-5 h-5 ${metric.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {metric.title}
                    </p>
                    <p className={`text-lg font-bold ${metric.color}`}>
                      {metric.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>
        )}

        {/* FILTROS */}
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <Tabs value={periodFilter} onValueChange={(value) => setPeriodFilter(value as PeriodFilter)}>
                <TabsList className="grid w-full grid-cols-4 md:w-auto">
                  <TabsTrigger value="hoje">Hoje</TabsTrigger>
                  <TabsTrigger value="7dias">Últimos 7 dias</TabsTrigger>
                  <TabsTrigger value="mes">Este mês</TabsTrigger>
                  <TabsTrigger value="customizado">Customizado</TabsTrigger>
                </TabsList>
              </Tabs>
              
              {periodFilter === 'customizado' && (
                <div className="flex gap-2 items-center">
                  <DatePicker
                    date={customStartDate}
                    onDateChange={setCustomStartDate}
                    placeholder="Data inicial"
                  />
                  <span className="text-muted-foreground">até</span>
                  <DatePicker
                    date={customEndDate}
                    onDateChange={setCustomEndDate}
                    placeholder="Data final"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* GRÁFICO */}
        <DashboardChart />

        {/* BOTTOM SECTION - Grid de Canais */}
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
                        <span className="text-muted-foreground">GAP</span>
                        <span className={`font-medium ${
                          channel.gap >= 0 ? 'text-success' : 'text-destructive'
                        }`}>
                          {channel.gap >= 0 ? '+' : ''}{channel.gap.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

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
  );
};

export default Index;
