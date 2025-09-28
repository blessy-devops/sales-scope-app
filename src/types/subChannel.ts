export interface SubChannel {
  id: string;
  parent_channel_id: string;
  name: string;
  utm_source: string;
  utm_medium: string;
  created_at: string;
}

export interface CreateSubChannelData {
  name: string;
  utm_source: string;
  utm_medium: string;
}