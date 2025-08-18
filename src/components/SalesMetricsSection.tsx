import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Target, DollarSign, BarChart3, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ChartContainer } from "@/components/ui/chart";

interface SalesAnalytics {
  goal: number;
  current_sales_total: number;
  daily_series: Array<{ date: string; total: number }>;
  metric_used?: 'subtotal_price' | 'total_price';
}

interface SalesMetricsSectionProps {
  selectedDate: Date;
  onOpenGoals?: () => void;
}

export function SalesMetricsSection({ selectedDate, onOpenGoals }: SalesMetricsSectionProps) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sales-analytics', year, month],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('analytics-social-media/sales', {
        body: { year, month }
      });
      
      if (error) throw error;
      return data as SalesAnalytics;
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const attainmentPercentage = data?.goal ? (data.current_sales_total / data.goal) * 100 : 0;
  const formatPercentage = (value: number) => {
    if (value > 0 && value < 1) {
      return value.toFixed(1) + '%';
    }
    return Math.round(value) + '%';
  };

  const chartConfig = {
    total: {
      label: "Vendas",
      color: "hsl(var(--primary))",
    },
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            💰 Performance de Vendas (Social Media)
          </h2>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Erro ao carregar dados de vendas</p>
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
          <DollarSign className="h-6 w-6" />
          💰 Performance de Vendas (Social Media)
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Meta de Vendas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta de Vendas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : data?.goal ? (
              <div className="text-2xl font-bold">{formatCurrency(data.goal)}</div>
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

        {/* Card 2: Vendas Realizadas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {data?.metric_used === 'total_price' 
                ? 'Vendas Realizadas (Total com Frete)' 
                : 'Vendas Realizadas (Produtos)'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(data?.current_sales_total || 0)}
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

        {/* Card 4: Vendas Diárias (Gráfico) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {data?.metric_used === 'total_price' 
                ? 'Vendas Diárias (Total com Frete)' 
                : 'Vendas Diárias (Produtos)'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : data?.daily_series && data.daily_series.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-20 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.daily_series}>
                    <Bar
                      dataKey="total"
                      fill="hsl(var(--primary))"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
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