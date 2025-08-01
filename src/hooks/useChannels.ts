import { useState, useEffect } from 'react';
import { Channel, CreateChannelData } from '@/types/channel';
import { ChannelHierarchy } from '@/types/annual-plan';
import { supabase } from '@/integrations/supabase/client';

export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setChannels(data as Channel[] || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const createChannel = async (data: CreateChannelData): Promise<Channel> => {
    setLoading(true);
    
    try {
      const { data: newChannel, error } = await supabase
        .from('channels')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      
      setChannels(prev => [...prev, newChannel as Channel]);
      return newChannel as Channel;
    } catch (error) {
      console.error('Error creating channel:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateChannel = async (id: string, data: Partial<CreateChannelData>): Promise<Channel> => {
    setLoading(true);
    
    try {
      const { data: updated, error } = await supabase
        .from('channels')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      setChannels(prev => prev.map(c => c.id === id ? updated as Channel : c));
      return updated as Channel;
    } catch (error) {
      console.error('Error updating channel:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteChannel = async (id: string): Promise<void> => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setChannels(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting channel:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const buildChannelHierarchy = (channels: Channel[]): ChannelHierarchy[] => {
    const channelMap = new Map<string, ChannelHierarchy>();
    const rootChannels: ChannelHierarchy[] = [];

    // Primeiro, criar todos os nós
    channels.forEach(channel => {
      channelMap.set(channel.id, {
        id: channel.id,
        name: channel.name,
        parent_id: channel.parent_id,
        children: [],
        level: 0,
        is_expanded: true
      });
    });

    // Depois, construir a hierarquia
    channels.forEach(channel => {
      const node = channelMap.get(channel.id)!;
      
      if (channel.parent_id) {
        const parent = channelMap.get(channel.parent_id);
        if (parent) {
          parent.children.push(node);
          node.level = parent.level + 1;
        }
      } else {
        rootChannels.push(node);
      }
    });

    return rootChannels;
  };

  const getChannelHierarchy = (): ChannelHierarchy[] => {
    return buildChannelHierarchy(channels);
  };

  return {
    channels,
    loading,
    createChannel,
    updateChannel,
    deleteChannel,
    getChannelHierarchy,
  };
}