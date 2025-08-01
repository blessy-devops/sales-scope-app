export interface YearlyTarget {
  id: string;
  year: number;
  total_revenue_target: number;
  total_margin_target: number;
  margin_percentage: number;
  created_at?: string;
  updated_at?: string;
}

export interface QuarterlyDistribution {
  id: string;
  year: number;
  quarter: number;
  revenue_percentage: number;
  margin_percentage: number;
  created_at?: string;
}

export interface MonthlyTarget {
  id: string;
  year: number;
  month: number;
  quarter: number;
  channel_id: string;
  revenue_target: number;
  margin_target: number;
  created_at?: string;
}

export interface ChannelDistribution {
  id: string;
  year: number;
  channel_id: string;
  parent_channel_id?: string;
  percentage: number;
  is_subchannel: boolean;
  created_at?: string;
}

export interface AnnualPlanFormData {
  total_revenue_target: string;
  margin_percentage: string;
  growth_percentage?: string;
  use_growth: boolean;
}

export interface MonthlyChannelDistribution {
  channel_id: string;
  month: number;
  percentage: number;
  revenue_target: number;
  margin_target: number;
}

export interface ChannelHierarchy {
  id: string;
  name: string;
  parent_id?: string;
  children: ChannelHierarchy[];
  level: number;
  is_expanded: boolean;
}