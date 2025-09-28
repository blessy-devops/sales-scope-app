export interface SalesTarget {
  id: string;
  channel_id: string;
  sub_channel_id?: string;
  month: number;
  year: number;
  target_amount: number;
  created_at?: string;
  updated_at?: string;
  previous_amount?: number; // Para histórico
}

export interface TargetHistory {
  id: string;
  channel_id: string;
  month: number;
  year: number;
  old_amount: number;
  new_amount: number;
  changed_at: string;
  changed_by?: string;
}

export interface MonthlyTargetData {
  channel_id: string;
  sub_channel_id?: string;
  target_amount: number;
}

export interface HierarchicalTargetData {
  channel: {
    id: string;
    name: string;
    type: string;
    is_active: boolean;
  };
  channelTarget: SalesTarget | null;
  subChannels: {
    subChannel: {
      id: string;
      name: string;
      utm_source: string;
      utm_medium: string;
    };
    target: SalesTarget | null;
  }[];
}