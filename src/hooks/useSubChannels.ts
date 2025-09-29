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
      setSubChannels((data || []) as SubChannel[]);
    } catch (error) {
      console.error('Error fetching sub-channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSubChannel = async (data: CreateSubChannelData): Promise<SubChannel> => {
    if (!parentChannelId) throw new Error('Parent channel ID is required');

    // Server-side validation via edge function
    const { data: validation, error: validationError } = await supabase.functions.invoke(
      'validate-subchannel-overlap',
      {
        body: {
          utm_source: data.utm_source,
          utm_medium: data.utm_medium,
          utm_medium_matching_type: data.utm_medium_matching_type,
          parent_channel_id: parentChannelId
        }
      }
    );

    if (validationError) {
      console.error('Validation error:', validationError);
      throw new Error('Erro na validação do sub-canal');
    }

    if (validation?.conflictType === 'error') {
      throw new Error(`Conflito detectado: ${validation.message}`);
    }

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
    // Server-side validation via edge function (excluding current sub-channel)
    if (data.utm_source || data.utm_medium || data.utm_medium_matching_type) {
      const currentSubChannel = subChannels.find(sc => sc.id === id);
      if (!currentSubChannel) throw new Error('Sub-canal não encontrado');

      const validationData = {
        utm_source: data.utm_source || currentSubChannel.utm_source,
        utm_medium: data.utm_medium || currentSubChannel.utm_medium,
        utm_medium_matching_type: data.utm_medium_matching_type || currentSubChannel.utm_medium_matching_type,
        parent_channel_id: parentChannelId || currentSubChannel.parent_channel_id,
        exclude_sub_channel_id: id
      };

      const { data: validation, error: validationError } = await supabase.functions.invoke(
        'validate-subchannel-overlap',
        { body: validationData }
      );

      if (validationError) {
        console.error('Validation error:', validationError);
        throw new Error('Erro na validação do sub-canal');
      }

      if (validation?.conflictType === 'error') {
        throw new Error(`Conflito detectado: ${validation.message}`);
      }
    }

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