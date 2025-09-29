import { useState, useEffect } from 'react';
import { CampaignPerformanceData, CreatePerformanceData, UpdatePerformanceData } from '@/types/campaign';
import { supabase } from '@/integrations/supabase/client';

export function useCampaignPerformance(campaignId?: string) {
  const [performanceData, setPerformanceData] = useState<CampaignPerformanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (campaignId) {
      fetchPerformanceData();
    }
  }, [campaignId]);

  const fetchPerformanceData = async () => {
    if (!campaignId) return;
    
    try {
      const { data, error } = await supabase
        .from('campaign_performance_data')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      setPerformanceData(data as CampaignPerformanceData[] || []);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPerformanceData = async (data: CreatePerformanceData): Promise<CampaignPerformanceData> => {
    setLoading(true);
    
    try {
      const { data: response, error } = await supabase
        .from('campaign_performance_data')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      
      const newData = response as CampaignPerformanceData;
      setPerformanceData(prev => [newData, ...prev]);
      return newData;
    } catch (error) {
      console.error('Error creating performance data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updatePerformanceData = async (id: string, data: UpdatePerformanceData): Promise<CampaignPerformanceData> => {
    setLoading(true);
    
    try {
      const { data: response, error } = await supabase
        .from('campaign_performance_data')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      const updatedData = response as CampaignPerformanceData;
      setPerformanceData(prev => prev.map(item => item.id === id ? updatedData : item));
      return updatedData;
    } catch (error) {
      console.error('Error updating performance data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deletePerformanceData = async (id: string): Promise<void> => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('campaign_performance_data')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setPerformanceData(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting performance data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    performanceData,
    loading,
    createPerformanceData,
    updatePerformanceData,
    deletePerformanceData,
    refetch: fetchPerformanceData,
  };
}