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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function DashboardChart() {
  const { getSalesForDate, getSaleAmount } = useDailySales();
  const { getTargetsForMonth } = useTargets();
  const { channels } = useChannels();
  const { getPreference, setPreference } = useUserPreferences();
  
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
    
    // Buscar metas do mês
    const monthlyTargets = getTargetsForMonth(currentMonth, currentYear);
    const totalMonthlyTarget = monthlyTargets.reduce((sum, target) => sum + target.target_amount, 0);
    
    // Calcular meta diária baseada nos dias do mês
    const startMonth = startOfMonth(currentDate);
    const endMonth = endOfMonth(currentDate);
    const daysInMonth = endMonth.getDate();
    const dailyTarget = totalMonthlyTarget / daysInMonth;
    
    // Sempre mostrar dados do mês atual
    const daysToShow = Math.min(currentDate.getDate(), 30);
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = subDays(currentDate, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Somar vendas de todos os canais ativos para o dia
      const totalDaySales = channels
        .filter(c => c.is_active)
        .reduce((sum, channel) => sum + getSaleAmount(channel.id, dateStr), 0);
      
      data.push({
        date: format(date, 'dd/MM', { locale: ptBR }),
        realizado: totalDaySales,
        meta: dailyTarget,
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
              <CardTitle className="text-lg">Vendas vs Meta (Este mês)</CardTitle>
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
                    formatter={(value: number, name: string) => [
                      `R$ ${value.toLocaleString('pt-BR')}`,
                      name === 'realizado' ? 'Realizado' : 'Meta Diária'
                    ]}
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
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}