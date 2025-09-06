import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodRangePicker } from "@/components/PeriodRangePicker";
import { AttendantSettingsModal } from "./components/AttendantSettingsModal";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface AttendantKPIs {
  totalRevenue: number;
  totalSales: number;
  averageTicket: number;
}

interface DailySeries {
  date: string;
  revenue: number;
}

interface AttendantRanking {
  name: string;
  revenue: number;
  sales: number;
}

interface RecentSale {
  date: string;
  attendantName: string;
  orderNumber: number;
  value: number;
}

interface AttendantAnalyticsResponse {
  kpis: AttendantKPIs;
  dailySeries: DailySeries[];
  attendantRanking: AttendantRanking[];
  recentSales: RecentSale[];
}

export default function AnaliseAtendimento() {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['attendant-analytics', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-attendant-sales-analytics', {
        body: {
          startDate: format(dateRange.from, 'yyyy-MM-dd'),
          endDate: format(dateRange.to, 'yyyy-MM-dd')
        }
      });
      
      if (error) throw error;
      return data as AttendantAnalyticsResponse;
    },
    enabled: !!dateRange.from && !!dateRange.to
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Análise de Atendimento</h1>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsSettingsModalOpen(true)}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <PeriodRangePicker
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                R$ {analyticsData?.kpis.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {analyticsData?.kpis.totalSales || 0}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                R$ {analyticsData?.kpis.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts and Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Receita por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Gráfico de receita (em desenvolvimento)
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendant Ranking */}
        <Card>
          <CardHeader>
            <CardTitle>Ranking de Atendentes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {analyticsData?.attendantRanking.slice(0, 5).map((attendant, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-medium">{attendant.name}</span>
                    </div>
                    <span className="text-sm font-bold">
                      R$ {attendant.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )) || (
                  <div className="text-sm text-muted-foreground">
                    Nenhum dado encontrado
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vendas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Data</th>
                    <th className="text-left py-2">Atendente</th>
                    <th className="text-left py-2">Pedido</th>
                    <th className="text-right py-2">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData?.recentSales.slice(0, 10).map((sale, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 text-sm">{sale.date}</td>
                      <td className="py-2 text-sm">{sale.attendantName}</td>
                      <td className="py-2 text-sm">#{sale.orderNumber}</td>
                      <td className="py-2 text-sm text-right font-medium">
                        R$ {sale.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-sm text-muted-foreground">
                        Nenhuma venda encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AttendantSettingsModal
        open={isSettingsModalOpen}
        onOpenChange={setIsSettingsModalOpen}
      />
    </div>
  );
}