import { useState, useEffect } from 'react';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { fetchMonthlyDebugData, fetchDailyOrderDetails } from '@/services/shopifyOrdersService';

interface MonthlyDebugData {
  date: string;
  manual_value: number;
  automatic_value: number;
  orders_count: number;
  difference: number;
  difference_percent: number;
}

interface DailyOrderDetail {
  id: number;
  order_number: number;
  created_at_sp: string;
  total_price: number;
  status_debug: string;
  included_in_filter: boolean;
}

export default function ShopifyDebug() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState<MonthlyDebugData[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState('');
  const [dailyOrders, setDailyOrders] = useState<DailyOrderDetail[]>([]);
  const [dailyOrdersLoading, setDailyOrdersLoading] = useState(false);

  // Generate month options (current month + 5 previous months)
  const monthOptions = Array.from({ length: 6 }, (_, index) => {
    const date = subMonths(new Date(), index);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, "MMMM 'de' yyyy", { locale: ptBR }),
      year: date.getFullYear(),
      month: date.getMonth() + 1
    };
  });

  const loadMonthlyData = async (year: number, month: number) => {
    setLoading(true);
    try {
      const data = await fetchMonthlyDebugData(year, month);
      setMonthlyData(data);
    } catch (error) {
      console.error('Erro ao carregar dados mensais:', error);
      setMonthlyData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyOrders = async (date: string) => {
    setDailyOrdersLoading(true);
    try {
      const data = await fetchDailyOrderDetails(date);
      setDailyOrders(data);
    } catch (error) {
      console.error('Erro ao carregar pedidos do dia:', error);
      setDailyOrders([]);
    } finally {
      setDailyOrdersLoading(false);
    }
  };

  const handleInvestigateDay = async (date: string) => {
    setSelectedDayDate(date);
    setDialogOpen(true);
    await loadDailyOrders(date);
  };

  useEffect(() => {
    loadMonthlyData(selectedDate.getFullYear(), selectedDate.getMonth() + 1);
  }, [selectedDate]);

  // Calculate monthly totals
  const monthlyTotals = monthlyData.reduce(
    (acc, day) => ({
      manual: acc.manual + day.manual_value,
      automatic: acc.automatic + day.automatic_value,
      difference: acc.difference + day.difference
    }),
    { manual: 0, automatic: 0, difference: 0 }
  );

  const monthlyDifferencePercent = monthlyTotals.manual > 0 
    ? (monthlyTotals.difference / monthlyTotals.manual) * 100 
    : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getStatusBadge = (difference: number, percent: number) => {
    if (Math.abs(percent) <= 5) {
      return <Badge variant="secondary" className="gap-1"><Minus className="w-3 h-3" />OK</Badge>;
    }
    if (difference > 0) {
      return <Badge variant="default" className="gap-1"><TrendingUp className="w-3 h-3" />Maior</Badge>;
    }
    return <Badge variant="destructive" className="gap-1"><TrendingDown className="w-3 h-3" />Menor</Badge>;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Debug de Integração Shopify</h1>
        <p className="text-muted-foreground mt-2">
          Compare os dados manuais com os dados automáticos da integração Shopify
        </p>
      </div>

      {/* Month Selector */}
      <div className="mb-6">
        <Select 
          value={format(selectedDate, 'yyyy-MM')}
          onValueChange={(value) => {
            const [year, month] = value.split('-').map(Number);
            setSelectedDate(new Date(year, month - 1));
          }}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Selecione o mês" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Manual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyTotals.manual)}</div>
            <CardDescription>Dados inseridos manualmente</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Automático</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyTotals.automatic)}</div>
            <CardDescription>Dados da integração Shopify</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Diferença Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyTotals.difference)}</div>
            <CardDescription>Automático - Manual</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Variação (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(monthlyDifferencePercent)}</div>
            <CardDescription>Percentual da diferença</CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Daily Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação Diária</CardTitle>
          <CardDescription>
            Detalhamento dia a dia do mês selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Manual</TableHead>
                  <TableHead className="text-right">Automático</TableHead>
                  <TableHead className="text-right">Pedidos (auto)</TableHead>
                  <TableHead className="text-right">Diferença</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData.map((day) => (
                  <TableRow key={day.date}>
                    <TableCell className="font-medium">
                      {format(new Date(day.date), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(day.manual_value)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(day.automatic_value)}
                    </TableCell>
                    <TableCell className="text-right">
                      {day.orders_count}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(day.difference)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercent(day.difference_percent)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(day.difference, day.difference_percent)}
                    </TableCell>
                    <TableCell>
                      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleInvestigateDay(day.date)}
                          >
                            <Search className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Daily Orders Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes dos Pedidos</DialogTitle>
            <DialogDescription>
              Pedidos do dia {selectedDayDate ? format(new Date(selectedDayDate), 'dd/MM/yyyy') : ''}
            </DialogDescription>
          </DialogHeader>
          
          {dailyOrdersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Número do Pedido</TableHead>
                  <TableHead>Data/Hora (SP)</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Incluído</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyOrders.map((order) => (
                  <TableRow 
                    key={order.id} 
                    className={!order.included_in_filter ? 'bg-muted/50' : ''}
                  >
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.order_number}</TableCell>
                    <TableCell>{order.created_at_sp}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(order.total_price)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.status_debug === 'paid' ? 'default' : 'secondary'}>
                        {order.status_debug}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {order.included_in_filter ? (
                        <Badge variant="default">Sim</Badge>
                      ) : (
                        <Badge variant="destructive">Não</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}