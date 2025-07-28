import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useChannels } from '@/hooks/useChannels';
import { useDailySales } from '@/hooks/useDailySales';
import { useTargets } from '@/hooks/useTargets';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, subDays, startOfMonth, endOfMonth, isWeekend, differenceInDays, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeft,
  Calendar as CalendarIcon,
  Download,
  Filter,
  Trophy,
  TrendingUp,
  TrendingDown,
  StickyNote,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Medal,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface DailyObservation {
  id: string;
  channel_id: string;
  date: string;
  observation: string;
  created_by: string;
}

interface ChannelPerformance {
  date: Date;
  dayOfWeek: string;
  formattedDate: string;
  target: number;
  sales: number;
  percentage: number;
  gap: number;
  accumulatedAverage: number;
  accumulatedPercentage: number;
  ranking: number;
  variation: number;
  variationPercent: number;
  observation?: string;
}

interface SelectedMetrics {
  target: boolean;
  sales: boolean;
  percentage: boolean;
  gap: boolean;
}

const PerformanceDiaria = () => {
  const navigate = useNavigate();
  const { channels } = useChannels();
  const { getSalesForDate, getSaleAmount } = useDailySales();
  const { getTargetsForMonth } = useTargets();

  // Estados principais
  const [dateRange, setDateRange] = useState<{from?: Date; to?: Date}>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<SelectedMetrics>({
    target: true,
    sales: true,
    percentage: true,
    gap: true
  });
  const [viewMode, setViewMode] = useState<'single' | 'multiple'>('single');
  const [observations, setObservations] = useState<DailyObservation[]>([]);
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [editingObservation, setEditingObservation] = useState<{
    channelId: string;
    date: string;
    current?: string;
  } | null>(null);
  const [newObservation, setNewObservation] = useState('');
  const [showTable, setShowTable] = useState(false);

  // Carrega observações
  useEffect(() => {
    loadObservations();
  }, [dateRange]);

  const loadObservations = async () => {
    if (!dateRange.from || !dateRange.to) return;

    try {
      const { data, error } = await supabase
        .from('daily_observations')
        .select('*')
        .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.to, 'yyyy-MM-dd'));

      if (error) throw error;
      setObservations(data || []);
    } catch (error) {
      console.error('Erro ao carregar observações:', error);
    }
  };

  // Função para calcular performance diária
  const calculateDailyPerformance = (channelId: string): ChannelPerformance[] => {
    if (!dateRange.from || !dateRange.to) return [];

    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    const monthData = getTargetsForMonth(dateRange.from.getMonth() + 1, dateRange.from.getFullYear());
    const channelTarget = monthData.find(t => t.channel_id === channelId);
    
    if (!channelTarget) return [];

    const daysInMonth = differenceInDays(endOfMonth(dateRange.from), startOfMonth(dateRange.from)) + 1;
    const dailyTarget = channelTarget.target_amount / daysInMonth;

    let accumulatedSales = 0;
    let accumulatedTarget = 0;

    return days.map((day, index) => {
      const sales = getSaleAmount(channelId, format(day, 'yyyy-MM-dd'));
      const percentage = dailyTarget > 0 ? (sales / dailyTarget) * 100 : 0;
      const gap = sales - dailyTarget;
      
      accumulatedSales += sales;
      accumulatedTarget += dailyTarget;
      
      const accumulatedAverage = index > 0 ? accumulatedSales / (index + 1) : sales;
      const accumulatedPercentage = accumulatedTarget > 0 ? (accumulatedSales / accumulatedTarget) * 100 : 0;

      // Variação vs dia anterior
      const previousSales = index > 0 ? getSaleAmount(channelId, format(days[index - 1], 'yyyy-MM-dd')) : sales;
      const variation = sales - previousSales;
      const variationPercent = previousSales > 0 ? (variation / previousSales) * 100 : 0;

      // Buscar observação
      const observation = observations.find(obs => 
        obs.channel_id === channelId && obs.date === format(day, 'yyyy-MM-dd')
      )?.observation;

      return {
        date: day,
        dayOfWeek: format(day, 'EEE', { locale: ptBR }),
        formattedDate: format(day, 'dd/MMM', { locale: ptBR }),
        target: dailyTarget,
        sales,
        percentage,
        gap,
        accumulatedAverage,
        accumulatedPercentage,
        ranking: 1, // Será calculado depois
        variation,
        variationPercent,
        observation
      };
    });
  };

  // Performance data
  const performanceData = useMemo(() => {
    if (selectedChannels.length === 0) return [];
    
    if (viewMode === 'single') {
      return calculateDailyPerformance(selectedChannels[0]);
    } else {
      // Para múltiplos canais, retorna um objeto com dados de cada canal
      const result: any = {};
      selectedChannels.forEach(channelId => {
        result[channelId] = calculateDailyPerformance(channelId);
      });
      return result;
    }
  }, [selectedChannels, viewMode, dateRange, observations]);

  // Ranking de canais
  const channelRanking = useMemo(() => {
    if (!Array.isArray(performanceData) || performanceData.length === 0) return [];

    return selectedChannels.map(channelId => {
      const channelData = viewMode === 'single' ? performanceData : performanceData[channelId];
      if (!channelData || channelData.length === 0) return null;

      const averagePercentage = channelData.reduce((sum: number, day: ChannelPerformance) => sum + day.percentage, 0) / channelData.length;
      const channel = channels.find(c => c.id === channelId);

      return {
        channelId,
        channelName: channel?.name || 'Canal',
        averagePercentage
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.averagePercentage || 0) - (a?.averagePercentage || 0));
  }, [performanceData, selectedChannels, channels, viewMode]);

  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para formatar moeda compacta (ex: 5.8K em vez de 5.806,45)
  const formatCompactCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}K`;
    }
    return formatCurrency(value);
  };

  // Funções de exportação
  const exportarExcel = () => {
    console.log('Exportar Excel');
  };

  const exportarCSV = () => {
    console.log('Exportar CSV');
  };

  // Função para obter classe CSS baseada na performance
  const getPerformanceClass = (percentage: number) => {
    if (percentage < 70) return 'bg-red-500 text-white';
    if (percentage < 90) return 'bg-orange-500 text-white';
    if (percentage < 100) return 'bg-yellow-500 text-white';
    if (percentage <= 110) return 'bg-green-400 text-white';
    if (percentage <= 150) return 'bg-green-600 text-white';
    return 'bg-blue-600 text-white';
  };

  // Salvar observação
  const saveObservation = async () => {
    if (!editingObservation || !newObservation.trim()) return;

    try {
      const observationData = {
        channel_id: editingObservation.channelId,
        date: editingObservation.date,
        observation: newObservation.trim(),
        created_by: 'current-user-id' // TODO: pegar do contexto de auth
      };

      const existingObs = observations.find(obs => 
        obs.channel_id === editingObservation.channelId && 
        obs.date === editingObservation.date
      );

      if (existingObs) {
        const { error } = await supabase
          .from('daily_observations')
          .update({ observation: newObservation.trim() })
          .eq('id', existingObs.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('daily_observations')
          .insert(observationData);
        
        if (error) throw error;
      }

      await loadObservations();
      setIsObservationModalOpen(false);
      setEditingObservation(null);
      setNewObservation('');
    } catch (error) {
      console.error('Erro ao salvar observação:', error);
    }
  };

  // Abrir modal de observação
  const openObservationModal = (channelId: string, date: string, current?: string) => {
    setEditingObservation({ channelId, date, current });
    setNewObservation(current || '');
    setIsObservationModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/analises')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Performance Diária por Canal</h1>
          <p className="text-sm text-gray-600">Análise detalhada do desempenho de vendas</p>
        </div>
      </div>

      {/* Filtros em card */}
      <Card className="bg-white dark:bg-gray-900 rounded-lg shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros e Configurações
            </h2>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowTable(true)}
                disabled={selectedChannels.length === 0 || !dateRange.from || !dateRange.to}
                size="sm"
              >
                Aplicar Filtros
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportarExcel}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Exportar Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportarCSV}>
                    <FileText className="w-4 h-4 mr-2" />
                    Exportar CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Seletor de período */}
            <div className="space-y-2">
              <Label className="text-sm">Período</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {dateRange.from && dateRange.to 
                      ? `${format(dateRange.from, 'dd/MM')} - ${format(dateRange.to, 'dd/MM')}`
                      : 'Selecionar período'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined}
                    onSelect={(range) => {
                      if (range?.from) {
                        setDateRange({
                          from: range.from,
                          to: range.to || range.from
                        });
                      } else {
                        setDateRange({ from: undefined, to: undefined });
                      }
                    }}
                    className="pointer-events-auto"
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Modo de visualização */}
            <div className="space-y-2">
              <Label className="text-sm">Modo de Visualização</Label>
              <Select value={viewMode} onValueChange={(value: 'single' | 'multiple') => setViewMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Canal Único</SelectItem>
                  <SelectItem value="multiple">Múltiplos Canais</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Seleção de canais */}
            <div className="space-y-2">
              <Label className="text-sm">
                {viewMode === 'single' ? 'Canal' : 'Canais'}
              </Label>
              {viewMode === 'single' ? (
                <Select 
                  value={selectedChannels[0] || ''} 
                  onValueChange={(value) => setSelectedChannels(value ? [value] : [])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar canal" />
                  </SelectTrigger>
                  <SelectContent>
                    {channels.filter(c => c.is_active).map(channel => (
                      <SelectItem key={channel.id} value={channel.id}>
                        {channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {selectedChannels.length > 0 
                        ? `${selectedChannels.length} canal(is) selecionado(s)`
                        : 'Selecionar canais'
                      }
                      <ChevronDown className="w-4 h-4 ml-auto" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="space-y-2">
                      {channels.filter(c => c.is_active).map(channel => (
                        <div key={channel.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={channel.id}
                            checked={selectedChannels.includes(channel.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedChannels([...selectedChannels, channel.id]);
                              } else {
                                setSelectedChannels(selectedChannels.filter(id => id !== channel.id));
                              }
                            }}
                          />
                          <Label htmlFor={channel.id} className="text-sm">
                            {channel.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {/* Métricas visíveis (apenas para múltiplos canais) */}
            {viewMode === 'multiple' && (
              <div className="space-y-2">
                <Label className="text-sm">Métricas Visíveis</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      Configurar colunas
                      <ChevronDown className="w-4 h-4 ml-auto" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48">
                    <div className="space-y-2">
                      {Object.entries(selectedMetrics).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={key}
                            checked={value}
                            onCheckedChange={(checked) => 
                              setSelectedMetrics(prev => ({ ...prev, [key]: !!checked }))
                            }
                          />
                          <Label htmlFor={key} className="text-sm">
                            {key === 'target' && 'Meta'}
                            {key === 'sales' && 'Realizado'}
                            {key === 'percentage' && '% Atingimento'}
                            {key === 'gap' && 'Saldo/GAP'}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabela principal */}
      {showTable && selectedChannels.length > 0 && (
        <Card className="bg-white dark:bg-gray-900 rounded-lg shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800">
                      <TableHead className="w-32 py-3 px-4 text-sm font-medium">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              <div>Dia</div>
                              <div className="text-xs font-normal text-muted-foreground">Ranking</div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Data do dia e posição no ranking diário</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableHead>
                      {(viewMode === 'single' || selectedMetrics.target) && (
                        <TableHead className="w-28 text-right py-3 px-4 text-sm font-medium">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">Meta</div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Meta diária de vendas do canal</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                      )}
                      {(viewMode === 'single' || selectedMetrics.sales) && (
                        <TableHead className="w-28 text-right py-3 px-4 text-sm font-medium">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">Realizado</div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Valor de vendas realizado no dia</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                      )}
                      {(viewMode === 'single' || selectedMetrics.percentage) && (
                        <TableHead className="w-24 text-center py-3 px-4 text-sm font-medium">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">% Atingimento</div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Percentual de atingimento da meta diária</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                      )}
                      {(viewMode === 'single' || selectedMetrics.gap) && (
                        <TableHead className="w-28 text-right py-3 px-4 text-sm font-medium">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">Saldo/GAP</div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Diferença entre realizado e meta (gap)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                      )}
                      <TableHead className="w-24 text-right py-3 px-4 text-sm font-medium">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">Ritmo</div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Média acumulada de vendas diárias</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead className="w-24 text-center py-3 px-4 text-sm font-medium">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">% Acum</div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Percentual acumulado de atingimento da meta</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead className="w-20 text-center py-3 px-4 text-sm font-medium">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">Variação</div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Variação percentual vs dia anterior</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead className="w-12 text-center py-3 px-4 text-sm font-medium">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">Obs</div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Observações do dia</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewMode === 'single' && Array.isArray(performanceData) ? (
                      performanceData.map((day: ChannelPerformance, index: number) => (
                        <TableRow key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <TableCell className="py-3 px-4">
                            <div>
                              <div className="font-medium text-sm">
                                {day.formattedDate}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {day.dayOfWeek} • #{index + 1}
                              </div>
                            </div>
                          </TableCell>
                          {(viewMode === 'single' || selectedMetrics.target) && (
                            <TableCell className="text-right py-3 px-4 text-sm">{formatCompactCurrency(day.target)}</TableCell>
                          )}
                          {(viewMode === 'single' || selectedMetrics.sales) && (
                            <TableCell className="text-right py-3 px-4 text-sm font-medium">{formatCompactCurrency(day.sales)}</TableCell>
                          )}
                          {(viewMode === 'single' || selectedMetrics.percentage) && (
                            <TableCell className="text-center py-3 px-4">
                              <Badge className={cn("text-xs px-2 py-0.5", getPerformanceClass(day.percentage))}>
                                {day.percentage.toFixed(1)}%
                              </Badge>
                            </TableCell>
                          )}
                          {(viewMode === 'single' || selectedMetrics.gap) && (
                            <TableCell className={cn(
                              "text-right py-3 px-4 text-sm",
                              day.gap >= 0 ? "text-emerald-600" : "text-red-500"
                            )}>
                              {day.gap >= 0 ? '+' : '-'}{formatCompactCurrency(Math.abs(day.gap))}
                            </TableCell>
                          )}
                          <TableCell className="text-right py-3 px-4 text-sm">{formatCompactCurrency(day.accumulatedAverage)}</TableCell>
                          <TableCell className="text-center py-3 px-4">
                            <Badge variant={day.accumulatedPercentage >= 100 ? "default" : "secondary"} className="text-xs">
                              {day.accumulatedPercentage.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-1">
                              {day.variation > 0 ? (
                                <ArrowUp className="w-3 h-3 text-emerald-600" />
                              ) : day.variation < 0 ? (
                                <ArrowDown className="w-3 h-3 text-red-500" />
                              ) : null}
                              <span className={cn(
                                "text-xs",
                                day.variation > 0 ? "text-emerald-600" : day.variation < 0 ? "text-red-500" : "text-muted-foreground"
                              )}>
                                {Math.abs(day.variationPercent).toFixed(1)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center py-3 px-4">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => openObservationModal(
                                    selectedChannels[0], 
                                    format(day.date, 'yyyy-MM-dd'),
                                    day.observation
                                  )}
                                >
                                  <StickyNote className={cn(
                                    "w-3 h-3",
                                    day.observation ? "text-blue-600" : "text-muted-foreground"
                                  )} />
                                </Button>
                              </TooltipTrigger>
                              {day.observation && (
                                <TooltipContent>
                                  <p className="max-w-48">{day.observation}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : viewMode === 'multiple' && typeof performanceData === 'object' ? (
                      // Renderizar tabela para múltiplos canais
                      Object.entries(performanceData).map(([channelId, channelData]: [string, any]) => {
                        const channel = channels.find(c => c.id === channelId);
                        return channelData.map((day: ChannelPerformance, index: number) => (
                          <TableRow key={`${channelId}-${index}`} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <TableCell className="py-3 px-4">
                              <div>
                                <div className="font-medium text-sm">
                                  {day.formattedDate}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {channel?.name} • {day.dayOfWeek}
                                </div>
                              </div>
                            </TableCell>
                            {selectedMetrics.target && (
                              <TableCell className="text-right py-3 px-4 text-sm">{formatCompactCurrency(day.target)}</TableCell>
                            )}
                            {selectedMetrics.sales && (
                              <TableCell className="text-right py-3 px-4 text-sm font-medium">{formatCompactCurrency(day.sales)}</TableCell>
                            )}
                            {selectedMetrics.percentage && (
                              <TableCell className="text-center py-3 px-4">
                                <Badge className={cn("text-xs px-2 py-0.5", getPerformanceClass(day.percentage))}>
                                  {day.percentage.toFixed(1)}%
                                </Badge>
                              </TableCell>
                            )}
                            {selectedMetrics.gap && (
                              <TableCell className={cn(
                                "text-right py-3 px-4 text-sm",
                                day.gap >= 0 ? "text-emerald-600" : "text-red-500"
                              )}>
                                {day.gap >= 0 ? '+' : '-'}{formatCompactCurrency(Math.abs(day.gap))}
                              </TableCell>
                            )}
                            <TableCell className="text-right py-3 px-4 text-sm">{formatCompactCurrency(day.accumulatedAverage)}</TableCell>
                            <TableCell className="text-center py-3 px-4">
                              <Badge variant={day.accumulatedPercentage >= 100 ? "default" : "secondary"} className="text-xs">
                                {day.accumulatedPercentage.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center py-3 px-4">
                              <div className="flex items-center justify-center gap-1">
                                {day.variation > 0 ? (
                                  <ArrowUp className="w-3 h-3 text-emerald-600" />
                                ) : day.variation < 0 ? (
                                  <ArrowDown className="w-3 h-3 text-red-500" />
                                ) : null}
                                <span className={cn(
                                  "text-xs",
                                  day.variation > 0 ? "text-emerald-600" : day.variation < 0 ? "text-red-500" : "text-muted-foreground"
                                )}>
                                  {Math.abs(day.variationPercent).toFixed(1)}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-3 px-4">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => openObservationModal(
                                      channelId, 
                                      format(day.date, 'yyyy-MM-dd'),
                                      day.observation
                                    )}
                                  >
                                    <StickyNote className={cn(
                                      "w-3 h-3",
                                      day.observation ? "text-blue-600" : "text-muted-foreground"
                                    )} />
                                  </Button>
                                </TooltipTrigger>
                                {day.observation && (
                                  <TooltipContent>
                                    <p className="max-w-48">{day.observation}</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ));
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          Selecione os filtros e clique em "Aplicar Filtros" para visualizar os dados
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de observação */}
      <Dialog open={isObservationModalOpen} onOpenChange={setIsObservationModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Observação</DialogTitle>
            <DialogDescription>
              Adicione uma observação para o dia {editingObservation?.date}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={newObservation}
              onChange={(e) => setNewObservation(e.target.value)}
              placeholder="Digite sua observação..."
              className="min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsObservationModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={saveObservation}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PerformanceDiaria;