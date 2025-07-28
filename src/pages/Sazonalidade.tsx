import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DatePicker } from '@/components/DatePicker';
import { useChannels } from '@/hooks/useChannels';
import { useDailySales } from '@/hooks/useDailySales';
import { format, startOfDay, endOfDay, differenceInDays, getDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';
import { Calendar, TrendingUp, TrendingDown, BarChart3, Target, ChevronDown, AlertTriangle, Activity, Radar as RadarIcon } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

interface SeasonalityData {
  weekday: number;
  weekdayName: string;
  [key: string]: any;
}

interface ChannelPerformance {
  channel: string;
  channelId: string;
  performance: number[];
  variation: number;
  bestDay: string;
  worstDay: string;
  bestPerf: number;
  worstPerf: number;
  color: string;
}

interface PatternData {
  channel: string;
  strong: string;
  weak: string;
  pattern: string;
  consistency: number;
}

type ViewMode = 'radar' | 'cards' | 'table';

export default function Sazonalidade() {
  const { channels } = useChannels();
  const { sales } = useDailySales();
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [showOnlyActiveDays, setShowOnlyActiveDays] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('radar');

  const startDate = dateRange?.from || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const endDate = dateRange?.to || new Date();

  useEffect(() => {
    if (channels.length > 0 && selectedChannels.length === 0) {
      setSelectedChannels(channels.slice(0, 4).map(c => c.id));
    }
  }, [channels]);

  const dayNames = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
  const dayNamesLong = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const dayNamesRadar = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  const getChannelColor = (index: number) => {
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
      '#8b5cf6', '#f97316', '#06b6d4', '#ec4899'
    ];
    return colors[index % colors.length];
  };

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      return saleDate >= startOfDay(startDate) && saleDate <= endOfDay(endDate);
    });
  }, [sales, startDate, endDate]);

  const weeklySeasonalityData = useMemo(() => {
    const data: SeasonalityData[] = [];
    
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const dayData: SeasonalityData = {
        weekday: dayIndex,
        weekdayName: dayNamesRadar[dayIndex]
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

  // Calcular dados para gráfico de radar (normalizado para percentual)
  const radarData = useMemo(() => {
    return weeklySeasonalityData.map(dayData => {
      const result: any = { weekdayName: dayData.weekdayName };
      
      selectedChannels.forEach(channelId => {
        const channelData = weeklySeasonalityData.map(d => d[channelId] || 0);
        const average = channelData.reduce((sum, val) => sum + val, 0) / channelData.length;
        const normalized = average > 0 ? ((dayData[channelId] || 0) / average) * 100 : 0;
        result[channelId] = Math.round(normalized);
      });
      
      return result;
    });
  }, [weeklySeasonalityData, selectedChannels]);

  // Calcular performance por canal para os cards
  const channelPerformances = useMemo(() => {
    return selectedChannels.map((channelId, index) => {
      const channel = channels.find(c => c.id === channelId);
      const channelData = weeklySeasonalityData.map(d => d[channelId] || 0);
      const average = channelData.reduce((sum, val) => sum + val, 0) / channelData.length;
      
      const performance = channelData.map(val => 
        average > 0 ? Math.round((val / average) * 100) : 0
      );
      
      const bestDayIndex = performance.indexOf(Math.max(...performance));
      const worstDayIndex = performance.indexOf(Math.min(...performance));
      
      const values = performance.filter(p => p > 0);
      const variance = values.length > 0 
        ? values.reduce((sum, val) => sum + Math.pow(val - 100, 2), 0) / values.length 
        : 0;
      const standardDeviation = Math.sqrt(variance);
      
      return {
        channel: channel?.name || 'Canal',
        channelId,
        performance,
        variation: standardDeviation,
        bestDay: dayNamesLong[bestDayIndex],
        worstDay: dayNamesLong[worstDayIndex],
        bestPerf: performance[bestDayIndex] - 100,
        worstPerf: performance[worstDayIndex] - 100,
        color: getChannelColor(index)
      };
    });
  }, [weeklySeasonalityData, selectedChannels, channels]);

  // Dados mensais para sparklines
  const monthlySparklines = useMemo(() => {
    return selectedChannels.map(channelId => {
      const days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date;
      });
      
      const data = days.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const sale = filteredSales.find(s => 
          s.channel_id === channelId && s.sale_date === dateStr
        );
        return sale?.amount || 0;
      });
      
      const firstWeekAvg = data.slice(0, 7).reduce((sum, val) => sum + val, 0) / 7;
      const lastWeekAvg = data.slice(-7).reduce((sum, val) => sum + val, 0) / 7;
      const change = firstWeekAvg > 0 
        ? Math.round(((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100)
        : 0;
      
      return {
        channelId,
        data,
        change,
        channel: channels.find(c => c.id === channelId)?.name || 'Canal'
      };
    });
  }, [filteredSales, selectedChannels, channels]);

  // Calcular insights automáticos
  const insights = useMemo(() => {
    const insightsList: Array<{ type: 'positive' | 'negative' | 'neutral', message: string, detail: string }> = [];
    
    // Análise global dos dias
    const globalPerformance = Array.from({ length: 7 }, (_, dayIndex) => {
      const dayTotal = selectedChannels.reduce((sum, channelId) => {
        const dayValue = weeklySeasonalityData.find(d => d.weekday === dayIndex)?.[channelId] || 0;
        return sum + dayValue;
      }, 0);
      return dayTotal / Math.max(selectedChannels.length, 1);
    });
    
    // Contar quantos canais performam bem em cada dia
    const dayStrength = Array.from({ length: 7 }, (_, dayIndex) => {
      const strongChannels = selectedChannels.filter(channelId => {
        const performance = channelPerformances.find(p => p.channelId === channelId);
        return performance && performance.performance[dayIndex] >= 110;
      }).length;
      return strongChannels;
    });
    
    const strongestDay = dayStrength.indexOf(Math.max(...dayStrength));
    const strongChannelCount = Math.max(...dayStrength);
    
    if (strongChannelCount >= Math.ceil(selectedChannels.length * 0.6)) {
      insightsList.push({
        type: 'positive',
        message: `${dayNamesLong[strongestDay]} é o melhor dia geral`,
        detail: `${strongChannelCount} de ${selectedChannels.length} canais performam acima da média`
      });
    }
    
    // Identificar canal mais inconsistente
    if (channelPerformances.length > 0) {
      const mostInconsistent = channelPerformances.reduce((max, curr) => 
        curr.variation > max.variation ? curr : max, 
        { variation: 0, channel: '', bestDay: '', worstDay: '' }
      );
      
      if (mostInconsistent.variation > 30) {
        insightsList.push({
          type: 'negative',
          message: `${mostInconsistent.channel} tem alta variação semanal`,
          detail: `Forte em ${mostInconsistent.bestDay}, fraco em ${mostInconsistent.worstDay}`
        });
      }
    }
    
    // Padrão de fim de semana
    const weekendChannels = selectedChannels.filter(channelId => {
      const performance = channelPerformances.find(p => p.channelId === channelId);
      if (!performance) return false;
      const weekendAvg = (performance.performance[5] + performance.performance[6]) / 2; // Sáb + Dom
      return weekendAvg < 85;
    });
    
    if (weekendChannels.length >= Math.ceil(selectedChannels.length * 0.5)) {
      insightsList.push({
        type: 'neutral',
        message: 'Padrão de queda no fim de semana',
        detail: `${weekendChannels.length} canais vendem menos sábado e domingo`
      });
    }

    return insightsList;
  }, [weeklySeasonalityData, selectedChannels, channelPerformances]);

  // Dados para tabela de padrões
  const patternData = useMemo(() => {
    return channelPerformances.map(perf => {
      const strongDays = perf.performance
        .map((val, idx) => ({ val, day: dayNamesLong[idx] }))
        .filter(d => d.val >= 110)
        .map(d => d.day);
      
      const weakDays = perf.performance
        .map((val, idx) => ({ val, day: dayNamesLong[idx] }))
        .filter(d => d.val <= 90)
        .map(d => d.day);
      
      let pattern = 'Equilibrado';
      if (strongDays.some(d => ['Sáb', 'Dom'].includes(d))) pattern = 'Fim de semana forte';
      else if (weakDays.some(d => ['Sáb', 'Dom'].includes(d))) pattern = 'Fim de semana fraco';
      else if (strongDays.some(d => ['Qui', 'Sex'].includes(d))) pattern = 'Final da semana forte';
      
      const consistency = Math.max(0, 100 - perf.variation);
      
      return {
        channel: perf.channel,
        strong: strongDays.length > 0 ? strongDays.join(', ') : 'Nenhum',
        weak: weakDays.length > 0 ? weakDays.join(', ') : 'Nenhum',
        pattern,
        consistency: Math.round(consistency)
      };
    });
  }, [channelPerformances]);

  // Preparar dados para gráfico de barras
  const barChartData = useMemo(() => {
    return weeklySeasonalityData.map(dayData => {
      const result: any = { day: dayData.weekdayName };
      selectedChannels.forEach(channelId => {
        const channel = channels.find(c => c.id === channelId);
        result[channel?.name || 'Canal'] = dayData[channelId] || 0;
      });
      return result;
    });
  }, [weeklySeasonalityData, selectedChannels, channels]);

  const periodDays = differenceInDays(endDate, startDate) + 1;
  const isValidPeriod = periodDays >= 30 && periodDays <= 365;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Análise de Sazonalidade"
        description="Padrões inteligentes de vendas por canal e dia da semana"
      />

      {/* Filtros e Modo de Visualização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Configurações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Período */}
            <div className="space-y-2">
              <Label>Período</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                          {format(dateRange.to, "dd/MM/yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy")
                      )
                    ) : (
                      <span>Selecionar período</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Canais */}
            <div className="space-y-2">
              <Label>Canais</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span>
                      {selectedChannels.length === 0 ? "Selecionar" : `${selectedChannels.length} selecionados`}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <div className="p-4 space-y-3 max-h-64 overflow-y-auto bg-background border rounded-md shadow-lg z-50">
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
                        <label htmlFor={channel.id} className="text-sm cursor-pointer flex-1">
                          {channel.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Toggle dias ativos */}
            <div className="space-y-2">
              <Label>Filtro</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active-days"
                  checked={showOnlyActiveDays}
                  onCheckedChange={setShowOnlyActiveDays}
                />
                <Label htmlFor="active-days" className="text-sm">Dias ativos</Label>
              </div>
            </div>

            {/* Modo de visualização */}
            <div className="space-y-2">
              <Label>Visualização</Label>
              <div className="flex gap-1">
                <Button
                  variant={viewMode === 'radar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('radar')}
                  className="flex-1"
                >
                  <RadarIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="flex-1"
                >
                  <Activity className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="flex-1"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {!isValidPeriod && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              Período deve ter entre 30 dias e 1 ano para análise confiável
            </div>
          )}
        </CardContent>
      </Card>

      {isValidPeriod && selectedChannels.length > 0 && (
        <>
          {/* Insights em cards coloridos */}
          {insights.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {insights.map((insight, index) => (
                <Card key={index} className={`border ${
                  insight.type === 'positive' ? 'bg-green-50 border-green-200' :
                  insight.type === 'negative' ? 'bg-red-50 border-red-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      {insight.type === 'positive' ? (
                        <TrendingUp className="text-green-600 mt-1" size={20} />
                      ) : insight.type === 'negative' ? (
                        <AlertTriangle className="text-red-600 mt-1" size={20} />
                      ) : (
                        <Target className="text-blue-600 mt-1" size={20} />
                      )}
                      <div>
                        <p className={`font-medium ${
                          insight.type === 'positive' ? 'text-green-900' :
                          insight.type === 'negative' ? 'text-red-900' :
                          'text-blue-900'
                        }`}>
                          {insight.message}
                        </p>
                        <p className={`text-sm ${
                          insight.type === 'positive' ? 'text-green-700' :
                          insight.type === 'negative' ? 'text-red-700' :
                          'text-blue-700'
                        }`}>
                          {insight.detail}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Visualização Principal */}
          {viewMode === 'radar' && (
            <Card>
              <CardHeader>
                <CardTitle>Gráfico de Radar - Performance Semanal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="weekdayName" />
                      <PolarRadiusAxis domain={[0, 150]} tickCount={4} />
                      {selectedChannels.map((channelId, index) => {
                        const channel = channels.find(c => c.id === channelId);
                        return (
                          <Radar
                            key={channelId}
                            name={channel?.name || 'Canal'}
                            dataKey={channelId}
                            stroke={getChannelColor(index)}
                            fill={getChannelColor(index)}
                            fillOpacity={0.1}
                            strokeWidth={2}
                          />
                        );
                      })}
                      <Legend />
                      <Tooltip 
                        formatter={(value: any) => [`${value}%`, '']}
                        labelFormatter={(label) => `Dia: ${label}`}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {channelPerformances.map((perf) => (
                <Card key={perf.channelId} className="bg-white border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">{perf.channel}</h3>
                      <span className="text-sm text-muted-foreground">
                        Var: {perf.variation.toFixed(0)}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-xs mb-3">
                      {dayNames.map((dia, idx) => (
                        <div key={idx} className="text-center">
                          <div className={`w-8 h-8 rounded flex items-center justify-center mb-1 text-white text-xs font-medium ${
                            perf.performance[idx] > 110 ? 'bg-green-500' :
                            perf.performance[idx] < 90 ? 'bg-red-500' :
                            'bg-gray-400'
                          }`}>
                            {dia}
                          </div>
                          <span className="text-muted-foreground">
                            {perf.performance[idx]}%
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      <div>Melhor: {perf.bestDay} (+{perf.bestPerf}%)</div>
                      <div>Pior: {perf.worstDay} ({perf.worstPerf}%)</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {viewMode === 'table' && (
            <Card>
              <CardHeader>
                <CardTitle>Tabela de Padrões</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Canal</th>
                        <th className="text-left p-2 font-medium">Dias Fortes</th>
                        <th className="text-left p-2 font-medium">Dias Fracos</th>
                        <th className="text-left p-2 font-medium">Padrão</th>
                        <th className="text-left p-2 font-medium">Consistência</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patternData.map((pattern, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium">{pattern.channel}</td>
                          <td className="p-2 text-green-600">{pattern.strong}</td>
                          <td className="p-2 text-red-600">{pattern.weak}</td>
                          <td className="p-2">{pattern.pattern}</td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500 transition-all"
                                  style={{ width: `${pattern.consistency}%` }}
                                />
                              </div>
                              <span className="text-xs">{pattern.consistency}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gráfico de barras agrupadas melhorado */}
          <Card>
            <CardHeader>
              <CardTitle>Valores Médios por Dia da Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, '']}
                      labelFormatter={(label) => `Dia: ${label}`}
                    />
                    <Legend />
                    {selectedChannels.map((channelId, index) => {
                      const channel = channels.find(c => c.id === channelId);
                      return (
                        <Bar
                          key={channelId}
                          dataKey={channel?.name || 'Canal'}
                          fill={getChannelColor(index)}
                          maxBarSize={40}
                        />
                      );
                    })}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Mini sparklines mensais */}
          <Card>
            <CardHeader>
              <CardTitle>Tendência Mensal (Últimos 30 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {monthlySparklines.map((sparkline, index) => (
                  <div key={sparkline.channelId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{sparkline.channel}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${
                        sparkline.change > 0 ? 'bg-green-100 text-green-600' :
                        sparkline.change < 0 ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {sparkline.change > 0 ? '+' : ''}{sparkline.change}%
                      </span>
                    </div>
                    <div className="h-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparkline.data.map((value, i) => ({ day: i, value }))}>
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke={getChannelColor(index)} 
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}