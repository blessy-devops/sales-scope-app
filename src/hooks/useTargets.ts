import { useState } from 'react';
import { SalesTarget, TargetHistory, MonthlyTargetData } from '@/types/target';
import { useChannels } from './useChannels';

// Dados mockados para demonstração
const mockTargets: SalesTarget[] = [
  { id: '1', channel_id: '1', month: 12, year: 2024, target_amount: 50000 },
  { id: '2', channel_id: '2', month: 12, year: 2024, target_amount: 25000 },
  { id: '3', channel_id: '4', month: 12, year: 2024, target_amount: 75000 },
  { id: '4', channel_id: '5', month: 12, year: 2024, target_amount: 100000 },
  // Mês anterior
  { id: '5', channel_id: '1', month: 11, year: 2024, target_amount: 45000 },
  { id: '6', channel_id: '2', month: 11, year: 2024, target_amount: 22000 },
  { id: '7', channel_id: '4', month: 11, year: 2024, target_amount: 70000 },
];

const mockHistory: TargetHistory[] = [
  {
    id: '1',
    channel_id: '1',
    month: 12,
    year: 2024,
    old_amount: 45000,
    new_amount: 50000,
    changed_at: '2024-12-01T10:30:00Z',
  },
  {
    id: '2',
    channel_id: '4',
    month: 12,
    year: 2024,
    old_amount: 70000,
    new_amount: 75000,
    changed_at: '2024-12-02T14:15:00Z',
  },
];

export function useTargets() {
  const { channels } = useChannels();
  const [targets, setTargets] = useState<SalesTarget[]>(mockTargets);
  const [history, setHistory] = useState<TargetHistory[]>(mockHistory);
  const [loading, setLoading] = useState(false);

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
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
      
      const newTargets: SalesTarget[] = [];
      const newHistory: TargetHistory[] = [];
      
      targetsData.forEach(data => {
        const existingTarget = targets.find(
          t => t.channel_id === data.channel_id && t.month === month && t.year === year
        );
        
        if (existingTarget) {
          // Atualizar meta existente
          if (existingTarget.target_amount !== data.target_amount) {
            newHistory.push({
              id: Math.random().toString(36).substr(2, 9),
              channel_id: data.channel_id,
              month,
              year,
              old_amount: existingTarget.target_amount,
              new_amount: data.target_amount,
              changed_at: new Date().toISOString(),
            });
          }
          
          newTargets.push({
            ...existingTarget,
            target_amount: data.target_amount,
            updated_at: new Date().toISOString(),
          });
        } else {
          // Criar nova meta
          const newTarget: SalesTarget = {
            id: Math.random().toString(36).substr(2, 9),
            channel_id: data.channel_id,
            month,
            year,
            target_amount: data.target_amount,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          newTargets.push(newTarget);
          
          if (data.target_amount > 0) {
            newHistory.push({
              id: Math.random().toString(36).substr(2, 9),
              channel_id: data.channel_id,
              month,
              year,
              old_amount: 0,
              new_amount: data.target_amount,
              changed_at: new Date().toISOString(),
            });
          }
        }
      });
      
      // Atualizar estado
      setTargets(prev => [
        ...prev.filter(t => !(t.month === month && t.year === year)),
        ...newTargets
      ]);
      
      setHistory(prev => [...prev, ...newHistory]);
      
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