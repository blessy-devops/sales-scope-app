import { useState, useEffect } from 'react';
import { SalesTarget, TargetHistory, MonthlyTargetData, HierarchicalTargetData } from '@/types/target';
import { useChannels } from './useChannels';
import { useSubChannels } from './useSubChannels';
import { supabase } from '@/integrations/supabase/client';

interface UseTargetsOptions {
  startDate?: Date;
  endDate?: Date;
}

export function useTargets(options?: UseTargetsOptions) {
  const { channels } = useChannels();
  const { subChannels } = useSubChannels();
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
    // Filter targets and remove duplicates based on channel_id + sub_channel_id combination
    const monthTargets = targets.filter(t => t.month === month && t.year === year);
    
    // Create a map to ensure uniqueness
    const uniqueTargetsMap = new Map<string, SalesTarget>();
    
    monthTargets.forEach(target => {
      const key = `${target.channel_id}-${target.sub_channel_id || 'null'}`;
      // Keep the most recent one (highest id or created_at)
      const existing = uniqueTargetsMap.get(key);
      if (!existing || (target.created_at && existing.created_at && target.created_at > existing.created_at)) {
        uniqueTargetsMap.set(key, target);
      }
    });
    
    return Array.from(uniqueTargetsMap.values());
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
    console.log('Salvando targets:', { month, year, targetsData });
    
    if (!targetsData.length) {
      console.log('Nenhum target para salvar');
      return;
    }

    try {
      // Simple upsert - the database constraint handles uniqueness
      const targetRecords = targetsData.map(targetData => ({
        channel_id: targetData.channel_id,
        sub_channel_id: targetData.sub_channel_id || null,
        month,
        year,
        target_amount: targetData.target_amount
      }));

      console.log('Inserindo targets:', targetRecords);

      const { error } = await supabase
        .from('sales_targets')
        .upsert(targetRecords, {
          onConflict: 'channel_id,sub_channel_id,month,year'
        });

      if (error) {
        console.error('Erro ao salvar targets:', error);
        throw error;
      }

      console.log('Targets salvos com sucesso');
      await Promise.all([fetchTargets(), fetchHistory()]);
    } catch (error) {
      console.error('Erro ao salvar targets:', error);
      throw error;
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

  const getHierarchicalTargets = (month: number, year: number): HierarchicalTargetData[] => {
    const result: HierarchicalTargetData[] = [];
    
    channels.forEach(channel => {
      // Get parent channel target
      const channelTarget = targets.find(
        t => t.channel_id === channel.id && !t.sub_channel_id && t.month === month && t.year === year
      ) || null;
      
      // Get sub-channels for this parent channel
      const channelSubChannels = subChannels.filter(sc => sc.parent_channel_id === channel.id);
      
      // Get targets for each sub-channel
      const subChannelTargets = channelSubChannels.map(subChannel => ({
        subChannel,
        target: targets.find(
          t => t.sub_channel_id === subChannel.id && t.month === month && t.year === year
        ) || null
      }));
      
      result.push({
        channel,
        channelTarget,
        subChannels: subChannelTargets
      });
    });
    
    return result;
  };

  const copyFromPreviousMonthHierarchical = (month: number, year: number): MonthlyTargetData[] => {
    const previousTargets = getPreviousMonthTargets(month, year);
    const activeChannels = channels.filter(c => c.is_active);
    const result: MonthlyTargetData[] = [];
    
    // Add parent channel targets
    activeChannels.forEach(channel => {
      const prevTarget = previousTargets.find(t => t.channel_id === channel.id && !t.sub_channel_id);
      result.push({
        channel_id: channel.id,
        target_amount: prevTarget?.target_amount || 0,
      });
      
      // Add sub-channel targets
      const channelSubChannels = subChannels.filter(sc => sc.parent_channel_id === channel.id);
      channelSubChannels.forEach(subChannel => {
        const prevSubTarget = previousTargets.find(t => t.sub_channel_id === subChannel.id);
        result.push({
          channel_id: channel.id,
          sub_channel_id: subChannel.id,
          target_amount: prevSubTarget?.target_amount || 0,
        });
      });
    });
    
    return result;
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
    getHierarchicalTargets,
    copyFromPreviousMonthHierarchical,
  };
}