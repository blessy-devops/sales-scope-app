import * as React from "react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
      return (data ?? []) as TimeSeriesItem[];
    },
    refetchOnWindowFocus: true,
  });

  const chartData = (data ?? []).map((d) => ({
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