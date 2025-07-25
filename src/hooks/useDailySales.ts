import { useState } from 'react';
import { DailySale, DailySaleData, SalesSummary } from '@/types/sale';
import { useChannels } from './useChannels';
import { format, subDays } from 'date-fns';

// Dados mockados para demonstração
const mockSales: DailySale[] = [
  { id: '1', channel_id: '1', sale_date: '2024-12-24', amount: 15000 },
  { id: '2', channel_id: '2', sale_date: '2024-12-24', amount: 8500 },
  { id: '3', channel_id: '4', sale_date: '2024-12-24', amount: 22000 },
  // Dia anterior
  { id: '4', channel_id: '1', sale_date: '2024-12-23', amount: 12000 },
  { id: '5', channel_id: '2', sale_date: '2024-12-23', amount: 7500 },
  { id: '6', channel_id: '4', sale_date: '2024-12-23', amount: 18000 },
  { id: '7', channel_id: '5', sale_date: '2024-12-23', amount: 25000 },
];

export function useDailySales() {
  const { channels } = useChannels();
  const [sales, setSales] = useState<DailySale[]>(mockSales);
  const [loading, setLoading] = useState(false);

  const getSalesForDate = (date: string): DailySale[] => {
    return sales.filter(s => s.sale_date === date);
  };

  const getPreviousDaySales = (date: Date): DailySale[] => {
    const previousDate = format(subDays(date, 1), 'yyyy-MM-dd');
    return sales.filter(s => s.sale_date === previousDate);
  };

  const saveDailySales = async (
    date: string,
    salesData: DailySaleData[]
  ): Promise<void> => {
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
      
      const newSales: DailySale[] = [];
      
      salesData.forEach(data => {
        if (data.amount > 0) { // Só salvar se houver valor
          const existingSale = sales.find(
            s => s.channel_id === data.channel_id && s.sale_date === date
          );
          
          if (existingSale) {
            // Atualizar venda existente
            newSales.push({
              ...existingSale,
              amount: data.amount,
              updated_at: new Date().toISOString(),
            });
          } else {
            // Criar nova venda
            newSales.push({
              id: Math.random().toString(36).substr(2, 9),
              channel_id: data.channel_id,
              sale_date: date,
              amount: data.amount,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }
      });
      
      // Remover vendas da data que não estão mais nos dados (valor zerado)
      const channelIdsWithSales = salesData
        .filter(d => d.amount > 0)
        .map(d => d.channel_id);
      
      setSales(prev => [
        ...prev.filter(s => 
          !(s.sale_date === date && !channelIdsWithSales.includes(s.channel_id))
        ),
        ...prev.filter(s => s.sale_date !== date),
        ...newSales
      ]);
      
    } finally {
      setLoading(false);
    }
  };

  const copyFromPreviousDay = (date: Date): DailySaleData[] => {
    const previousSales = getPreviousDaySales(date);
    const activeChannels = channels.filter(c => c.is_active);
    
    return activeChannels.map(channel => {
      const prevSale = previousSales.find(s => s.channel_id === channel.id);
      return {
        channel_id: channel.id,
        amount: prevSale?.amount || 0,
      };
    });
  };

  const getSalesSummary = (date: string): SalesSummary => {
    const dateSales = getSalesForDate(date);
    return {
      total: dateSales.reduce((sum, sale) => sum + sale.amount, 0),
      channels_count: dateSales.length,
      date,
    };
  };

  const hasSaleForChannel = (channelId: string, date: string): boolean => {
    return sales.some(s => s.channel_id === channelId && s.sale_date === date);
  };

  const getSaleAmount = (channelId: string, date: string): number => {
    const sale = sales.find(s => s.channel_id === channelId && s.sale_date === date);
    return sale?.amount || 0;
  };

  return {
    sales,
    loading,
    getSalesForDate,
    getPreviousDaySales,
    saveDailySales,
    copyFromPreviousDay,
    getSalesSummary,
    hasSaleForChannel,
    getSaleAmount,
  };
}