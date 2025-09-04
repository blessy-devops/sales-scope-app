import { useState, useEffect } from 'react';
import { DailySale, DailySaleData, SalesSummary } from '@/types/sale';
import { useChannels } from './useChannels';
import { format, subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface UseDailySalesOptions {
  startDate?: Date;
  endDate?: Date;
}

export function useDailySales(options?: UseDailySalesOptions) {
  const { channels } = useChannels();
  const [sales, setSales] = useState<DailySale[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const startDate = options?.startDate;
  const endDate = options?.endDate;

  useEffect(() => {
    fetchSales();
  }, [options?.startDate?.getTime(), options?.endDate?.getTime()]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSales();
    }, 300000); // 5 minutes in milliseconds

    return () => clearInterval(interval);
  }, []);

  const fetchSales = async () => {
    try {
      // Use provided dates or default to last 6 months
      const queryEndDate = endDate || new Date();
      const queryStartDate = startDate || (() => {
        const defaultStart = new Date();
        defaultStart.setMonth(defaultStart.getMonth() - 6);
        return defaultStart;
      })();
      
      const { data, error } = await supabase.rpc('get_dashboard_sales', {
        start_date: format(queryStartDate, 'yyyy-MM-dd'),
        end_date: format(queryEndDate, 'yyyy-MM-dd')
      });
      
      if (error) throw error;
      
      // Transform RPC result to match DailySale structure
      const transformedSales = (data || []).map(row => ({
        id: `${row.channel_id}-${row.sale_date}`, // Generate consistent ID
        channel_id: row.channel_id,
        sale_date: row.sale_date,
        amount: row.amount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      setSales(transformedSales);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const refetchSales = () => {
    fetchSales();
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
    lastUpdated,
    refetchSales,
    getSalesForDate,
    getPreviousDaySales,
    saveDailySales,
    copyFromPreviousDay,
    getSalesSummary,
    hasSaleForChannel,
    getSaleAmount,
  };
}