import { useState, useEffect } from 'react';
import { DailySale, DailySaleData, SalesSummary } from '@/types/sale';
import { useChannels } from './useChannels';
import { format, subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export function useDailySales() {
  const { channels } = useChannels();
  const [sales, setSales] = useState<DailySale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_sales')
        .select('*')
        .order('sale_date', { ascending: false });
      
      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

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
      // Primeiro, deletar vendas da data para recriá-las
      await supabase
        .from('daily_sales')
        .delete()
        .eq('sale_date', date);
      
      // Inserir apenas vendas com valor > 0
      const salesToInsert = salesData
        .filter(data => data.amount > 0)
        .map(data => ({
          channel_id: data.channel_id,
          sale_date: date,
          amount: data.amount,
        }));
      
      if (salesToInsert.length > 0) {
        const { error } = await supabase
          .from('daily_sales')
          .insert(salesToInsert);
        
        if (error) throw error;
      }
      
      // Recarregar dados
      await fetchSales();
      
    } catch (error) {
      console.error('Error saving sales:', error);
      throw error;
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