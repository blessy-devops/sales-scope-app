import { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FormState {
  envios: number;
  taxaEntrega: number;
  openRate: number;
  ctor: number;
  taxaConversao: number;
  ticketMedio: number;
}

export default function FerramentasCalculadoraEmail() {
  const [form, setForm] = useState<FormState>({
    envios: 0,
    taxaEntrega: 98,
    openRate: 20,
    ctor: 10,
    taxaConversao: 2,
    ticketMedio: 150,
  });

  const parseNumber = (value: string): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const updateField = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({
      ...prev,
      [field]: parseNumber(e.target.value)
    }));
  };

  const calculations = useMemo(() => {
    const emailsEntregues = Math.round(form.envios * (form.taxaEntrega / 100));
    const emailsAbertos = Math.round(emailsEntregues * (form.openRate / 100));
    const totalCliques = Math.round(emailsAbertos * (form.ctor / 100));
    const totalVendas = Math.round(totalCliques * (form.taxaConversao / 100));
    const receitaEstimada = totalVendas * form.ticketMedio;

    return {
      emailsEntregues,
      emailsAbertos,
      totalCliques,
      totalVendas,
      receitaEstimada,
    };
  }, [form]);

  const formatInt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
  const formatCurrency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div>
      <h1 className="text-3xl font-bold">Calculadora de Receita de E-mail Marketing</h1>
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Coluna da esquerda - Inputs */}
        <div className="space-y-6">
          <div>
            <Label htmlFor="envios" className="text-sm font-medium">
              Envios
            </Label>
            <Input
              id="envios"
              type="number"
              min="0"
              step="1"
              value={form.envios || ''}
              onChange={updateField('envios')}
              placeholder="0"
            />
          </div>

          <div>
            <Label htmlFor="taxaEntrega" className="text-sm font-medium">
              Taxa de Entrega (%)
            </Label>
            <Input
              id="taxaEntrega"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.taxaEntrega || ''}
              onChange={updateField('taxaEntrega')}
              placeholder="98"
            />
          </div>

          <div>
            <Label htmlFor="openRate" className="text-sm font-medium">
              Open Rate (%)
            </Label>
            <Input
              id="openRate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.openRate || ''}
              onChange={updateField('openRate')}
              placeholder="20"
            />
          </div>

          <div>
            <Label htmlFor="ctor" className="text-sm font-medium">
              CTOR (%)
            </Label>
            <Input
              id="ctor"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.ctor || ''}
              onChange={updateField('ctor')}
              placeholder="10"
            />
          </div>

          <div>
            <Label htmlFor="taxaConversao" className="text-sm font-medium">
              Taxa de Conversão (%)
            </Label>
            <Input
              id="taxaConversao"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.taxaConversao || ''}
              onChange={updateField('taxaConversao')}
              placeholder="2"
            />
          </div>

          <div>
            <Label htmlFor="ticketMedio" className="text-sm font-medium">
              Ticket Médio (R$)
            </Label>
            <Input
              id="ticketMedio"
              type="number"
              min="0"
              step="0.01"
              value={form.ticketMedio || ''}
              onChange={updateField('ticketMedio')}
              placeholder="150"
            />
          </div>
        </div>

        {/* Coluna da direita - Resultados */}
        <Card>
          <CardHeader>
            <CardTitle>Resultados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">E-mails entregues:</span>
              <span className="font-medium">{formatInt.format(calculations.emailsEntregues)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">E-mails abertos:</span>
              <span className="font-medium">{formatInt.format(calculations.emailsAbertos)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total de cliques:</span>
              <span className="font-medium">{formatInt.format(calculations.totalCliques)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total de vendas:</span>
              <span className="font-medium">{formatInt.format(calculations.totalVendas)}</span>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between">
                <span className="text-lg font-semibold">Receita estimada:</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency.format(calculations.receitaEstimada)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}