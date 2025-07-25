import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserPreference {
  id: string;
  user_id: string | null;
  preference_key: string;
  preference_value: any;
  created_at: string;
  updated_at: string;
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*');
      
      if (error) throw error;
      
      const preferencesMap = (data || []).reduce((acc, pref) => {
        acc[pref.preference_key] = pref.preference_value;
        return acc;
      }, {} as Record<string, any>);
      
      setPreferences(preferencesMap);
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const setPreference = async (key: string, value: any) => {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          preference_key: key,
          preference_value: value,
          user_id: null // Por enquanto null até implementar auth
        });
      
      if (error) throw error;
      
      setPreferences(prev => ({
        ...prev,
        [key]: value
      }));
    } catch (error) {
      console.error('Error setting preference:', error);
      throw error;
    }
  };

  const getPreference = (key: string, defaultValue?: any) => {
    return preferences[key] ?? defaultValue;
  };

  return {
    preferences,
    loading,
    setPreference,
    getPreference,
  };
}