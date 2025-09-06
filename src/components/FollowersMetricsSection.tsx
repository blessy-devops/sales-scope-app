import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RefreshCw, Target, TrendingUp, Users, BarChart3, Minus, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { PeriodRangePicker } from "@/components/PeriodRangePicker";
import { startOfMonth, endOfMonth, subDays, subMonths, differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DateRange {
  from: Date;
  to: Date;
}

interface FollowersAnalytics {
  goal: number;
  startCount: number;
  endCount: number;
  dailySeries: Array<{ date: string; followers_count: number }>;
}

interface FollowersMetricsSectionProps {
  onOpenGoals?: () => void;
}

export function FollowersMetricsSection({ onOpenGoals }: FollowersMetricsSectionProps) {
  const [periodoSeguidores, setPeriodoSeguidores] = useState("este-mes");
  const [dateRangeSeguidores, setDateRangeSeguidores] = useState<DateRange>(() => ({
    from: startOfMonth(new Date()),
    to: new Date()
  }));

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['followers-analytics', dateRangeSeguidores.from, dateRangeSeguidores.to],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('analytics-social-media/followers', {
        body: { 
          startDate: format(dateRangeSeguidores.from, 'yyyy-MM-dd'),
          endDate: format(dateRangeSeguidores.to, 'yyyy-MM-dd')
        }
      });
      
      if (error) throw error;
      return data as FollowersAnalytics;
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  const handlePeriodChange = (value: string) => {
    setPeriodoSeguidores(value);
    const today = new Date();
    
    switch (value) {
      case "este-mes":
        setDateRangeSeguidores({ from: startOfMonth(today), to: today });
        break;
      case "mes-passado":
        const lastMonth = subMonths(today, 1);
        setDateRangeSeguidores({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        break;
      case "ultimos-7-dias":
        setDateRangeSeguidores({ from: subDays(today, 6), to: today });
        break;
    }
  };

  const handleDateRangeChange = (range: DateRange) => {
    setDateRangeSeguidores(range);
    setPeriodoSeguidores("customizado");
  };

  // Helper functions for calculations
  const buildFollowersDailyGrowth = (dailySeries: Array<{ date: string; followers_count: number }>) => {
    if (!dailySeries || dailySeries.length === 0) return [];
    
    const sortedData = [...dailySeries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sortedData.map((item, index) => {
      const dailyGrowth = index === 0 ? 0 : item.followers_count - sortedData[index - 1].followers_count;
      const totalDays = differenceInDays(dateRangeSeguidores.to, dateRangeSeguidores.from) + 1;
      return {
        date: item.date,
        realizado: Math.max(0, dailyGrowth),
        meta: data?.goal ? Math.round(data.goal / totalDays) : 0
      };
    });
  };

  const formatNumber = (num: number) => num.toLocaleString('pt-BR');
  const formatPercentage = (value: number) => {
    if (value > 0 && value < 1) {
      return value.toFixed(1) + '%';
    }
    return Math.round(value) + '%';
  };

  // Calculate metrics using new data structure
  const currentGrowth = data ? data.endCount - data.startCount : 0;
  const attainmentPercentage = data?.goal ? (currentGrowth / data.goal) * 100 : 0;
  
  const diasPassados = differenceInDays(dateRangeSeguidores.to, dateRangeSeguidores.from) + 1;
  const totalDays = diasPassados; // For the current period
  const saldo = data?.goal ? Math.max(0, data.goal - currentGrowth) : 0;
  const ritmo = diasPassados > 0 && currentGrowth ? currentGrowth / diasPassados : 0;
  const projetado = ritmo * totalDays;

  // Prepare chart data
  const chartData = data ? buildFollowersDailyGrowth(data.dailySeries) : [];

  const chartConfig = {
    followers_count: {
      label: "Seguidores",
      color: "hsl(var(--primary))",
    },
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Performance de Seguidores
          </h2>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Erro ao carregar dados de seguidores</p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Performance de Seguidores
        </h2>
      </div>

      <Tabs value={periodoSeguidores} onValueChange={handlePeriodChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="este-mes">Este Mês</TabsTrigger>
          <TabsTrigger value="mes-passado">Mês Passado</TabsTrigger>
          <TabsTrigger value="ultimos-7-dias">Últimos 7 dias</TabsTrigger>
          <TabsTrigger value="customizado">Customizado</TabsTrigger>
        </TabsList>
        
        <TabsContent value="customizado" className="mt-4">
          <PeriodRangePicker
            dateRange={dateRangeSeguidores}
            onDateRangeChange={handleDateRangeChange}
            className="w-[280px]"
          />
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Meta de Seguidores */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta de Seguidores</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : data?.goal ? (
              <div className="text-2xl font-bold">{formatNumber(data.goal)}</div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Nenhuma meta definida</p>
                <Button size="sm" variant="outline" onClick={onOpenGoals}>
                  Definir Meta
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Crescimento Realizado */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento Realizado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div className="text-2xl font-bold">
                {formatNumber(currentGrowth)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 3: % de Atingimento */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">% de Atingimento</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatPercentage(attainmentPercentage)}</div>
                {data?.goal && (
                  <Progress value={Math.min(attainmentPercentage, 100)} className="h-2" />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Card 4: Saldo */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <Minus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div className="text-2xl font-bold">
                {formatNumber(saldo)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 5: Ritmo */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ritmo</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div className="text-2xl font-bold">
                {formatNumber(Math.round(ritmo))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 6: Projetado */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div className="text-2xl font-bold">
                {formatNumber(Math.round(projetado))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full-width Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Performance Diária de Seguidores</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).getDate().toString()}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    formatter={(value: number, name: string) => [
                      formatNumber(value),
                      name === 'realizado' ? 'Crescimento Realizado' : 'Meta Diária'
                    ]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="meta"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="meta"
                  />
                  <Line
                    type="monotone"
                    dataKey="realizado"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    name="realizado"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Sem dados para este mês
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}