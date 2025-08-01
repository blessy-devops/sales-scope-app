import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { YearlyTarget, QuarterlyDistribution, MonthlyTarget, ChannelDistribution } from '@/types/annual-plan';
import { toast } from '@/hooks/use-toast';

export const useAnnualPlan = () => {
  const [yearlyTargets, setYearlyTargets] = useState<YearlyTarget[]>([]);
  const [quarterlyDistribution, setQuarterlyDistribution] = useState<QuarterlyDistribution[]>([]);
  const [monthlyTargets, setMonthlyTargets] = useState<MonthlyTarget[]>([]);
  const [channelDistribution, setChannelDistribution] = useState<ChannelDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchYearlyTargets(),
        fetchQuarterlyDistribution(),
        fetchMonthlyTargets(),
        fetchChannelDistribution(),
      ]);
    } catch (error) {
      console.error('Error fetching annual plan data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados do plano anual.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchYearlyTargets = async () => {
    const { data, error } = await supabase
      .from('yearly_targets')
      .select('*')
      .order('year', { ascending: false });

    if (error) throw error;
    setYearlyTargets(data || []);
  };

  const fetchQuarterlyDistribution = async () => {
    const { data, error } = await supabase
      .from('quarterly_distribution')
      .select('*')
      .order('year', { ascending: false })
      .order('quarter', { ascending: true });

    if (error) throw error;
    setQuarterlyDistribution(data || []);
  };

  const fetchMonthlyTargets = async () => {
    const { data, error } = await supabase
      .from('monthly_targets')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: true });

    if (error) throw error;
    setMonthlyTargets(data || []);
  };

  const fetchChannelDistribution = async () => {
    const { data, error } = await supabase
      .from('channel_distribution')
      .select('*')
      .order('year', { ascending: false });

    if (error) throw error;
    setChannelDistribution(data || []);
  };

  const saveYearlyTarget = async (year: number, data: Partial<YearlyTarget>) => {
    const { error } = await supabase
      .from('yearly_targets')
      .upsert({
        year,
        ...data,
      });

    if (error) throw error;
    await fetchYearlyTargets();
  };

  const getYearlyTarget = (year: number): YearlyTarget | undefined => {
    return yearlyTargets.find(target => target.year === year);
  };

  const getQuarterlyDistributionForYear = (year: number): QuarterlyDistribution[] => {
    return quarterlyDistribution.filter(q => q.year === year);
  };

  const getMonthlyTargetsForYear = (year: number): MonthlyTarget[] => {
    return monthlyTargets.filter(m => m.year === year);
  };

  const getChannelDistributionForYear = (year: number): ChannelDistribution[] => {
    return channelDistribution.filter(c => c.year === year);
  };

  const copyFromPreviousYear = async (currentYear: number) => {
    const previousYear = currentYear - 1;
    const previousTarget = getYearlyTarget(previousYear);

    if (!previousTarget) {
      toast({
        title: "Dados não encontrados",
        description: `Não foram encontrados dados para o ano ${previousYear}.`,
        variant: "destructive",
      });
      return;
    }

    try {
      await saveYearlyTarget(currentYear, {
        total_revenue_target: previousTarget.total_revenue_target,
        total_margin_target: previousTarget.total_margin_target,
        margin_percentage: previousTarget.margin_percentage,
      });

      toast({
        title: "Dados copiados com sucesso",
        description: `Metas de ${previousYear} foram copiadas para ${currentYear}.`,
      });
    } catch (error) {
      console.error('Error copying from previous year:', error);
      toast({
        title: "Erro ao copiar dados",
        description: "Não foi possível copiar os dados do ano anterior.",
        variant: "destructive",
      });
    }
  };

  return {
    yearlyTargets,
    quarterlyDistribution,
    monthlyTargets,
    channelDistribution,
    loading,
    saveYearlyTarget,
    getYearlyTarget,
    getQuarterlyDistributionForYear,
    getMonthlyTargetsForYear,
    getChannelDistributionForYear,
    copyFromPreviousYear,
    refetch: fetchData,
  };
};