import { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

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
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold">Calculadora de Receita de E-mail Marketing</h1>
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Coluna da esquerda - Inputs */}
        <div>
          <div className="space-y-2 mb-4">
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

          <div className="space-y-2 mb-4">
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

          <div className="space-y-2 mb-4">
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

          <div className="space-y-2 mb-4">
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

          <div className="space-y-2 mb-4">
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

          <div className="space-y-2 mb-4">
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
          </CardContent>
          <CardFooter className="flex justify-between items-center border-t pt-4">
            <span className="text-2xl font-bold">Receita estimada:</span>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency.format(calculations.receitaEstimada)}
            </span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}