import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MonthYearPicker } from '@/components/MonthYearPicker';
import { TargetHistoryPanel } from '@/components/TargetHistoryPanel';
import { useChannels } from '@/hooks/useChannels';
import { useTargets } from '@/hooks/useTargets';
import { useToast } from '@/hooks/use-toast';
import { MonthlyTargetData } from '@/types/target';
import { 
  Target, 
  Copy, 
  Save, 
  Store, 
  Globe, 
  ShoppingBag,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Targets() {
  const { channels } = useChannels();
  const { 
    getTargetsForMonth, 
    getPreviousMonthTargets,
    saveMonthlyTargets, 
    copyFromPreviousMonth,
    getHistoryForMonth,
    loading 
  } = useTargets();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [targetValues, setTargetValues] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const month = selectedDate.getMonth() + 1;
  const year = selectedDate.getFullYear();
  
  const activeChannels = channels.filter(c => c.is_active);
  const currentTargets = getTargetsForMonth(month, year);
  const previousTargets = getPreviousMonthTargets(month, year);
  const history = getHistoryForMonth(month, year);

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'E-commerce': return Store;
      case 'Landing Page': return Globe;
      case 'Marketplace': return ShoppingBag;
      default: return Store;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getCurrentTarget = (channelId: string) => {
    return currentTargets.find(t => t.channel_id === channelId)?.target_amount || 0;
  };

  const getPreviousTarget = (channelId: string) => {
    return previousTargets.find(t => t.channel_id === channelId)?.target_amount || 0;
  };

  // Carregar valores iniciais quando o mês muda
  useEffect(() => {
    const initialValues: Record<string, string> = {};
    activeChannels.forEach(channel => {
      const currentTarget = getCurrentTarget(channel.id);
      initialValues[channel.id] = currentTarget.toString();
    });
    setTargetValues(initialValues);
    setHasChanges(false);
  }, [month, year, activeChannels.length]);

  const handleTargetChange = (channelId: string, value: string) => {
    setTargetValues(prev => ({ ...prev, [channelId]: value }));
    setHasChanges(true);
  };

  const handleCopyFromPrevious = () => {
    const previousData = copyFromPreviousMonth(month, year);
    const newValues: Record<string, string> = {};
    
    previousData.forEach(data => {
      newValues[data.channel_id] = data.target_amount.toString();
    });
    
    setTargetValues(newValues);
    setHasChanges(true);
    
    toast({
      title: "Metas copiadas",
      description: `Valores do mês anterior foram aplicados.`,
    });
  };

  const handleSaveTargets = async () => {
    try {
      const targetsData: MonthlyTargetData[] = activeChannels.map(channel => ({
        channel_id: channel.id,
        target_amount: parseFloat(targetValues[channel.id] || '0') || 0,
      }));

      await saveMonthlyTargets(month, year, targetsData);
      setHasChanges(false);
      
      toast({
        title: "Metas salvas",
        description: `Metas de ${format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })} foram salvas com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar as metas.",
        variant: "destructive",
      });
    }
  };

  const getTotalTarget = () => {
    return activeChannels.reduce((total, channel) => {
      const value = parseFloat(targetValues[channel.id] || '0') || 0;
      return total + value;
    }, 0);
  };

  const getPreviousTotal = () => {
    return previousTargets.reduce((total, target) => total + target.target_amount, 0);
  };

  const hasTargetDefined = (channelId: string) => {
    const currentValue = parseFloat(targetValues[channelId] || '0') || 0;
    return currentValue > 0;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Target className="w-8 h-8 text-primary" />
              Gestão de Metas
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure as metas mensais para cada canal de venda
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <MonthYearPicker
              date={selectedDate}
              onDateChange={setSelectedDate}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCopyFromPrevious}
                disabled={previousTargets.length === 0}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Copiar Mês Anterior
              </Button>
              <Button
                onClick={handleSaveTargets}
                disabled={!hasChanges || loading}
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Salvar Metas
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Targets Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Metas para {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {activeChannels.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum canal ativo</h3>
                    <p className="text-muted-foreground">
                      Ative pelo menos um canal para definir metas.
                    </p>
                  </div>
                ) : (
                  activeChannels.map((channel) => {
                    const IconComponent = getChannelIcon(channel.type);
                    const currentTarget = getCurrentTarget(channel.id);
                    const previousTarget = getPreviousTarget(channel.id);
                    const hasTarget = hasTargetDefined(channel.id);
                    
                    return (
                      <div key={channel.id} className="border border-border/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                              {channel.icon_url ? (
                                <img 
                                  src={channel.icon_url} 
                                  alt={channel.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <IconComponent className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{channel.name}</h3>
                              <Badge variant="outline">{channel.type}</Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {hasTarget && (
                              <CheckCircle2 className="w-5 h-5 text-success" />
                            )}
                            {!hasTarget && currentTarget === 0 && (
                              <AlertCircle className="w-5 h-5 text-warning" />
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`target-${channel.id}`} className="text-sm font-medium">
                              Meta (R$)
                            </Label>
                            <CurrencyInput
                              id={`target-${channel.id}`}
                              value={targetValues[channel.id] || ''}
                              onValueChange={(value) => handleTargetChange(channel.id, value)}
                              placeholder="R$ 0,00"
                              className="mt-1"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            {currentTarget > 0 && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Meta atual: </span>
                                <span className="font-medium">{formatCurrency(currentTarget)}</span>
                              </div>
                            )}
                            {previousTarget > 0 && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Mês anterior: </span>
                                <span className="font-medium">{formatCurrency(previousTarget)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Total */}
            {activeChannels.length > 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Total das Metas</h3>
                      <p className="text-sm text-muted-foreground">
                        Soma de todas as metas para {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(getTotalTarget())}
                      </p>
                      {getPreviousTotal() > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Anterior: {formatCurrency(getPreviousTotal())}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* History Panel */}
          <div className="lg:col-span-1">
            <TargetHistoryPanel history={history} />
          </div>
        </div>
      </div>
    </div>
  );
}