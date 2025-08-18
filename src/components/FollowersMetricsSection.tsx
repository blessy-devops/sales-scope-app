import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Target, TrendingUp, Users, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ChartContainer } from "@/components/ui/chart";

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

  const formatNumber = (num: number) => num.toLocaleString('pt-BR');
  const attainmentPercentage = data?.goal ? Math.round((data.current_growth / data.goal) * 100) : 0;

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
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            📊 Performance de Seguidores
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
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          📊 Performance de Seguidores
        </h2>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Meta do Mês */}
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

        {/* Card 2: Realizado no Mês */}
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
                <div className="text-2xl font-bold">{attainmentPercentage}%</div>
                {data?.goal && (
                  <Progress value={Math.min(attainmentPercentage, 100)} className="h-2" />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Card 4: Ritmo Diário (Gráfico) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ritmo Diário</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : data?.daily_series && data.daily_series.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-20 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.daily_series}>
                    <Line
                      type="monotone"
                      dataKey="followers_count"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-20 flex items-center justify-center text-sm text-muted-foreground">
                Sem dados para este mês
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}