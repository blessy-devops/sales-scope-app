import { useState, useEffect } from 'react';
import { SalesTarget, TargetHistory, MonthlyTargetData } from '@/types/target';
import { useChannels } from './useChannels';
import { supabase } from '@/integrations/supabase/client';

interface UseTargetsOptions {
  startDate?: Date;
  endDate?: Date;
}

export function useTargets(options?: UseTargetsOptions) {
  const { channels } = useChannels();
  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [history, setHistory] = useState<TargetHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const startDate = options?.startDate;
  const endDate = options?.endDate;

  useEffect(() => {
    fetchTargets();
    fetchHistory();
  }, [options?.startDate?.getTime(), options?.endDate?.getTime()]);

  const fetchTargets = async () => {
    try {
      let query = supabase
        .from('sales_targets')
        .select('*');

      // Apply date filtering if dates are provided
      if (startDate && endDate) {
        const startYear = startDate.getFullYear();
        const startMonth = startDate.getMonth() + 1;
        const endYear = endDate.getFullYear();
        const endMonth = endDate.getMonth() + 1;

        if (startYear === endYear) {
          // Same year, filter by month range
          query = query
            .eq('year', startYear)
            .gte('month', startMonth)
            .lte('month', endMonth);
        } else {
          // Multiple years, use OR condition
          query = query.or(
            `and(year.eq.${startYear},month.gte.${startMonth}),` +
            `and(year.eq.${endYear},month.lte.${endMonth})` +
            (endYear - startYear > 1 ? `,and(year.gt.${startYear},year.lt.${endYear})` : '')
          );
        }
      }

      const { data, error } = await query
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      
      if (error) throw error;
      setTargets(data || []);
    } catch (error) {
      console.error('Error fetching targets:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      let query = supabase
        .from('target_history')
        .select('*');

      // Apply date filtering if dates are provided
      if (startDate && endDate) {
        const startYear = startDate.getFullYear();
        const startMonth = startDate.getMonth() + 1;
        const endYear = endDate.getFullYear();
        const endMonth = endDate.getMonth() + 1;

        if (startYear === endYear) {
          // Same year, filter by month range
          query = query
            .eq('year', startYear)
            .gte('month', startMonth)
            .lte('month', endMonth);
        } else {
          // Multiple years, use OR condition
          query = query.or(
            `and(year.eq.${startYear},month.gte.${startMonth}),` +
            `and(year.eq.${endYear},month.lte.${endMonth})` +
            (endYear - startYear > 1 ? `,and(year.gt.${startYear},year.lt.${endYear})` : '')
          );
        }
      }

      const { data, error } = await query
        .order('changed_at', { ascending: false });
      
      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTargetsForMonth = (month: number, year: number): SalesTarget[] => {
    return targets.filter(t => t.month === month && t.year === year);
  };

  const getPreviousMonthTargets = (month: number, year: number): SalesTarget[] => {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    return targets.filter(t => t.month === prevMonth && t.year === prevYear);
  };

  const saveMonthlyTargets = async (
    month: number,
    year: number,
    targetsData: MonthlyTargetData[]
  ): Promise<void> => {
    setLoading(true);
    
    try {
      for (const data of targetsData) {
        const existingTarget = targets.find(
          t => t.channel_id === data.channel_id && t.month === month && t.year === year
        );
        
        if (existingTarget) {
          // Atualizar meta existente
          if (existingTarget.target_amount !== data.target_amount) {
            // Salvar histórico
            await supabase
              .from('target_history')
              .insert({
                channel_id: data.channel_id,
                month,
                year,
                old_amount: existingTarget.target_amount,
                new_amount: data.target_amount,
              });
            
            // Atualizar meta
            await supabase
              .from('sales_targets')
              .update({ 
                target_amount: data.target_amount,
                previous_amount: existingTarget.target_amount 
              })
              .eq('id', existingTarget.id);
          }
        } else if (data.target_amount > 0) {
          // Criar nova meta
          await supabase
            .from('sales_targets')
            .insert({
              channel_id: data.channel_id,
              month,
              year,
              target_amount: data.target_amount,
            });
          
          // Salvar histórico
          await supabase
            .from('target_history')
            .insert({
              channel_id: data.channel_id,
              month,
              year,
              old_amount: 0,
              new_amount: data.target_amount,
            });
        }
      }
      
      // Recarregar dados
      await fetchTargets();
      await fetchHistory();
      
    } catch (error) {
      console.error('Error saving targets:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const copyFromPreviousMonth = (month: number, year: number): MonthlyTargetData[] => {
    const previousTargets = getPreviousMonthTargets(month, year);
    const activeChannels = channels.filter(c => c.is_active);
    
    return activeChannels.map(channel => {
      const prevTarget = previousTargets.find(t => t.channel_id === channel.id);
      return {
        channel_id: channel.id,
        target_amount: prevTarget?.target_amount || 0,
      };
    });
  };

  const getHistoryForMonth = (month: number, year: number): TargetHistory[] => {
    return history.filter(h => h.month === month && h.year === year);
  };

  return {
    targets,
    history,
    loading,
    getTargetsForMonth,
    getPreviousMonthTargets,
    saveMonthlyTargets,
    copyFromPreviousMonth,
    getHistoryForMonth,
  };
}