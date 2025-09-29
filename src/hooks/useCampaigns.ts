import { useState, useEffect } from 'react';
import { Campaign, CreateCampaignData, UpdateCampaignData } from '@/types/campaign';
import { supabase } from '@/integrations/supabase/client';

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCampaigns(data as Campaign[] || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async (data: CreateCampaignData): Promise<Campaign> => {
    setLoading(true);
    
    try {
      const { data: response, error } = await supabase.functions.invoke('manage-campaign', {
        body: { action: 'create', ...data }
      });
      
      if (error) throw error;
      
      const newCampaign = response.data as Campaign;
      setCampaigns(prev => [newCampaign, ...prev]);
      return newCampaign;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateCampaign = async (id: string, data: UpdateCampaignData): Promise<Campaign> => {
    setLoading(true);
    
    try {
      const { data: response, error } = await supabase.functions.invoke('manage-campaign', {
        body: { action: 'update', id, ...data }
      });
      
      if (error) throw error;
      
      const updatedCampaign = response.data as Campaign;
      setCampaigns(prev => prev.map(c => c.id === id ? updatedCampaign : c));
      return updatedCampaign;
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteCampaign = async (id: string): Promise<void> => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setCampaigns(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting campaign:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    campaigns,
    loading,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    refetch: fetchCampaigns,
  };
}