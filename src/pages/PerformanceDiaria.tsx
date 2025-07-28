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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
  FileText
} from 'lucide-react';
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/analises')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Performance Diária por Canal</h1>
          <p className="text-muted-foreground">Análise detalhada do desempenho de vendas</p>
        </div>
      </div>

      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros e Configurações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Seletor de período */}
            <div className="space-y-2">
              <Label>Período</Label>
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
                    onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Modo de visualização */}
            <div className="space-y-2">
              <Label>Modo de Visualização</Label>
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
              <Label>
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
                <Label>Métricas Visíveis</Label>
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

          {/* Botões de ação */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar Excel
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo principal */}
      {selectedChannels.length > 0 && Array.isArray(performanceData) && viewMode === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tabela principal */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>
                  Performance Diária - {channels.find(c => c.id === selectedChannels[0])?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold">Dia</th>
                        <th className="text-right p-2 font-semibold">Meta</th>
                        <th className="text-right p-2 font-semibold">Realizado</th>
                        <th className="text-center p-2 font-semibold">% Atingimento</th>
                        <th className="text-right p-2 font-semibold">Saldo/GAP</th>
                        <th className="text-right p-2 font-semibold">Ritmo Acum.</th>
                        <th className="text-center p-2 font-semibold">% Acum. Meta</th>
                        <th className="text-center p-2 font-semibold">Variação</th>
                        <th className="text-center p-2 font-semibold">Obs.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceData.map((day: ChannelPerformance, index: number) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-2">
                            <div>
                              <div className="font-medium">
                                {day.formattedDate}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {day.dayOfWeek}
                              </div>
                            </div>
                          </td>
                          <td className="text-right p-2">{formatCurrency(day.target)}</td>
                          <td className="text-right p-2 font-medium">{formatCurrency(day.sales)}</td>
                          <td className="text-center p-2">
                            <Badge className={cn("text-xs", getPerformanceClass(day.percentage))}>
                              {day.percentage.toFixed(1)}%
                            </Badge>
                          </td>
                           <td className={cn(
                             "text-right p-2 font-medium",
                             day.gap >= 0 ? "text-green-600" : "text-red-600"
                           )}>
                             <div className="flex items-center justify-end gap-1">
                               {day.gap >= 0 ? (
                                 <>
                                   <span className="text-xs">+</span>
                                   <span>{formatCurrency(day.gap)}</span>
                                   <span className="text-xs opacity-70">(excedente)</span>
                                 </>
                               ) : (
                                 <>
                                   <span className="text-xs">-</span>
                                   <span>{formatCurrency(Math.abs(day.gap))}</span>
                                   <span className="text-xs opacity-70">(faltam)</span>
                                 </>
                               )}
                             </div>
                           </td>
                          <td className="text-right p-2">{formatCurrency(day.accumulatedAverage)}</td>
                          <td className="text-center p-2">
                            <Badge variant={day.accumulatedPercentage >= 100 ? "default" : "secondary"}>
                              {day.accumulatedPercentage.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="text-center p-2">
                            <div className="flex items-center justify-center gap-1">
                              {day.variation > 0 ? (
                                <ArrowUp className="w-3 h-3 text-green-600" />
                              ) : day.variation < 0 ? (
                                <ArrowDown className="w-3 h-3 text-red-600" />
                              ) : null}
                              <span className={cn(
                                "text-xs",
                                day.variation > 0 ? "text-green-600" : day.variation < 0 ? "text-red-600" : "text-muted-foreground"
                              )}>
                                {Math.abs(day.variationPercent).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="text-center p-2">
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Card de ranking */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Ranking do Período
                </CardTitle>
                <CardDescription>
                  Performance média dos canais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {channelRanking.map((item, index) => (
                    <div key={item?.channelId} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                      <div className="flex-shrink-0">
                        {index === 0 && <span className="text-xl">🥇</span>}
                        {index === 1 && <span className="text-xl">🥈</span>}
                        {index === 2 && <span className="text-xl">🥉</span>}
                        {index > 2 && (
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {item?.channelName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item?.averagePercentage.toFixed(1)}% média
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
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