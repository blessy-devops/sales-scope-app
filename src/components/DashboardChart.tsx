import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useDailySales } from '@/hooks/useDailySales';
import { useTargets } from '@/hooks/useTargets';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useChannels } from '@/hooks/useChannels';
import { useDataReferencia } from '@/hooks/useDataReferencia';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DashboardChartProps {
  viewFilter?: string;
  selectedChannel?: { id: string; name: string } | null;
}

export function DashboardChart({ viewFilter = 'global', selectedChannel }: DashboardChartProps) {
  const { getSalesForDate, getSaleAmount } = useDailySales();
  const { getTargetsForMonth } = useTargets();
  const { channels } = useChannels();
  const { getPreference, setPreference } = useUserPreferences();
  const { dataReferencia, diasPassados, totalDiasDoMes, mode } = useDataReferencia();
  
  const isCollapsed = getPreference('dashboard_chart_collapsed', false);

  const handleToggleCollapse = () => {
    setPreference('dashboard_chart_collapsed', !isCollapsed);
  };

  // Gerar dados reais do gráfico
  const generateChartData = () => {
    const data = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    // Buscar metas do mês filtradas por canal
    const monthlyTargets = getTargetsForMonth(currentMonth, currentYear);
    const filteredTargets = viewFilter === 'global' 
      ? monthlyTargets 
      : monthlyTargets.filter(t => t.channel_id === viewFilter);
    
    const totalMonthlyTarget = filteredTargets.reduce((sum, target) => sum + target.target_amount, 0);
    
    // Calcular meta diária baseada nos dias do mês usando data de referência
    const startMonth = startOfMonth(currentDate);
    const dailyTarget = totalMonthlyTarget / totalDiasDoMes;
    
    // Calcular ritmo atual (vendas acumuladas até data de referência / dias passados)
    let totalSalesUntilToday = 0;
    
    for (let i = 1; i <= diasPassados; i++) {
      const pastDate = new Date(currentYear, currentMonth - 1, i);
      const dateStr = format(pastDate, 'yyyy-MM-dd');
      
      if (viewFilter === 'global') {
        totalSalesUntilToday += channels
          .filter(c => c.is_active)
          .reduce((sum, channel) => sum + getSaleAmount(channel.id, dateStr), 0);
      } else {
        totalSalesUntilToday += getSaleAmount(viewFilter, dateStr);
      }
    }
    
    const currentPace = diasPassados > 0 ? totalSalesUntilToday / diasPassados : 0;
    
    // Mostrar dados até a data de referência
    const daysToShow = Math.min(diasPassados, 30);
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = subDays(dataReferencia, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Calcular vendas conforme filtro de visão
      let totalDaySales = 0;
      if (viewFilter === 'global') {
        totalDaySales = channels
          .filter(c => c.is_active)
          .reduce((sum, channel) => sum + getSaleAmount(channel.id, dateStr), 0);
      } else {
        totalDaySales = getSaleAmount(viewFilter, dateStr);
      }
      
      data.push({
        date: format(date, 'dd/MM', { locale: ptBR }),
        realizado: totalDaySales,
        meta: dailyTarget,
        projetado: currentPace, // Linha constante do ritmo atual
      });
    }
    
    return data;
  };

  const chartData = generateChartData();

  return (
    <Collapsible open={!isCollapsed} onOpenChange={() => handleToggleCollapse()}>
      <Card className="border-border/50">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <CardTitle className="text-lg">Vendas vs Meta (Este mês)</CardTitle>
                {selectedChannel && (
                  <span className="text-sm text-muted-foreground mt-1">
                    Canal: {selectedChannel.name}
                  </span>
                )}
              </div>
              <Button variant="ghost" size="sm">
                {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-4 pt-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-muted-foreground"
                    fontSize={12}
                  />
                  <YAxis 
                    className="text-muted-foreground"
                    fontSize={12}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number, name: string) => {
                      const labelMap: Record<string, string> = {
                        'realizado': 'Realizado',
                        'meta': 'Meta Diária',
                        'projetado': 'Projetado (Ritmo)'
                      };
                      return [
                        `R$ ${value.toLocaleString('pt-BR')}`,
                        labelMap[name] || name
                      ];
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="realizado" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="meta" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="projetado" 
                    stroke="hsl(var(--warning))" 
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}