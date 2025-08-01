export type ChannelType = 'E-commerce' | 'Landing Page' | 'Marketplace';

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  icon_url?: string;
  is_active: boolean;
  parent_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateChannelData {
  name: string;
  type: ChannelType;
  icon_url?: string;
  is_active: boolean;
  parent_id?: string;
}