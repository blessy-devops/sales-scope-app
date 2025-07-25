import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/DatePicker';
import { SaveSalesConfirmation } from '@/components/SaveSalesConfirmation';
import { useChannels } from '@/hooks/useChannels';
import { useDailySales } from '@/hooks/useDailySales';
import { useToast } from '@/hooks/use-toast';
import { DailySaleData } from '@/types/sale';
import { 
  TrendingUp, 
  Copy, 
  Save, 
  Store, 
  Globe, 
  ShoppingBag,
  Loader2,
  CheckCircle2,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Sales() {
  const { channels } = useChannels();
  const { 
    getSalesForDate,
    saveDailySales, 
    copyFromPreviousDay,
    getSalesSummary,
    hasSaleForChannel,
    getSaleAmount,
    loading 
  } = useDailySales();
  const { toast } = useToast();

  // Default para ontem
  const [selectedDate, setSelectedDate] = useState(() => subDays(new Date(), 1));
  const [saleValues, setSaleValues] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const activeChannels = channels.filter(c => c.is_active);
  const currentSales = getSalesForDate(dateStr);
  const summary = getSalesSummary(dateStr);

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

  const getCurrentSaleAmount = (channelId: string) => {
    return getSaleAmount(channelId, dateStr);
  };

  // Carregar valores iniciais quando a data muda
  useEffect(() => {
    const initialValues: Record<string, string> = {};
    activeChannels.forEach(channel => {
      const currentAmount = getCurrentSaleAmount(channel.id);
      initialValues[channel.id] = currentAmount > 0 ? currentAmount.toString() : '';
    });
    setSaleValues(initialValues);
    setHasChanges(false);
  }, [dateStr, activeChannels.length]);

  const handleSaleChange = (channelId: string, value: string) => {
    // Permitir apenas números e vírgula/ponto decimal
    const sanitizedValue = value.replace(/[^\d.,]/g, '').replace(',', '.');
    setSaleValues(prev => ({ ...prev, [channelId]: sanitizedValue }));
    setHasChanges(true);
  };

  const handleCopyFromPrevious = () => {
    const previousData = copyFromPreviousDay(selectedDate);
    const newValues: Record<string, string> = {};
    
    previousData.forEach(data => {
      newValues[data.channel_id] = data.amount > 0 ? data.amount.toString() : '';
    });
    
    setSaleValues(newValues);
    setHasChanges(true);
    
    toast({
      title: "Vendas copiadas",
      description: `Valores do dia anterior foram aplicados.`,
    });
  };

  const handleSaveSales = () => {
    const salesData: DailySaleData[] = activeChannels.map(channel => ({
      channel_id: channel.id,
      amount: parseFloat(saleValues[channel.id] || '0') || 0,
    }));

    // Verificar se há pelo menos uma venda
    const hasAnySales = salesData.some(s => s.amount > 0);
    if (!hasAnySales) {
      toast({
        title: "Nenhuma venda informada",
        description: "Informe pelo menos um valor de venda.",
        variant: "destructive",
      });
      return;
    }

    setShowConfirmation(true);
  };

  const confirmSaveSales = async () => {
    try {
      const salesData: DailySaleData[] = activeChannels.map(channel => ({
        channel_id: channel.id,
        amount: parseFloat(saleValues[channel.id] || '0') || 0,
      }));

      await saveDailySales(dateStr, salesData);
      setHasChanges(false);
      setShowConfirmation(false);
      
      toast({
        title: "Vendas salvas",
        description: `Vendas de ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} foram salvas com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar as vendas.",
        variant: "destructive",
      });
    }
  };

  const getCurrentTotal = () => {
    return activeChannels.reduce((total, channel) => {
      const value = parseFloat(saleValues[channel.id] || '0') || 0;
      return total + value;
    }, 0);
  };

  const hasSaleForChannelOnDate = (channelId: string) => {
    return hasSaleForChannel(channelId, dateStr);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-primary" />
              Lançar Vendas Diárias
            </h1>
            <p className="text-muted-foreground mt-1">
              Registre as vendas diárias de cada canal
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <DatePicker
              date={selectedDate}
              onDateChange={setSelectedDate}
              placeholder="Selecionar data"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCopyFromPrevious}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Copiar Dia Anterior
              </Button>
              <Button
                onClick={handleSaveSales}
                disabled={!hasChanges || loading}
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Salvar Vendas
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sales Form */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Vendas de {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {activeChannels.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum canal ativo</h3>
                    <p className="text-muted-foreground">
                      Ative pelo menos um canal para lançar vendas.
                    </p>
                  </div>
                ) : (
                  activeChannels.map((channel) => {
                    const IconComponent = getChannelIcon(channel.type);
                    const currentAmount = getCurrentSaleAmount(channel.id);
                    const hasSale = hasSaleForChannelOnDate(channel.id);
                    const isEditing = currentAmount > 0;
                    
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
                            {hasSale && (
                              <Badge variant="default" className="gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {isEditing ? 'Editando' : 'Lançado'}
                              </Badge>
                            )}
                            {!hasSale && currentAmount === 0 && (
                              <Badge variant="outline" className="gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Pendente
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`sale-${channel.id}`} className="text-sm font-medium">
                              Valor da Venda (R$)
                            </Label>
                            <Input
                              id={`sale-${channel.id}`}
                              type="text"
                              placeholder="0,00"
                              value={saleValues[channel.id] || ''}
                              onChange={(e) => handleSaleChange(channel.id, e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            {currentAmount > 0 && !hasChanges && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Valor atual: </span>
                                <span className="font-medium">{formatCurrency(currentAmount)}</span>
                              </div>
                            )}
                            {hasSale && (
                              <div className="text-xs text-muted-foreground">
                                Venda já lançada - você pode editar o valor
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
          </div>

          {/* Summary Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Resumo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Atual</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(getCurrentTotal())}
                  </p>
                </div>
                
                {summary.total > 0 && !hasChanges && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Salvo</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(summary.total)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {summary.channels_count} {summary.channels_count === 1 ? 'canal' : 'canais'} com vendas
                    </p>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  <p>Data selecionada:</p>
                  <p className="font-medium text-foreground">
                    {format(selectedDate, "dd/MM/yyyy")}
                  </p>
                </div>
              </CardContent>
            </Card>

            {hasChanges && (
              <Card className="border-warning/20 bg-warning/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-warning-foreground">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Alterações não salvas</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Lembre-se de salvar suas alterações
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        <SaveSalesConfirmation
          open={showConfirmation}
          onOpenChange={setShowConfirmation}
          onConfirm={confirmSaveSales}
          date={selectedDate}
          salesData={activeChannels.map(channel => ({
            channel_id: channel.id,
            amount: parseFloat(saleValues[channel.id] || '0') || 0,
          }))}
          loading={loading}
        />
      </div>
    </div>
  );
}