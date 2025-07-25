export interface DailySale {
  id: string;
  channel_id: string;
  sale_date: string; // YYYY-MM-DD format
  amount: number;
  created_at?: string;
  updated_at?: string;
}

export interface DailySaleData {
  channel_id: string;
  amount: number;
}

export interface SalesSummary {
  total: number;
  channels_count: number;
  date: string;
}