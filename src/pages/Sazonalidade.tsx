import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DatePicker } from '@/components/DatePicker';
import { useChannels } from '@/hooks/useChannels';
import { useDailySales } from '@/hooks/useDailySales';
import { format, startOfDay, endOfDay, differenceInDays, getDay, getDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Calendar, TrendingUp, TrendingDown, BarChart3, Target, ChevronDown } from 'lucide-react';

interface SeasonalityData {
  weekday: number;
  weekdayName: string;
  [key: string]: any; // Para dados dinâmicos dos canais
}

interface MonthlyData {
  day: number;
  [key: string]: any;
}

interface HeatmapCellProps {
  channel: string;
  value: number;
  maxValue: number;
  minValue: number;
  day: string;
  onHover: (info: string | null) => void;
}

const HeatmapCell: React.FC<HeatmapCellProps> = ({ channel, value, maxValue, minValue, day, onHover }) => {
  const normalized = maxValue === minValue ? 0.5 : (value - minValue) / (maxValue - minValue);
  
  const getColor = (intensity: number) => {
    if (intensity < 0.33) return 'hsl(0, 70%, 50%)'; // Vermelho
    if (intensity < 0.66) return 'hsl(45, 70%, 50%)'; // Amarelo
    return 'hsl(120, 70%, 40%)'; // Verde
  };

  return (
    <div
      className="flex items-center justify-center h-12 text-xs font-medium text-white cursor-pointer transition-opacity hover:opacity-80"
      style={{ backgroundColor: getColor(normalized) }}
      onMouseEnter={() => onHover(`${channel} vende em média R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${day}`)}
      onMouseLeave={() => onHover(null)}
    >
      R$ {value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
    </div>
  );
};

const MonthlyHeatmapCell: React.FC<HeatmapCellProps & { dayNumber: number }> = ({ channel, value, maxValue, minValue, day, dayNumber, onHover }) => {
  const normalized = maxValue === minValue ? 0.5 : (value - minValue) / (maxValue - minValue);
  
  const getColor = (intensity: number) => {
    if (intensity < 0.33) return 'hsl(0, 70%, 50%)';
    if (intensity < 0.66) return 'hsl(45, 70%, 50%)';
    return 'hsl(120, 70%, 40%)';
  };

  return (
    <div
      className="flex items-center justify-center h-8 text-xs font-medium text-white cursor-pointer transition-opacity hover:opacity-80"
      style={{ backgroundColor: getColor(normalized) }}
      onMouseEnter={() => onHover(`${channel} - Dia ${dayNumber}: R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)}
      onMouseLeave={() => onHover(null)}
    >
      {value > 0 ? value.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : '-'}
    </div>
  );
};

export default function Sazonalidade() {
  const { channels } = useChannels();
  const { sales } = useDailySales();
  
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)); // 90 dias atrás
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [showOnlyActiveDays, setShowOnlyActiveDays] = useState(false);
  const [tooltipInfo, setTooltipInfo] = useState<string | null>(null);

  // Inicializar canais selecionados
  useEffect(() => {
    if (channels.length > 0 && selectedChannels.length === 0) {
      setSelectedChannels(channels.slice(0, 3).map(c => c.id));
    }
  }, [channels]);

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dayNamesLong = ['domingos', 'segundas-feiras', 'terças-feiras', 'quartas-feiras', 'quintas-feiras', 'sextas-feiras', 'sábados'];

  // Gerar cores consistentes para cada canal
  const getChannelColor = (channelId: string, index: number) => {
    const colors = [
      'hsl(210, 70%, 50%)', // Azul
      'hsl(340, 70%, 50%)', // Rosa
      'hsl(120, 70%, 40%)', // Verde
      'hsl(45, 70%, 50%)',  // Amarelo
      'hsl(270, 70%, 50%)', // Roxo
      'hsl(15, 70%, 50%)',  // Laranja
      'hsl(180, 70%, 40%)', // Ciano
      'hsl(300, 70%, 50%)'  // Magenta
    ];
    return colors[index % colors.length];
  };

  // Filtrar vendas por período
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      return saleDate >= startOfDay(startDate) && saleDate <= endOfDay(endDate);
    });
  }, [sales, startDate, endDate]);

  // Calcular dados de sazonalidade por dia da semana
  const weeklySeasonalityData = useMemo(() => {
    const data: SeasonalityData[] = [];
    
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const dayData: SeasonalityData = {
        weekday: dayIndex,
        weekdayName: dayNames[dayIndex]
      };

      selectedChannels.forEach(channelId => {
        const channelSales = filteredSales.filter(sale => 
          sale.channel_id === channelId && getDay(new Date(sale.sale_date)) === dayIndex
        );
        
        if (showOnlyActiveDays) {
          const activeSales = channelSales.filter(sale => sale.amount > 0);
          dayData[channelId] = activeSales.length > 0 
            ? activeSales.reduce((sum, sale) => sum + sale.amount, 0) / activeSales.length 
            : 0;
        } else {
          dayData[channelId] = channelSales.length > 0 
            ? channelSales.reduce((sum, sale) => sum + sale.amount, 0) / channelSales.length 
            : 0;
        }
      });

      data.push(dayData);
    }

    return data;
  }, [filteredSales, selectedChannels, showOnlyActiveDays]);

  // Calcular dados mensais (por dia do mês)
  const monthlySeasonalityData = useMemo(() => {
    const data: MonthlyData[] = [];
    
    for (let day = 1; day <= 31; day++) {
      const dayData: MonthlyData = { day };

      selectedChannels.forEach(channelId => {
        const channelSales = filteredSales.filter(sale => 
          sale.channel_id === channelId && getDate(new Date(sale.sale_date)) === day
        );
        
        if (showOnlyActiveDays) {
          const activeSales = channelSales.filter(sale => sale.amount > 0);
          dayData[channelId] = activeSales.length > 0 
            ? activeSales.reduce((sum, sale) => sum + sale.amount, 0) / activeSales.length 
            : 0;
        } else {
          dayData[channelId] = channelSales.length > 0 
            ? channelSales.reduce((sum, sale) => sum + sale.amount, 0) / channelSales.length 
            : 0;
        }
      });

      data.push(dayData);
    }

    return data;
  }, [filteredSales, selectedChannels, showOnlyActiveDays]);

  // Calcular insights automáticos
  const insights = useMemo(() => {
    const insightsList: string[] = [];
    
    selectedChannels.forEach(channelId => {
      const channel = channels.find(c => c.id === channelId);
      if (!channel) return;

      const channelData = weeklySeasonalityData.map(d => d[channelId] || 0);
      const average = channelData.reduce((sum, val) => sum + val, 0) / channelData.length;
      
      const bestDayIndex = channelData.indexOf(Math.max(...channelData));
      const worstDayIndex = channelData.indexOf(Math.min(...channelData));
      
      if (average > 0) {
        const bestPerformance = ((channelData[bestDayIndex] - average) / average * 100);
        const worstPerformance = ((channelData[worstDayIndex] - average) / average * 100);
        
        if (bestPerformance > 20) {
          insightsList.push(`${channel.name} performa ${bestPerformance.toFixed(0)}% melhor às ${dayNamesLong[bestDayIndex]}`);
        }
        
        if (worstPerformance < -20) {
          insightsList.push(`${channel.name} tem queda de ${Math.abs(worstPerformance).toFixed(0)}% aos ${dayNamesLong[worstDayIndex]}`);
        }
      }
    });

    return insightsList;
  }, [weeklySeasonalityData, selectedChannels, channels]);

  // Calcular cards de resumo
  const summaryCards = useMemo(() => {
    if (weeklySeasonalityData.length === 0 || selectedChannels.length === 0) return null;

    const globalAverages = weeklySeasonalityData.map(day => {
      const dayTotal = selectedChannels.reduce((sum, channelId) => sum + (day[channelId] || 0), 0);
      return dayTotal / selectedChannels.length;
    });

    const bestDayIndex = globalAverages.indexOf(Math.max(...globalAverages));
    const worstDayIndex = globalAverages.indexOf(Math.min(...globalAverages));
    const overallAverage = globalAverages.reduce((sum, val) => sum + val, 0) / globalAverages.length;

    const bestDayImprovement = overallAverage > 0 
      ? ((globalAverages[bestDayIndex] - overallAverage) / overallAverage * 100)
      : 0;
    const worstDayDrop = overallAverage > 0
      ? ((globalAverages[worstDayIndex] - overallAverage) / overallAverage * 100)
      : 0;

    // Calcular consistência dos canais
    const channelVariations = selectedChannels.map(channelId => {
      const channel = channels.find(c => c.id === channelId);
      const values = weeklySeasonalityData.map(d => d[channelId] || 0);
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      const variation = avg > 0 ? (stdDev / avg) * 100 : 0;
      
      return {
        channelName: channel?.name || '',
        variation
      };
    });

    // Verificar se há dados antes de usar reduce
    const mostConsistent = channelVariations.length > 0 
      ? channelVariations.reduce((min, curr) => 
          curr.variation < min.variation ? curr : min
        )
      : { channelName: 'N/A', variation: 0 };
    
    const mostSeasonal = channelVariations.length > 0
      ? channelVariations.reduce((max, curr) => 
          curr.variation > max.variation ? curr : max
        )
      : { channelName: 'N/A', variation: 0 };

    return {
      bestDay: {
        name: dayNames[bestDayIndex] || 'N/A',
        improvement: bestDayImprovement
      },
      worstDay: {
        name: dayNames[worstDayIndex] || 'N/A',
        drop: worstDayDrop
      },
      mostConsistent,
      mostSeasonal
    };
  }, [weeklySeasonalityData, selectedChannels, channels]);

  const periodDays = differenceInDays(endDate, startDate) + 1;
  const isValidPeriod = periodDays >= 30 && periodDays <= 365;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Análise de Sazonalidade por Canal"
        description="Analise padrões de vendas por dia da semana e do mês"
      />

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtros de Análise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Período */}
            <div className="space-y-2">
              <Label>Período de Análise</Label>
              <div className="flex gap-2">
                <DatePicker
                  date={startDate}
                  onDateChange={setStartDate}
                  placeholder="Data inicial"
                  className="flex-1"
                />
                <DatePicker
                  date={endDate}
                  onDateChange={setEndDate}
                  placeholder="Data final"
                  className="flex-1"
                />
              </div>
              {!isValidPeriod && (
                <p className="text-sm text-destructive">
                  Período deve ter entre 30 dias e 1 ano
                </p>
              )}
            </div>

            {/* Canais */}
            <div className="space-y-2">
              <Label>Canais para Comparar</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between text-left font-normal"
                  >
                    <span>
                      {selectedChannels.length === 0 
                        ? "Selecionar canais" 
                        : `${selectedChannels.length} ${selectedChannels.length === 1 ? 'canal selecionado' : 'canais selecionados'}`
                      }
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <div className="p-4 space-y-3 max-h-64 overflow-y-auto bg-background border rounded-md shadow-lg">
                    {channels.map(channel => (
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
                        <label 
                          htmlFor={channel.id} 
                          className="text-sm cursor-pointer flex-1 py-1"
                        >
                          {channel.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Toggle */}
            <div className="space-y-2">
              <Label>Opções</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active-days"
                  checked={showOnlyActiveDays}
                  onCheckedChange={setShowOnlyActiveDays}
                />
                <Label htmlFor="active-days" className="text-sm">
                  Mostrar apenas dias ativos
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isValidPeriod && selectedChannels.length > 0 && (
        <>
          {/* Cards de Resumo */}
          {summaryCards && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Melhor Dia</p>
                      <p className="text-lg font-semibold text-green-600">
                        {summaryCards.bestDay.name}
                      </p>
                      <p className="text-xs text-green-600">
                        +{summaryCards.bestDay.improvement.toFixed(1)}% vs média
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pior Dia</p>
                      <p className="text-lg font-semibold text-red-600">
                        {summaryCards.worstDay.name}
                      </p>
                      <p className="text-xs text-red-600">
                        {summaryCards.worstDay.drop.toFixed(1)}% vs média
                      </p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Mais Consistente</p>
                      <p className="text-lg font-semibold">
                        {summaryCards.mostConsistent.channelName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {summaryCards.mostConsistent.variation.toFixed(1)}% de variação
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Mais Sazonal</p>
                      <p className="text-lg font-semibold">
                        {summaryCards.mostSeasonal.channelName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {summaryCards.mostSeasonal.variation.toFixed(1)}% de variação
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Heatmap Semanal */}
          <Card>
            <CardHeader>
              <CardTitle>Sazonalidade por Dia da Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedChannels.map((channelId, index) => {
                  const channel = channels.find(c => c.id === channelId);
                  if (!channel) return null;

                  const channelValues = weeklySeasonalityData.map(d => d[channelId] || 0);
                  const maxValue = Math.max(...channelValues);
                  const minValue = Math.min(...channelValues);

                  return (
                    <div key={channelId} className="space-y-1">
                      <div className="text-sm font-medium">{channel.name}</div>
                      <div className="grid grid-cols-7 gap-1">
                        {weeklySeasonalityData.map((dayData, dayIndex) => (
                          <HeatmapCell
                            key={dayIndex}
                            channel={channel.name}
                            value={dayData[channelId] || 0}
                            maxValue={maxValue}
                            minValue={minValue}
                            day={dayNamesLong[dayData.weekday]}
                            onHover={setTooltipInfo}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
                
                {/* Header com dias da semana */}
                <div className="grid grid-cols-7 gap-1 mt-2">
                  {dayNames.map(day => (
                    <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
                      {day}
                    </div>
                  ))}
                </div>
              </div>
              
              {tooltipInfo && (
                <div className="mt-4 p-2 bg-muted rounded text-sm">
                  {tooltipInfo}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Barras */}
          <Card>
            <CardHeader>
              <CardTitle>Performance por Dia da Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={weeklySeasonalityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="weekdayName" />
                  <YAxis tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      channels.find(c => c.id === name)?.name || name
                    ]}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Legend 
                    formatter={(value) => channels.find(c => c.id === value)?.name || value}
                  />
                  {selectedChannels.map((channelId, index) => (
                    <Bar
                      key={channelId}
                      dataKey={channelId}
                      fill={getChannelColor(channelId, index)}
                      name={channelId}
                    />
                  ))}
                  <ReferenceLine 
                    y={weeklySeasonalityData.reduce((sum, day) => {
                      const dayTotal = selectedChannels.reduce((channelSum, channelId) => 
                        channelSum + (day[channelId] || 0), 0);
                      return sum + dayTotal / selectedChannels.length;
                    }, 0) / weeklySeasonalityData.length}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="5 5"
                    label="Média Geral"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Insights Automáticos */}
          {insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Insights Automáticos</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {insights.map((insight, index) => (
                    <li key={index} className="text-sm p-2 bg-muted rounded">
                      • {insight}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Heatmap Mensal */}
          <Card>
            <CardHeader>
              <CardTitle>Sazonalidade por Dia do Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedChannels.map((channelId, index) => {
                  const channel = channels.find(c => c.id === channelId);
                  if (!channel) return null;

                  const channelValues = monthlySeasonalityData.map(d => d[channelId] || 0);
                  const maxValue = Math.max(...channelValues);
                  const minValue = Math.min(...channelValues);

                  return (
                    <div key={channelId} className="space-y-1">
                      <div className="text-sm font-medium">{channel.name}</div>
                      <div className="grid grid-cols-31 gap-px">
                        {monthlySeasonalityData.map((dayData, dayIndex) => (
                          <MonthlyHeatmapCell
                            key={dayIndex}
                            channel={channel.name}
                            value={dayData[channelId] || 0}
                            maxValue={maxValue}
                            minValue={minValue}
                            day={`dia ${dayData.day}`}
                            dayNumber={dayData.day}
                            onHover={setTooltipInfo}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
                
                {/* Header com dias do mês */}
                <div className="grid grid-cols-31 gap-px mt-2">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <div key={day} className="text-center text-xs text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}