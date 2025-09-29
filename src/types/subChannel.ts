export interface SubChannel {
  id: string;
  parent_channel_id: string;
  name: string;
  utm_source: string;
  utm_medium: string;
  utm_medium_matching_type: 'exact' | 'contains';
  created_at: string;
}

export interface CreateSubChannelData {
  name: string;
  utm_source: string;
  utm_medium: string;
  utm_medium_matching_type?: 'exact' | 'contains';
}