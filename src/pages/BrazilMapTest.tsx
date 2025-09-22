// src/pages/BrazilMapTest.tsx
import React from 'react';
import { BrazilMapChart } from '@/components/ecommerce/BrazilMapChart';

const BrazilMapTest: React.FC = () => {
  // Dados mockados para teste
  const mockStatesData = [
    { state: 'SP', name: 'São Paulo', sales: 125000, percentage: 35.2 },
    { state: 'RJ', name: 'Rio de Janeiro', sales: 85000, percentage: 23.9 },
    { state: 'MG', name: 'Minas Gerais', sales: 65000, percentage: 18.3 },
    { state: 'RS', name: 'Rio Grande do Sul', sales: 45000, percentage: 12.7 },
    { state: 'PR', name: 'Paraná', sales: 35000, percentage: 9.9 },
    { state: 'SC', name: 'Santa Catarina', sales: 28000, percentage: 7.9 },
    { state: 'BA', name: 'Bahia', sales: 22000, percentage: 6.2 },
    { state: 'GO', name: 'Goiás', sales: 18000, percentage: 5.1 },
    { state: 'PE', name: 'Pernambuco', sales: 15000, percentage: 4.2 },
    { state: 'CE', name: 'Ceará', sales: 12000, percentage: 3.4 },
    { state: 'DF', name: 'Distrito Federal', sales: 10000, percentage: 2.8 },
    { state: 'ES', name: 'Espírito Santo', sales: 8000, percentage: 2.3 },
    { state: 'MT', name: 'Mato Grosso', sales: 6000, percentage: 1.7 },
    { state: 'MS', name: 'Mato Grosso do Sul', sales: 5000, percentage: 1.4 },
    { state: 'AL', name: 'Alagoas', sales: 4000, percentage: 1.1 },
    { state: 'PB', name: 'Paraíba', sales: 3500, percentage: 1.0 },
    { state: 'RN', name: 'Rio Grande do Norte', sales: 3000, percentage: 0.8 },
    { state: 'PI', name: 'Piauí', sales: 2500, percentage: 0.7 },
    { state: 'SE', name: 'Sergipe', sales: 2000, percentage: 0.6 },
    { state: 'TO', name: 'Tocantins', sales: 1500, percentage: 0.4 },
    { state: 'AC', name: 'Acre', sales: 1000, percentage: 0.3 },
    { state: 'AP', name: 'Amapá', sales: 800, percentage: 0.2 },
    { state: 'AM', name: 'Amazonas', sales: 600, percentage: 0.2 },
    { state: 'RO', name: 'Rondônia', sales: 400, percentage: 0.1 },
    { state: 'RR', name: 'Roraima', sales: 200, percentage: 0.1 },
    { state: 'MA', name: 'Maranhão', sales: 100, percentage: 0.0 },
    { state: 'PA', name: 'Pará', sales: 50, percentage: 0.0 }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">️ Teste do Mapa do Brasil</h1>
          <p className="text-muted-foreground">
            Mapa interativo com intensidade de cores baseada em vendas
          </p>
        </div>
        
        <BrazilMapChart data={mockStatesData} />
        
        <div className="text-center text-sm text-muted-foreground">
          <p>Passe o mouse sobre os estados para ver detalhes</p>
        </div>
      </div>
    </div>
  );
};

export default BrazilMapTest;