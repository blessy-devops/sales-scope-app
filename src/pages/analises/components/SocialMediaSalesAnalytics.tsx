import * as React from "react";
import { format, subDays, differenceInDays, getDaysInMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";

type Metric = "total_price" | "subtotal_price";

interface TimeSeriesItem {
  sale_date: string; // 'YYYY-MM-DD'
  amount: number;
  sales_count?: number;
}

interface SalesResponse {
  dailySales: TimeSeriesItem[];
  salesGoal: number;
}

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0);
}

function formatRangeLabel(range: DateRange | undefined) {
  if (!range?.from || !range.to) return "Selecionar período";
  return `${format(range.from, "dd/MM/yyyy")} - ${format(range.to, "dd/MM/yyyy")}`;
}

const initialRange: DateRange = {
  from: subDays(new Date(), 29),
  to: new Date(),
};

export default function SocialMediaSalesAnalytics() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(initialRange);
  const [metric, setMetric] = React.useState<Metric>("total_price");

  const startDate =
    dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
  const endDate =
    dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["social-media-sales", startDate, endDate, metric],
    enabled: Boolean(startDate && endDate),
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-social-media-sales", {
        body: { startDate, endDate, metric },
      });
      if (error) throw error;
      return (data ?? { dailySales: [], salesGoal: 0 }) as SalesResponse;
    },
    refetchOnWindowFocus: true,
  });

  // Calculate KPIs
  const dailySales = data?.dailySales || [];
  const realizadoMTD = dailySales.reduce((sum, item) => sum + item.amount, 0);
  const metaPeriodo = data?.salesGoal || 0;
  const totalSales = dailySales.length;
  
  const diasPassados = dateRange?.from && dateRange?.to 
    ? differenceInDays(dateRange.to, dateRange.from) + 1 
    : 0;
  const totalDiasNoMes = dateRange?.from ? getDaysInMonth(dateRange.from) : 0;
  
  const mediaDiaria = diasPassados > 0 ? realizadoMTD / diasPassados : 0;
  const projetado = mediaDiaria * totalDiasNoMes;
  const percentualAtingimento = metaPeriodo > 0 ? (realizadoMTD / metaPeriodo) * 100 : 0;
  const saldo = metaPeriodo - realizadoMTD;

  // Calculate pacing for Badge color logic
  const diasPassadosAtual = differenceInDays(new Date(), dateRange?.from || new Date()) + 1;
  const totalDiasPeriodo = dateRange?.from && dateRange?.to 
    ? differenceInDays(dateRange.to, dateRange.from) + 1 
    : 0;
  const percentualDiasPassados = totalDiasPeriodo > 0 ? (diasPassadosAtual / totalDiasPeriodo) * 100 : 0;
  const badgeVariant = percentualAtingimento >= percentualDiasPassados ? "default" : "destructive";

  const chartData = dailySales.map((d) => ({
    date: d.sale_date,
    amount: Number(d.amount || 0),
  }));

  const chartConfig = {
    amount: {
      label: metric === "total_price" ? "Receita (Total)" : "Receita (Produtos)",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Receita de Vendas (Mídia Social)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* DateRangePicker */}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[280px] justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatRangeLabel(dateRange)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range) => setDateRange(range)}
                  numberOfMonths={2}
                  locale={ptBR}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
                <div className="flex justify-end gap-2 p-3 pt-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDateRange(initialRange)}
                  >
                    Últimos 30 dias
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Métrica */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Métrica:</span>
            <Select
              value={metric}
              onValueChange={(v) => setMetric(v as Metric)}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total_price">Total com frete (total_price)</SelectItem>
                <SelectItem value="subtotal_price">Somente produtos (subtotal_price)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Meta do Período</div>
              {isLoading ? (
                <Skeleton className="h-8 w-20 mt-2" />
              ) : (
                <div className="text-2xl font-bold mt-2">{formatBRL(metaPeriodo)}</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-muted-foreground font-normal">Realizado MTD</CardTitle>
                {!isLoading && (
                  <Badge variant={badgeVariant} className="text-xs">
                    {percentualAtingimento.toFixed(1)}%
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{formatBRL(realizadoMTD)}</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Saldo</div>
              {isLoading ? (
                <Skeleton className="h-8 w-20 mt-2" />
              ) : (
                <div className="text-2xl font-bold mt-2">{formatBRL(saldo)}</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Média Diária</div>
              {isLoading ? (
                <Skeleton className="h-8 w-20 mt-2" />
              ) : (
                <div className="text-2xl font-bold mt-2">{formatBRL(mediaDiaria)}</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Projetado</div>
              {isLoading ? (
                <Skeleton className="h-8 w-20 mt-2" />
              ) : (
                <div className="text-2xl font-bold mt-2">{formatBRL(projetado)}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total de Vendas</div>
              {isLoading ? (
                <Skeleton className="h-8 w-20 mt-2" />
              ) : (
                <div className="text-2xl font-bold mt-2">{totalSales}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gráfico */}
        {isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <p className="text-muted-foreground">Erro ao carregar dados</p>
            <Button onClick={() => refetch()} variant="outline">Tentar novamente</Button>
          </div>
        ) : isLoading ? (
          <Skeleton className="h-[320px] w-full" />
        ) : chartData.length === 0 ? (
          <div className="h-[320px] flex items-center justify-center text-muted-foreground">
            Sem dados para este período
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const d = new Date(value);
                    return d.getDate().toString().padStart(2, "0");
                  }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(v) =>
                    new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(Number(v))
                  }
                />
                <Tooltip
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  }
                  formatter={(value: number) => [formatBRL(value), "Receita"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Bar
                  dataKey="amount"
                  name={chartConfig.amount.label}
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </ReBarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}