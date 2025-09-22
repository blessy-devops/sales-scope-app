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

  const [loading, setLoading] = useState(false);

  // Mock data - em produção, isso viria de APIs
  const mockData = {
    revenue: {
      value: 'R$ 245.890,50',
      subtitle: '1.247 vendas realizadas',
      change: '+12.5%',
      trend: 'positive' as const,
      chartData: [
        { date: '01/09', value: 12000 },
        { date: '02/09', value: 15000 },
        { date: '03/09', value: 18000 },
        { date: '04/09', value: 22000 },
        { date: '05/09', value: 19000 },
        { date: '06/09', value: 25000 },
        { date: '07/09', value: 28000 },
      ]
    },
    averageTicket: {
      value: 'R$ 197,20',
      subtitle: 'Ticket médio por pedido',
      change: '+8.2%',
      trend: 'positive' as const,
    },
    cancellations: {
      value: 'R$ 12.450,30',
      subtitle: '47 cancelamentos',
      change: '-3.1%',
      trend: 'negative' as const,
    },
    sessions: {
      value: '45.678',
      subtitle: 'Sessões únicas',
      change: '+15.3%',
      trend: 'positive' as const,
    },
    conversionRate: {
      value: '2.73%',
      subtitle: 'Taxa de conversão',
      change: '+0.4%',
      trend: 'positive' as const,
    },
    checkout: {
      value: '1.156',
      subtitle: 'Iniciaram checkout',
      change: '+22.1%',
      trend: 'positive' as const,
    },
    checkoutConversion: {
      value: '67.8%',
      subtitle: 'Finalizaram compra',
      change: '+5.2%',
      trend: 'positive' as const,
    },
    coupons: [
      {
        id: '1',
        code: 'BLACKFRIDAY20',
        name: 'Black Friday 20%',
        value: 20,
        uses: 156,
        revenue: 31200,
        type: 'percentage' as const,
        status: 'active' as const,
      },
      {
        id: '2',
        code: 'FRETE10',
        name: 'Frete Grátis',
        value: 10,
        uses: 89,
        revenue: 890,
        type: 'fixed' as const,
        status: 'active' as const,
      },
      {
        id: '3',
        code: 'PRIMEIRA15',
        name: 'Primeira Compra 15%',
        value: 15,
        uses: 67,
        revenue: 10050,
        type: 'percentage' as const,
        status: 'active' as const,
      },
      {
        id: '4',
        code: 'VOLTA20',
        name: 'Volta às Aulas',
        value: 20,
        uses: 45,
        revenue: 9000,
        type: 'percentage' as const,
        status: 'inactive' as const,
      },
      {
        id: '5',
        code: 'DESCONTO50',
        name: 'Desconto R$ 50',
        value: 50,
        uses: 23,
        revenue: 1150,
        type: 'fixed' as const,
        status: 'expired' as const,
      },
    ],
    regions: [
      { name: 'Sudeste', value: 125000, percentage: 50.8, color: '#3B82F6' },
      { name: 'Sul', value: 45000, percentage: 18.3, color: '#10B981' },
      { name: 'Nordeste', value: 38000, percentage: 15.4, color: '#F59E0B' },
      { name: 'Centro-Oeste', value: 25000, percentage: 10.2, color: '#EF4444' },
      { name: 'Norte', value: 12890, percentage: 5.3, color: '#8B5CF6' },
    ]
  };

  const handleRefresh = () => {
    setLoading(true);
    // Simular carregamento
    setTimeout(() => {
      setLoading(false);
    }, 1000);
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
          value={mockData.revenue.value}
          subtitle={mockData.revenue.subtitle}
          change={mockData.revenue.change}
          trend={mockData.revenue.trend}
          icon={DollarSign}
          chartData={mockData.revenue.chartData}
        />
        
        <MetricsChart
          title="Ticket Médio"
          value={mockData.averageTicket.value}
          subtitle={mockData.averageTicket.subtitle}
          change={mockData.averageTicket.change}
          trend={mockData.averageTicket.trend}
          icon={ShoppingCart}
        />
        
        <MetricsChart
          title="Cancelamentos"
          value={mockData.cancellations.value}
          subtitle={mockData.cancellations.subtitle}
          change={mockData.cancellations.change}
          trend={mockData.cancellations.trend}
          icon={XCircle}
        />
      </div>

      {/* Cards Secundários - Estilo MetricsSimple */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsSimple
          title="Sessões"
          value={mockData.sessions.value}
          subtitle={mockData.sessions.subtitle}
          change={mockData.sessions.change}
          trend={mockData.sessions.trend}
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
          value={mockData.conversionRate.value}
          subtitle={mockData.conversionRate.subtitle}
          change={mockData.conversionRate.change}
          trend={mockData.conversionRate.trend}
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
          value={mockData.checkout.value}
          subtitle={mockData.checkout.subtitle}
          change={mockData.checkout.change}
          trend={mockData.checkout.trend}
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
          value={mockData.checkoutConversion.value}
          subtitle={mockData.checkoutConversion.subtitle}
          change={mockData.checkoutConversion.change}
          trend={mockData.checkoutConversion.trend}
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
        <CouponsTable data={mockData.coupons} />
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
                {mockData.revenue.value}
              </div>
              <div className="text-sm text-emerald-700 font-medium">
                Receita Total
              </div>
              <div className="text-xs text-emerald-600 mt-1">
                +12.5% vs período anterior
              </div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-blue-50/50 border border-blue-200/50">
              <div className="text-2xl font-bold text-blue-600">
                {mockData.conversionRate.value}
              </div>
              <div className="text-sm text-blue-700 font-medium">
                Taxa de Conversão
              </div>
              <div className="text-xs text-blue-600 mt-1">
                +0.4% vs período anterior
              </div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-purple-50/50 border border-purple-200/50">
              <div className="text-2xl font-bold text-purple-600">
                {mockData.sessions.value}
              </div>
              <div className="text-sm text-purple-700 font-medium">
                Sessões Únicas
              </div>
              <div className="text-xs text-purple-600 mt-1">
                +15.3% vs período anterior
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Ecommerce;
