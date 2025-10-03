import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TrendingUp } from 'lucide-react';

interface MetricsState {
  acessos: string;
  txConversao: string;
  ticketMedio: string;
  receitaDesejada: string;
  metricaCalcular: 'acessos' | 'txConversao' | 'ticketMedio';
}

export default function SimuladorEcommerce() {
  const [metrics, setMetrics] = useState<MetricsState>({
    acessos: '',
    txConversao: '',
    ticketMedio: '',
    receitaDesejada: '',
    metricaCalcular: 'acessos'
  });

  // Cálculos para Projeção de Receita
  const projecaoVendas = useMemo(() => {
    const acessos = parseFloat(metrics.acessos) || 0;
    const txConversao = parseFloat(metrics.txConversao) || 0;
    return acessos * (txConversao / 100);
  }, [metrics.acessos, metrics.txConversao]);

  const projecaoReceita = useMemo(() => {
    const ticketMedio = parseFloat(metrics.ticketMedio) || 0;
    return projecaoVendas * ticketMedio;
  }, [projecaoVendas, metrics.ticketMedio]);

  // Cálculos para Engenharia Reversa
  const valorCalculado = useMemo(() => {
    const receita = parseFloat(metrics.receitaDesejada) || 0;
    const acessos = parseFloat(metrics.acessos) || 0;
    const txConversao = parseFloat(metrics.txConversao) || 0;
    const ticketMedio = parseFloat(metrics.ticketMedio) || 0;

    if (receita === 0) return 0;

    switch (metrics.metricaCalcular) {
      case 'acessos':
        if (txConversao === 0 || ticketMedio === 0) return 0;
        return receita / (ticketMedio * (txConversao / 100));
      
      case 'txConversao':
        if (acessos === 0 || ticketMedio === 0) return 0;
        return (receita / (acessos * ticketMedio)) * 100;
      
      case 'ticketMedio':
        if (acessos === 0 || txConversao === 0) return 0;
        return receita / (acessos * (txConversao / 100));
      
      default:
        return 0;
    }
  }, [metrics.receitaDesejada, metrics.acessos, metrics.txConversao, metrics.ticketMedio, metrics.metricaCalcular]);

  const handleInputChange = (field: keyof MetricsState, value: string) => {
    setMetrics(prev => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 0) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Simulador de Cenários de E-commerce</h1>
          <p className="text-muted-foreground">Projete receitas ou calcule métricas necessárias para suas metas</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Simulador Estratégico</CardTitle>
          <CardDescription>
            Escolha entre projetar receitas ou fazer engenharia reversa a partir de metas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="projection" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="projection">Projeção de Receita</TabsTrigger>
              <TabsTrigger value="reverse">Engenharia Reversa</TabsTrigger>
            </TabsList>

            {/* Aba: Projeção de Receita */}
            <TabsContent value="projection" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="acessos-proj">Acessos</Label>
                  <Input
                    id="acessos-proj"
                    type="number"
                    placeholder="10000"
                    value={metrics.acessos}
                    onChange={(e) => handleInputChange('acessos', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="txConversao-proj">Taxa de Conversão (%)</Label>
                  <Input
                    id="txConversao-proj"
                    type="number"
                    step="0.01"
                    placeholder="2.5"
                    value={metrics.txConversao}
                    onChange={(e) => handleInputChange('txConversao', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ticketMedio-proj">Ticket Médio (R$)</Label>
                  <Input
                    id="ticketMedio-proj"
                    type="number"
                    step="0.01"
                    placeholder="150.00"
                    value={metrics.ticketMedio}
                    onChange={(e) => handleInputChange('ticketMedio', e.target.value)}
                  />
                </div>
              </div>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg">Resultados da Projeção</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vendas Projetadas</Label>
                    <div className="text-2xl font-bold text-primary">
                      {formatNumber(projecaoVendas, 0)} vendas
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Receita Projetada</Label>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(projecaoReceita)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba: Engenharia Reversa */}
            <TabsContent value="reverse" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="receita-desejada">Receita Desejada (R$)</Label>
                  <Input
                    id="receita-desejada"
                    type="number"
                    step="0.01"
                    placeholder="50000.00"
                    value={metrics.receitaDesejada}
                    onChange={(e) => handleInputChange('receitaDesejada', e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Qual métrica deseja calcular?</Label>
                  <RadioGroup
                    value={metrics.metricaCalcular}
                    onValueChange={(value) => handleInputChange('metricaCalcular', value as any)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="acessos" id="calc-acessos" />
                      <Label htmlFor="calc-acessos" className="font-normal cursor-pointer">
                        Calcular Acessos Necessários
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="txConversao" id="calc-tx" />
                      <Label htmlFor="calc-tx" className="font-normal cursor-pointer">
                        Calcular Taxa de Conversão Necessária
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ticketMedio" id="calc-ticket" />
                      <Label htmlFor="calc-ticket" className="font-normal cursor-pointer">
                        Calcular Ticket Médio Necessário
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="acessos-rev">Acessos</Label>
                    <Input
                      id="acessos-rev"
                      type="number"
                      placeholder="10000"
                      value={metrics.metricaCalcular === 'acessos' ? formatNumber(valorCalculado, 0) : metrics.acessos}
                      onChange={(e) => handleInputChange('acessos', e.target.value)}
                      disabled={metrics.metricaCalcular === 'acessos'}
                      className={metrics.metricaCalcular === 'acessos' ? 'bg-primary/10 font-semibold' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="txConversao-rev">Taxa de Conversão (%)</Label>
                    <Input
                      id="txConversao-rev"
                      type="number"
                      step="0.01"
                      placeholder="2.5"
                      value={metrics.metricaCalcular === 'txConversao' ? formatNumber(valorCalculado, 2) : metrics.txConversao}
                      onChange={(e) => handleInputChange('txConversao', e.target.value)}
                      disabled={metrics.metricaCalcular === 'txConversao'}
                      className={metrics.metricaCalcular === 'txConversao' ? 'bg-primary/10 font-semibold' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ticketMedio-rev">Ticket Médio (R$)</Label>
                    <Input
                      id="ticketMedio-rev"
                      type="number"
                      step="0.01"
                      placeholder="150.00"
                      value={metrics.metricaCalcular === 'ticketMedio' ? formatNumber(valorCalculado, 2) : metrics.ticketMedio}
                      onChange={(e) => handleInputChange('ticketMedio', e.target.value)}
                      disabled={metrics.metricaCalcular === 'ticketMedio'}
                      className={metrics.metricaCalcular === 'ticketMedio' ? 'bg-primary/10 font-semibold' : ''}
                    />
                  </div>
                </div>

                {valorCalculado > 0 && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground mb-2">Valor calculado:</p>
                      <p className="text-2xl font-bold text-primary">
                        {metrics.metricaCalcular === 'acessos' && `${formatNumber(valorCalculado, 0)} acessos necessários`}
                        {metrics.metricaCalcular === 'txConversao' && `${formatNumber(valorCalculado, 2)}% de taxa de conversão`}
                        {metrics.metricaCalcular === 'ticketMedio' && `${formatCurrency(valorCalculado)} de ticket médio`}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
