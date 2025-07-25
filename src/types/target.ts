export interface SalesTarget {
  id: string;
  channel_id: string;
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
  target_amount: number;
}