import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PeriodRangePicker } from '@/components/PeriodRangePicker';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SubChannelAnalytics {
  name: string;
  meta: number;
  realized: number;
  attainment: number;
  orderCount: number;
  channelName: string;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

const SubChannelAnalysis = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      from: firstDay,
      to: now
    };
  });

  const fetchSubChannelAnalytics = async (startDate: string, endDate: string): Promise<SubChannelAnalytics[]> => {
    const { data, error } = await supabase.functions.invoke('get-subchannel-analytics', {
      body: { startDate, endDate }
    });

    if (error) {
      console.error('Error fetching sub-channel analytics:', error);
      throw error;
    }

    return data || [];
  };

  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['subchannel-analytics', dateRange.from, dateRange.to],
    queryFn: () => {
      if (!dateRange.from || !dateRange.to) return Promise.resolve([]);
      return fetchSubChannelAnalytics(
        dateRange.from.toISOString(),
        dateRange.to.toISOString()
      );
    },
    enabled: !!dateRange.from && !!dateRange.to
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getAttainmentBadge = (attainment: number) => {
    if (attainment >= 100) {
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        {attainment.toFixed(1)}%
      </Badge>;
    } else if (attainment >= 80) {
      return <Badge variant="outline" className="border-yellow-300 text-yellow-700 dark:border-yellow-600 dark:text-yellow-400">
        {attainment.toFixed(1)}%
      </Badge>;
    } else {
      return <Badge variant="destructive" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        {attainment.toFixed(1)}%
      </Badge>;
    }
  };

  const totalMeta = analyticsData?.reduce((sum, item) => sum + item.meta, 0) || 0;
  const totalRealized = analyticsData?.reduce((sum, item) => sum + item.realized, 0) || 0;
  const totalOrders = analyticsData?.reduce((sum, item) => sum + item.orderCount, 0) || 0;
  const overallAttainment = totalMeta > 0 ? (totalRealized / totalMeta) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/analises')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Análise por Sub-canal
          </h1>
          <p className="text-muted-foreground">
            Performance individual de cada sub-canal contra suas metas
          </p>
        </div>
      </div>

      {/* Date Range Picker */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtro de Período</CardTitle>
          <CardDescription>
            Selecione o período para análise das performances dos sub-canais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PeriodRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {analyticsData && analyticsData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meta Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalMeta)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Realizado Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRealized)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atingimento Geral</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallAttainment.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Sub-canal</CardTitle>
          <CardDescription>
            {dateRange.from && dateRange.to && (
              <>Período: {format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} - {format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-destructive">
              Erro ao carregar dados: {error.message}
            </div>
          )}

          {analyticsData && analyticsData.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum sub-canal encontrado para o período selecionado.
            </div>
          )}

          {analyticsData && analyticsData.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sub-canal</TableHead>
                  <TableHead>Canal Pai</TableHead>
                  <TableHead className="text-right">Meta</TableHead>
                  <TableHead className="text-right">Realizado</TableHead>
                  <TableHead className="text-center">% Atingimento</TableHead>
                  <TableHead className="text-right">Nº de Vendas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyticsData.map((item, index) => (
                  <TableRow key={`${item.name}-${index}`}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.channelName}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.meta)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.realized)}</TableCell>
                    <TableCell className="text-center">{getAttainmentBadge(item.attainment)}</TableCell>
                    <TableCell className="text-right">{item.orderCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubChannelAnalysis;