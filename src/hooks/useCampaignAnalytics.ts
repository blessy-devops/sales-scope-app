import { useState, useEffect } from 'react';
import { CampaignAnalyticsData } from '@/types/campaign';
import { supabase } from '@/integrations/supabase/client';

export function useCampaignAnalytics(campaignId?: string) {
  const [analyticsData, setAnalyticsData] = useState<CampaignAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (campaignId) {
      fetchAnalyticsData();
    }
  }, [campaignId]);

  const fetchAnalyticsData = async () => {
    if (!campaignId) return;
    
    try {
      setLoading(true);
      setError(null);

      const { data, error: functionError } = await supabase.functions.invoke('get-campaign-analytics-v2', {
        body: { campaignId }
      });

      if (functionError) {
        throw functionError;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setAnalyticsData(data as CampaignAnalyticsData);
    } catch (err) {
      console.error('Error fetching campaign analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  return {
    analyticsData,
    loading,
    error,
    refetch: fetchAnalyticsData,
  };
}