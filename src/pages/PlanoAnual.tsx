import React, { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAnnualPlan } from '@/hooks/useAnnualPlan';
import { useToast } from '@/hooks/use-toast';
import { AnnualPlanFormData, QuarterlyDistribution } from '@/types/annual-plan';
import { Copy, Save, Download } from 'lucide-react';

interface QuarterlyDistributionState {
  [quarter: number]: {
    revenuePercentage: string;
    marginPercentage: string;
  };
}

export default function PlanoAnual() {
  const { toast } = useToast();
  const {
    saveYearlyTarget,
    saveQuarterlyDistribution,
    getYearlyTarget,
    getQuarterlyDistributionForYear,
    copyFromPreviousYear,
    loading
  } = useAnnualPlan();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear + 1);
  const [formData, setFormData] = useState<AnnualPlanFormData>({
    total_revenue_target: '',
    margin_percentage: '',
    growth_percentage: '',
    use_growth: false,
  });

  const yearlyTarget = getYearlyTarget(selectedYear);
  const quarterlyData = getQuarterlyDistributionForYear(selectedYear);

  // Estado para distribuição trimestral
  const [quarterlyDistribution, setQuarterlyDistribution] = useState<QuarterlyDistributionState>({
    1: { revenuePercentage: '25', marginPercentage: '25' },
    2: { revenuePercentage: '25', marginPercentage: '25' },
    3: { revenuePercentage: '25', marginPercentage: '25' },
    4: { revenuePercentage: '25', marginPercentage: '25' },
  });

  // Sincronizar dados da distribuição trimestral quando disponível
  React.useEffect(() => {
    if (quarterlyData.length > 0) {
      const newDistribution: QuarterlyDistributionState = {};
      quarterlyData.forEach((q) => {
        newDistribution[q.quarter] = {
          revenuePercentage: q.revenue_percentage.toString(),
          marginPercentage: q.margin_percentage.toString(),
        };
      });
      setQuarterlyDistribution(newDistribution);
    }
  }, [quarterlyData]);

  React.useEffect(() => {
    if (yearlyTarget) {
      setFormData({
        total_revenue_target: yearlyTarget.total_revenue_target.toString(),
        margin_percentage: yearlyTarget.margin_percentage.toString(),
        growth_percentage: '',
        use_growth: false,
      });
    } else {
      setFormData({
        total_revenue_target: '',
        margin_percentage: '',
        growth_percentage: '',
        use_growth: false,
      });
    }
  }, [yearlyTarget, selectedYear]);

  const calculateMarginValue = () => {
    const revenue = parseFloat(formData.total_revenue_target) || 0;
    const marginPercentage = parseFloat(formData.margin_percentage) || 0;
    return (revenue * marginPercentage) / 100;
  };

  // Funções para distribuição trimestral
  const updateDistribution = (quarter: number, field: 'revenue' | 'margin', value: string) => {
    setQuarterlyDistribution(prev => ({
      ...prev,
      [quarter]: {
        ...prev[quarter],
        [field === 'revenue' ? 'revenuePercentage' : 'marginPercentage']: value,
      },
    }));
  };

  const calculateQuarterlyRevenue = (quarter: number) => {
    const revenue = parseFloat(formData.total_revenue_target) || 0;
    const percentage = parseFloat(quarterlyDistribution[quarter]?.revenuePercentage) || 0;
    return (revenue * percentage) / 100;
  };

  const calculateQuarterlyMargin = (quarter: number) => {
    const quarterRevenue = calculateQuarterlyRevenue(quarter);
    const marginPercentage = parseFloat(quarterlyDistribution[quarter]?.marginPercentage) || 0;
    return (quarterRevenue * marginPercentage) / 100;
  };

  const getTotalRevenuePercentage = () => {
    return Object.values(quarterlyDistribution).reduce((sum, q) => 
      sum + (parseFloat(q.revenuePercentage) || 0), 0
    );
  };

  const isValidDistribution = () => {
    return Math.abs(getTotalRevenuePercentage() - 100) < 0.01; // Permite pequena diferença por arredondamento
  };

  const distributeEqually = () => {
    setQuarterlyDistribution({
      1: { revenuePercentage: '25', marginPercentage: '25' },
      2: { revenuePercentage: '25', marginPercentage: '25' },
      3: { revenuePercentage: '25', marginPercentage: '25' },
      4: { revenuePercentage: '25', marginPercentage: '25' },
    });
  };

  const getTotalMargin = () => {
    return [1, 2, 3, 4].reduce((sum, quarter) => sum + calculateQuarterlyMargin(quarter), 0);
  };

  const handleSaveQuarterly = async () => {
    try {
      const distributions = Object.entries(quarterlyDistribution).map(([quarter, data]) => ({
        quarter: parseInt(quarter),
        revenue_percentage: parseFloat(data.revenuePercentage) || 0,
        margin_percentage: parseFloat(data.marginPercentage) || 0,
      }));

      await saveQuarterlyDistribution(selectedYear, distributions);

      toast({
        title: "Distribuição salva com sucesso",
        description: `A distribuição trimestral para ${selectedYear} foi salva.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a distribuição trimestral.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    try {
      const revenue = parseFloat(formData.total_revenue_target) || 0;
      const marginPercentage = parseFloat(formData.margin_percentage) || 0;
      const marginValue = calculateMarginValue();

      await saveYearlyTarget(selectedYear, {
        total_revenue_target: revenue,
        total_margin_target: marginValue,
        margin_percentage: marginPercentage,
      });

      toast({
        title: "Metas salvas com sucesso",
        description: `As metas para ${selectedYear} foram salvas.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as metas.",
        variant: "destructive",
      });
    }
  };

  const handleCopyFromPrevious = async () => {
    await copyFromPreviousYear(selectedYear);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear + i);

  return (
    <div className="space-y-6">
      <PageHeader title="Plano Anual" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Label htmlFor="year-select">Ano:</Label>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCopyFromPrevious}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar Ano Anterior
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="metas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metas">Definir Metas</TabsTrigger>
          <TabsTrigger value="setup">Setup Financeiro</TabsTrigger>
          <TabsTrigger value="desdobramento">Desdobramento Mensal</TabsTrigger>
        </TabsList>

        <TabsContent value="metas" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Card 1: Meta de Receita */}
            <Card>
              <CardHeader>
                <CardTitle>Meta de Receita Anual</CardTitle>
                <CardDescription>
                  Defina a meta de receita total para {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="use-growth"
                    checked={formData.use_growth}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, use_growth: checked }))
                    }
                  />
                  <Label htmlFor="use-growth">Usar % de crescimento</Label>
                </div>

                {formData.use_growth ? (
                  <div className="space-y-2">
                    <Label htmlFor="growth">Crescimento sobre ano anterior (%)</Label>
                    <Input
                      id="growth"
                      type="number"
                      placeholder="10"
                      value={formData.growth_percentage}
                      onChange={(e) => 
                        setFormData(prev => ({ ...prev, growth_percentage: e.target.value }))
                      }
                      className="text-lg h-12"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="revenue">Receita Total (R$)</Label>
                    <CurrencyInput
                      id="revenue"
                      value={formData.total_revenue_target}
                      onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, total_revenue_target: value }))
                      }
                      placeholder="R$ 0,00"
                      className="text-lg h-12"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card 2: Margem de Contribuição */}
            <Card>
              <CardHeader>
                <CardTitle>Margem de Contribuição</CardTitle>
                <CardDescription>
                  Defina o percentual de margem esperado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="margin">Margem de Contribuição (%)</Label>
                  <Input
                    id="margin"
                    type="number"
                    placeholder="25"
                    value={formData.margin_percentage}
                    onChange={(e) => 
                      setFormData(prev => ({ ...prev, margin_percentage: e.target.value }))
                    }
                    className="text-lg h-12"
                    step="0.1"
                    min="0"
                    max="100"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Preview dos Resultados */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo das Metas</CardTitle>
                <CardDescription>
                  Valores calculados automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Receita Total:</span>
                    <span className="font-medium">
                      {formatCurrency(parseFloat(formData.total_revenue_target) || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Margem %:</span>
                    <span className="font-medium">
                      {formData.margin_percentage}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-sm font-medium">Margem em R$:</span>
                    <span className="font-bold text-primary">
                      {formatCurrency(calculateMarginValue())}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Distribuição Trimestral</CardTitle>
                <CardDescription>
                  Configure como a receita e margem serão distribuídas ao longo do ano
                </CardDescription>
              </div>
              <Button variant="outline" onClick={distributeEqually}>
                Distribuir Igualmente
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full max-w-4xl mx-auto border-collapse">
                  <thead>
                    <tr className="text-sm border-b-2 border-border">
                      <th className="text-left p-3 font-semibold">Trimestre</th>
                      <th className="text-right p-3 font-semibold">% da Receita Anual</th>
                      <th className="text-right p-3 font-semibold">% Margem do Trimestre</th>
                      <th className="text-right p-3 font-semibold">Receita (R$)</th>
                      <th className="text-right p-3 font-semibold">Margem (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4].map(quarter => (
                      <tr key={quarter} className="border-b border-border hover:bg-muted/50">
                        <td className="p-3 font-medium">Q{quarter}</td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1">
                            <Input
                              type="number"
                              className={`w-20 text-right h-8 ${
                                !isValidDistribution() ? 'border-destructive focus:border-destructive' : ''
                              }`}
                              value={quarterlyDistribution[quarter]?.revenuePercentage || ''}
                              onChange={(e) => updateDistribution(quarter, 'revenue', e.target.value)}
                              min="0"
                              max="100"
                              step="0.1"
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1">
                            <Input
                              type="number"
                              className="w-20 text-right h-8"
                              value={quarterlyDistribution[quarter]?.marginPercentage || ''}
                              onChange={(e) => updateDistribution(quarter, 'margin', e.target.value)}
                              min="0"
                              max="100"
                              step="0.1"
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-medium">
                          {formatCurrency(calculateQuarterlyRevenue(quarter))}
                        </td>
                        <td className="p-3 text-right font-medium">
                          {formatCurrency(calculateQuarterlyMargin(quarter))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="font-bold bg-muted/30">
                    <tr className="border-t-2 border-border">
                      <td className="p-3">Total</td>
                      <td className="p-3 text-right">
                        <span className={`font-bold ${
                          !isValidDistribution() 
                            ? 'text-destructive' 
                            : 'text-foreground'
                        }`}>
                          {getTotalRevenuePercentage().toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3 text-right">-</td>
                      <td className="p-3 text-right">{formatCurrency(parseFloat(formData.total_revenue_target) || 0)}</td>
                      <td className="p-3 text-right">{formatCurrency(getTotalMargin())}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {!isValidDistribution() && (
                <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <span className="text-destructive text-sm font-medium">
                    ⚠️ Atenção: A soma dos percentuais de receita deve ser 100%. 
                    Atual: <strong>{getTotalRevenuePercentage().toFixed(1)}%</strong>
                  </span>
                </div>
              )}

              {isValidDistribution() && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <span className="text-green-600 dark:text-green-400 text-sm">
                    ✅ Distribuição válida: {getTotalRevenuePercentage().toFixed(1)}%
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Os valores são recalculados automaticamente conforme você edita os percentuais.
                </p>
                <Button 
                  onClick={handleSaveQuarterly}
                  disabled={!isValidDistribution()}
                  variant={isValidDistribution() ? "default" : "secondary"}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Distribuição
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="desdobramento">
          <Card>
            <CardHeader>
              <CardTitle>Desdobramento Mensal</CardTitle>
              <CardDescription>
                Distribuição das metas por trimestre e mês
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}