import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Target, TrendingUp, Users, BarChart3, Minus, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { getDaysInMonth } from 'date-fns';

interface FollowersAnalytics {
  goal: number;
  current_growth: number;
  start_of_month_count: number;
  latest_count: number;
  daily_series: Array<{ date: string; followers_count: number }>;
}

interface FollowersMetricsSectionProps {
  selectedDate: Date;
  onOpenGoals?: () => void;
}

export function FollowersMetricsSection({ selectedDate, onOpenGoals }: FollowersMetricsSectionProps) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['followers-analytics', year, month],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('analytics-social-media/followers', {
        body: { year, month }
      });
      
      if (error) throw error;
      return data as FollowersAnalytics;
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Helper functions for calculations
  const getMonthContext = (selectedDate: Date) => {
    const today = new Date();
    const isCurrentMonth = selectedDate.getFullYear() === today.getFullYear() && 
                          selectedDate.getMonth() === today.getMonth();
    const totalDaysInMonth = getDaysInMonth(selectedDate);
    const diasPassados = isCurrentMonth ? today.getDate() : totalDaysInMonth;
    return { isCurrentMonth, totalDaysInMonth, diasPassados };
  };

  const buildFollowersDailyGrowth = (dailySeries: Array<{ date: string; followers_count: number }>) => {
    if (!dailySeries || dailySeries.length === 0) return [];
    
    const sortedData = [...dailySeries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sortedData.map((item, index) => {
      const dailyGrowth = index === 0 ? 0 : item.followers_count - sortedData[index - 1].followers_count;
      return {
        date: item.date,
        realizado: Math.max(0, dailyGrowth),
        meta: data?.goal ? Math.round(data.goal / getMonthContext(selectedDate).totalDaysInMonth) : 0
      };
    });
  };

  const formatNumber = (num: number) => num.toLocaleString('pt-BR');
  const attainmentPercentage = data?.goal ? (data.current_growth / data.goal) * 100 : 0;
  const formatPercentage = (value: number) => {
    if (value > 0 && value < 1) {
      return value.toFixed(1) + '%';
    }
    return Math.round(value) + '%';
  };

  // Calculate additional metrics
  const { diasPassados, totalDaysInMonth } = getMonthContext(selectedDate);
  const saldo = data?.goal ? Math.max(0, data.goal - data.current_growth) : 0;
  const ritmo = diasPassados > 0 && data?.current_growth ? data.current_growth / diasPassados : 0;
  const projetado = ritmo * totalDaysInMonth;

  // Prepare chart data
  const chartData = data ? buildFollowersDailyGrowth(data.daily_series) : [];

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
                {formatNumber(data?.current_growth || 0)}
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