import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PeriodRangePicker, type DateRange } from '@/components/PeriodRangePicker';
import { MetricsChart } from '@/components/ecommerce/MetricsChart';
import { MetricsSimple } from '@/components/ecommerce/MetricsSimple';
import { CouponsTable } from '@/components/ecommerce/CouponsTable';
import { BrazilRegionsChart } from '@/components/ecommerce/BrazilRegionsChart';
import { useShopifyMetrics } from '@/hooks/useShopifyMetrics';
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown,
  Users,
  CreditCard,
  XCircle,
  RefreshCw,
  Eye,
  BarChart3,
  MapPin,
  Tag
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Ecommerce: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const currentDate = new Date();
    return {
      from: startOfMonth(currentDate),
      to: endOfMonth(currentDate)
    };
  });

  const { 
    totalRevenue, 
    totalOrders, 
    averageTicket, 
    cancellations, 
    sessions,
    loading, 
    coupons,
    refetch 
  } = useShopifyMetrics(dateRange.from, dateRange.to);

  const handleRefresh = () => {
    refetch();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Mock data para regiões (mantém mock por enquanto)
  const mockData = {
    regions: [
      { name: 'Sudeste', value: 125000, percentage: 50.8, color: '#3B82F6' },
      { name: 'Sul', value: 45000, percentage: 18.3, color: '#10B981' },
      { name: 'Nordeste', value: 38000, percentage: 15.4, color: '#F59E0B' },
      { name: 'Centro-Oeste', value: 25000, percentage: 10.2, color: '#EF4444' },
      { name: 'Norte', value: 12890, percentage: 5.3, color: '#8B5CF6' },
    ]
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">E-commerce Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Métricas e análises do seu e-commerce
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Badge variant="outline" className="text-xs">
            <Eye className="h-3 w-3 mr-1" />
            Período: {format(dateRange.from, 'dd/MM', { locale: ptBR })} - {format(dateRange.to, 'dd/MM', { locale: ptBR })}
          </Badge>
        </div>
      </div>

      {/* Filtro de Período */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <Tabs defaultValue="mes" className="w-auto">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="hoje">Hoje</TabsTrigger>
                  <TabsTrigger value="7dias">Últimos 7 dias</TabsTrigger>
                  <TabsTrigger value="mes">Este mês</TabsTrigger>
                  <TabsTrigger value="customizado">Customizado</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <PeriodRangePicker 
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                className="w-64"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards Principais - Estilo MetricsChart01 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MetricsChart
          title="Receita Total"
          value={formatCurrency(totalRevenue)}
          subtitle={`${totalOrders} vendas realizadas`}
          change="+12.5%" // TODO: Calcular comparação real
          trend="positive"
          icon={DollarSign}
        />
        
        <MetricsChart
          title="Ticket Médio"
          value={formatCurrency(averageTicket)}
          subtitle="Ticket médio por pedido"
          change="+8.2%" // TODO: Calcular comparação real
          trend="positive"
          icon={ShoppingCart}
        />
        
        <MetricsChart
          title="Cancelamentos"
          value={formatCurrency(cancellations)}
          subtitle="Pedidos cancelados"
          change="-3.1%" // TODO: Calcular comparação real
          trend="negative"
          icon={XCircle}
        />
      </div>

      {/* Cards Secundários - Estilo MetricsSimple */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsSimple
          title="Sessões"
          value={sessions.toLocaleString('pt-BR')}
          subtitle="Sessões únicas"
          change="+15.3%"
          trend="positive"
          type="modern"
          icon={Users}
          footer={
            <Button color="link-color" size="sm">
              Ver detalhes
            </Button>
          }
        />
        
        <MetricsSimple
          title="Taxa de Conversão"
          value="2.73%" // TODO: Integrar dados reais
          subtitle="Taxa de conversão"
          change="+0.4%"
          trend="positive"
          type="modern"
          icon={BarChart3}
          footer={
            <Button color="link-color" size="sm">
              Ver relatório
            </Button>
          }
        />
        
        <MetricsSimple
          title="Checkout"
          value="1.156" // TODO: Integrar dados reais
          subtitle="Iniciaram checkout"
          change="+22.1%"
          trend="positive"
          type="modern"
          icon={CreditCard}
          footer={
            <Button color="link-color" size="sm">
              Analisar funil
            </Button>
          }
        />
        
        <MetricsSimple
          title="Conversão Checkout"
          value="67.8%" // TODO: Integrar dados reais
          subtitle="Finalizaram compra"
          change="+5.2%"
          trend="positive"
          type="modern"
          icon={TrendingUp}
          footer={
            <Button color="link-color" size="sm">
              Otimizar
            </Button>
          }
        />
      </div>

      {/* Seção Inferior - Tabela e Gráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CouponsTable data={coupons} />
        <BrazilRegionsChart data={mockData.regions} />
      </div>

      {/* Resumo Executivo */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Resumo Executivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-lg bg-emerald-50/50 border border-emerald-200/50">
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(totalRevenue)}
              </div>
              <div className="text-sm text-emerald-700 font-medium">
                Receita Total
              </div>
              <div className="text-xs text-emerald-600 mt-1">
                {totalOrders} pedidos
              </div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-blue-50/50 border border-blue-200/50">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(averageTicket)}
              </div>
              <div className="text-sm text-blue-700 font-medium">
                Ticket Médio
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Por pedido
              </div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-purple-50/50 border border-purple-200/50">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(cancellations)}
              </div>
              <div className="text-sm text-purple-700 font-medium">
                Cancelamentos
              </div>
              <div className="text-xs text-purple-600 mt-1">
                Total cancelado
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Ecommerce;
