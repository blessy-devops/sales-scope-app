import React, { useState, useEffect } from 'react';
import { useChannels } from '@/hooks/useChannels';
import { useTargets } from '@/hooks/useTargets';
import { MonthlyTargetData } from '@/types/target';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MonthYearPicker } from '@/components/MonthYearPicker';
import { PageHeader } from '@/components/PageHeader';
import { TargetHistoryPanel } from '@/components/TargetHistoryPanel';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Banknote, Copy, Save, Settings, Target, Store, Globe, ShoppingBag, ChevronRight } from 'lucide-react';

export default function Targets() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [targetValues, setTargetValues] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { channels, loading: channelsLoading } = useChannels();
  const { 
    targets, 
    loading: targetsLoading, 
    getTargetsForMonth, 
    getPreviousMonthTargets,
    saveMonthlyTargets,
    copyFromPreviousMonth,
    getHistoryForMonth,
    getHierarchicalTargets,
    copyFromPreviousMonthHierarchical
  } = useTargets();
  const { toast } = useToast();

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'E-commerce':
        return <Store className="h-5 w-5 text-primary" />;
      case 'Landing Page':
        return <Globe className="h-5 w-5 text-primary" />;
      case 'Marketplace':
        return <ShoppingBag className="h-5 w-5 text-primary" />;
      default:
        return <Store className="h-5 w-5 text-primary" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getCurrentTarget = (channelId: string) => {
    const currentTargets = getTargetsForMonth(selectedDate.getMonth() + 1, selectedDate.getFullYear());
    return currentTargets.find(t => t.channel_id === channelId && !t.sub_channel_id);
  };

  const getPreviousTarget = (channelId: string) => {
    const previousTargets = getPreviousMonthTargets(selectedDate.getMonth() + 1, selectedDate.getFullYear());
    return previousTargets.find(t => t.channel_id === channelId && !t.sub_channel_id);
  };

  const getTotalTarget = () => {
    return Object.values(targetValues).reduce((sum, val) => sum + val, 0);
  };

  const getPreviousTotal = () => {
    const previousTargets = getPreviousMonthTargets(selectedDate.getMonth() + 1, selectedDate.getFullYear());
    return previousTargets.reduce((total, target) => total + target.target_amount, 0);
  };

  const handleTargetChange = (key: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setTargetValues(prev => ({
      ...prev,
      [key]: numValue
    }));
    setHasChanges(true);
  };

  const handleCopyFromPrevious = () => {
    const previousData = copyFromPreviousMonthHierarchical(selectedDate.getMonth() + 1, selectedDate.getFullYear());
    const newValues: Record<string, number> = {};
    
    previousData.forEach(data => {
      const key = data.sub_channel_id ? `${data.channel_id}|${data.sub_channel_id}` : data.channel_id;
      newValues[key] = data.target_amount;
    });
    
    setTargetValues(newValues);
    setHasChanges(true);
    
    toast({
      title: "Metas copiadas",
      description: "As metas do mês anterior foram copiadas com sucesso.",
    });
  };

  const handleSaveTargets = async () => {
    try {
      const targetsData: MonthlyTargetData[] = Object.entries(targetValues).map(([key, amount]) => {
        if (key.includes('|')) {
          // Sub-channel target
          const [channelId, subChannelId] = key.split('|');
          return {
            channel_id: channelId,
            sub_channel_id: subChannelId,
            target_amount: amount,
          };
        } else {
          // Parent channel target
          return {
            channel_id: key,
            target_amount: amount,
          };
        }
      });

      await saveMonthlyTargets(
        selectedDate.getMonth() + 1,
        selectedDate.getFullYear(),
        targetsData
      );

      setHasChanges(false);
      
      toast({
        title: "Metas salvas",
        description: "As metas foram salvas com sucesso.",
      });
    } catch (error) {
      console.error('Error saving targets:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as metas. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Initialize target values when month changes
  useEffect(() => {
    if (!targetsLoading && !channelsLoading) {
      const month = selectedDate.getMonth() + 1;
      const year = selectedDate.getFullYear();
      const hierarchicalData = getHierarchicalTargets(month, year);
      
      const initialValues: Record<string, number> = {};
      
      hierarchicalData.forEach(({ channel, channelTarget, subChannels }) => {
        if (channel.is_active) {
          // Parent channel target
          initialValues[channel.id] = channelTarget?.target_amount || 0;
          
          // Sub-channel targets
          subChannels.forEach(({ subChannel, target }) => {
            const key = `${channel.id}|${subChannel.id}`;
            initialValues[key] = target?.target_amount || 0;
          });
        }
      });
      
      setTargetValues(initialValues);
      setHasChanges(false);
    }
  }, [selectedDate, targetsLoading, channelsLoading, targets, channels]);

  const hierarchicalData = getHierarchicalTargets(selectedDate.getMonth() + 1, selectedDate.getFullYear());
  const activeHierarchicalData = hierarchicalData.filter(data => data.channel.is_active);

  if (channelsLoading || targetsLoading) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Metas de Vendas" 
          description="Defina suas metas mensais de vendas por canal"
        />
        <div className="text-center py-8">Carregando...</div>
      </div>
    );
  }

  if (activeHierarchicalData.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Metas de Vendas" 
          description="Defina suas metas mensais de vendas por canal"
        />
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <Target className="mx-auto h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-medium">Nenhum canal ativo encontrado</h3>
              <p className="text-muted-foreground">
                Você precisa configurar pelo menos um canal ativo antes de definir metas.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Metas de Vendas" 
        description="Defina suas metas mensais de vendas por canal"
      />

      <div className="flex items-center justify-between">
        <MonthYearPicker
          date={selectedDate}
          onDateChange={setSelectedDate}
          className="w-[240px]"
        />
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCopyFromPrevious}
            disabled={getPreviousTotal() === 0}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            Copiar Mês Anterior
          </Button>
          
          <Button
            onClick={handleSaveTargets}
            disabled={!hasChanges || targetsLoading}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Salvar Metas
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Accordion type="multiple" className="space-y-4">
            {activeHierarchicalData.map(({ channel, channelTarget, subChannels }) => {
              const hasSubChannels = subChannels.length > 0;
              const previousTarget = getPreviousTarget(channel.id);
              
              if (!hasSubChannels) {
                // Simple channel without sub-channels (current behavior)
                return (
                  <Card key={channel.id} className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {getChannelIcon(channel.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{channel.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Canal {channel.type}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`target-${channel.id}`} className="text-base font-medium">
                          Meta para {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
                        </Label>
                        <Input
                          id={`target-${channel.id}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={targetValues[channel.id] || 0}
                          onChange={(e) => handleTargetChange(channel.id, e.target.value)}
                          className="mt-2 text-lg"
                          placeholder="0,00"
                        />
                      </div>
                      
                      <div className="flex flex-col justify-end">
                        <div className="text-sm text-muted-foreground mb-2">
                          Meta anterior: {formatCurrency(previousTarget?.target_amount || 0)}
                        </div>
                        <div className="text-lg font-semibold text-primary">
                          {formatCurrency(targetValues[channel.id] || 0)}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              }
              
              // Channel with sub-channels (accordion behavior)
              return (
                <AccordionItem key={channel.id} value={channel.id} className="border rounded-lg">
                  <Card className="border-0">
                    <AccordionTrigger className="p-6 hover:no-underline">
                      <div className="flex items-center gap-4 w-full">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {getChannelIcon(channel.type)}
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="font-semibold text-lg">{channel.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Canal {channel.type} • {subChannels.length} sub-canais
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-primary">
                            {formatCurrency(targetValues[channel.id] || 0)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Meta principal
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    
                    <AccordionContent className="px-6 pb-6">
                      <div className="space-y-4">
                        {/* Parent channel target */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                          <div>
                            <Label htmlFor={`target-${channel.id}`} className="text-base font-medium">
                              Meta Principal - {channel.name}
                            </Label>
                            <Input
                              id={`target-${channel.id}`}
                              type="number"
                              step="0.01"
                              min="0"
                              value={targetValues[channel.id] || 0}
                              onChange={(e) => handleTargetChange(channel.id, e.target.value)}
                              className="mt-2"
                              placeholder="0,00"
                            />
                          </div>
                          <div className="flex flex-col justify-end">
                            <div className="text-sm text-muted-foreground mb-2">
                              Meta anterior: {formatCurrency(previousTarget?.target_amount || 0)}
                            </div>
                          </div>
                        </div>
                        
                        {/* Sub-channels */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                            Sub-Canais
                          </h4>
                          {subChannels.map(({ subChannel, target }) => {
                            const key = `${channel.id}|${subChannel.id}`;
                            return (
                              <div key={subChannel.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                                <div>
                                  <Label htmlFor={`target-${key}`} className="text-base font-medium">
                                    <div className="flex items-center gap-2">
                                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                      {subChannel.name}
                                    </div>
                                  </Label>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {subChannel.utm_source} • {subChannel.utm_medium}
                                  </p>
                                  <Input
                                    id={`target-${key}`}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={targetValues[key] || 0}
                                    onChange={(e) => handleTargetChange(key, e.target.value)}
                                    placeholder="0,00"
                                  />
                                </div>
                                <div className="flex flex-col justify-end">
                                  <div className="text-lg font-medium text-primary">
                                    {formatCurrency(targetValues[key] || 0)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        {/* Summary and History */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Resumo das Metas</h3>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Meta Total ({format(selectedDate, 'MMMM yyyy', { locale: ptBR })}):
                    </span>
                    <span className="font-semibold text-xl text-primary">
                      {formatCurrency(Object.values(targetValues).reduce((sum, val) => sum + val, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Meta Total (mês anterior):</span>
                    <span className="font-medium text-muted-foreground">
                      {formatCurrency(getPreviousTotal())}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <Banknote className="h-8 w-8 text-primary" />
              </div>
            </div>
          </Card>

          {/* History Panel */}
          <TargetHistoryPanel 
            history={getHistoryForMonth(selectedDate.getMonth() + 1, selectedDate.getFullYear())} 
          />
        </div>
      </div>
    </div>
  );
}