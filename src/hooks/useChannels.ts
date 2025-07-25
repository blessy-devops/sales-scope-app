import { useState } from 'react';
import { Channel, CreateChannelData, ChannelType } from '@/types/channel';

// Dados mockados para demonstração
const mockChannels: Channel[] = [
  {
    id: '1',
    name: 'Shopify',
    type: 'E-commerce',
    icon_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=64&h=64&fit=crop&crop=center',
    is_active: true,
  },
  {
    id: '2',
    name: 'Payt',
    type: 'Landing Page',
    icon_url: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=64&h=64&fit=crop&crop=center',
    is_active: true,
  },
  {
    id: '3',
    name: 'B4You',
    type: 'Landing Page',
    icon_url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=64&h=64&fit=crop&crop=center',
    is_active: true,
  },
  {
    id: '4',
    name: 'Mercado Livre',
    type: 'Marketplace',
    icon_url: 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=64&h=64&fit=crop&crop=center',
    is_active: true,
  },
  {
    id: '5',
    name: 'Amazon',
    type: 'Marketplace',
    icon_url: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=64&h=64&fit=crop&crop=center',
    is_active: true,
  },
  {
    id: '6',
    name: 'RD Saúde',
    type: 'Marketplace',
    icon_url: 'https://images.unsplash.com/photo-1482881497185-d4a9ddbe4151?w=64&h=64&fit=crop&crop=center',
    is_active: false,
  },
  {
    id: '7',
    name: 'Shopee',
    type: 'Marketplace',
    icon_url: 'https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=64&h=64&fit=crop&crop=center',
    is_active: true,
  },
  {
    id: '8',
    name: 'Tiktok Shop',
    type: 'Marketplace',
    is_active: true,
  },
];

export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>(mockChannels);
  const [loading, setLoading] = useState(false);

  const createChannel = async (data: CreateChannelData): Promise<Channel> => {
    setLoading(true);
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newChannel: Channel = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    setChannels(prev => [...prev, newChannel]);
    setLoading(false);
    
    return newChannel;
  };

  const updateChannel = async (id: string, data: Partial<CreateChannelData>): Promise<Channel> => {
    setLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const updatedChannel = channels.find(c => c.id === id);
    if (!updatedChannel) throw new Error('Canal não encontrado');
    
    const updated = {
      ...updatedChannel,
      ...data,
      updated_at: new Date().toISOString(),
    };
    
    setChannels(prev => prev.map(c => c.id === id ? updated : c));
    setLoading(false);
    
    return updated;
  };

  const deleteChannel = async (id: string): Promise<void> => {
    setLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setChannels(prev => prev.filter(c => c.id !== id));
    setLoading(false);
  };

  return {
    channels,
    loading,
    createChannel,
    updateChannel,
    deleteChannel,
  };
}