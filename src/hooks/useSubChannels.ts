import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SubChannel, CreateSubChannelData } from '@/types/subChannel';

export function useSubChannels(parentChannelId?: string) {
  const [subChannels, setSubChannels] = useState<SubChannel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubChannels();
  }, [parentChannelId]);

  const fetchSubChannels = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('sub_channels')
        .select('*');
      
      // If parentChannelId is provided, filter by it; otherwise get all sub-channels
      if (parentChannelId) {
        query = query.eq('parent_channel_id', parentChannelId);
      }
      
      const { data, error } = await query.order('name');

      if (error) throw error;
      setSubChannels(data || []);
    } catch (error) {
      console.error('Error fetching sub-channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSubChannel = async (data: CreateSubChannelData): Promise<SubChannel> => {
    if (!parentChannelId) throw new Error('Parent channel ID is required');

    const { data: newSubChannel, error } = await supabase
      .from('sub_channels')
      .insert({
        parent_channel_id: parentChannelId,
        ...data,
      })
      .select()
      .single();

    if (error) throw error;

    const createdSubChannel = newSubChannel as SubChannel;
    setSubChannels(prev => [...prev, createdSubChannel]);
    return createdSubChannel;
  };

  const updateSubChannel = async (id: string, data: Partial<CreateSubChannelData>): Promise<SubChannel> => {
    const { data: updatedSubChannel, error } = await supabase
      .from('sub_channels')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const updated = updatedSubChannel as SubChannel;
    setSubChannels(prev => 
      prev.map(subChannel => 
        subChannel.id === id ? updated : subChannel
      )
    );
    return updated;
  };

  const deleteSubChannel = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('sub_channels')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setSubChannels(prev => prev.filter(subChannel => subChannel.id !== id));
  };

  return {
    subChannels,
    loading,
    fetchSubChannels,
    createSubChannel,
    updateSubChannel,
    deleteSubChannel,
  };
}