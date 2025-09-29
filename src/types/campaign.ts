import { z } from 'zod';

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  utm_campaign: string;
  utm_source?: string;
  utm_medium?: string;
  utm_content?: string;
  utm_term?: string;
  goal_revenue?: number;
  goal_sales?: number;
  goal_sessions?: number;
  goal_conversion_rate?: number;
  goal_average_ticket?: number;
  goal_cps?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCampaignData {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  utm_campaign: string;
  utm_source?: string;
  utm_medium?: string;
  utm_content?: string;
  utm_term?: string;
  goal_revenue?: number;
  goal_sales?: number;
  goal_sessions?: number;
  goal_conversion_rate?: number;
  goal_average_ticket?: number;
  goal_cps?: number;
}

export interface UpdateCampaignData extends Partial<CreateCampaignData> {}

export interface CampaignFormData {
  name: string;
  description: string;
  dateRange: {
    from: Date;
    to: Date;
  };
  utm_campaign: string;
  utm_source: string;
  utm_medium: string;
  utm_content: string;
  utm_term: string;
  goal_revenue: string;
  goal_sales: string;
  goal_sessions: string;
  goal_conversion_rate: string;
  goal_average_ticket: string;
  goal_cps: string;
}

// Validation schemas
export const campaignFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  dateRange: z.object({
    from: z.date({ required_error: 'Data de início é obrigatória' }),
    to: z.date({ required_error: 'Data de fim é obrigatória' }),
  }).refine(data => data.to >= data.from, {
    message: 'Data de fim deve ser posterior à data de início',
    path: ['dateRange']
  }),
  utm_campaign: z.string().min(1, 'UTM Campaign é obrigatório').max(100, 'UTM Campaign deve ter no máximo 100 caracteres'),
  utm_source: z.string().max(100, 'UTM Source deve ter no máximo 100 caracteres').optional(),
  utm_medium: z.string().max(100, 'UTM Medium deve ter no máximo 100 caracteres').optional(),
  utm_content: z.string().max(100, 'UTM Content deve ter no máximo 100 caracteres').optional(),
  utm_term: z.string().max(100, 'UTM Term deve ter no máximo 100 caracteres').optional(),
  goal_revenue: z.string().optional(),
  goal_sales: z.string().optional(),
  goal_sessions: z.string().optional(),
  goal_conversion_rate: z.string().optional(),
  goal_average_ticket: z.string().optional(),
  goal_cps: z.string().optional(),
});

export const createCampaignSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  start_date: z.string(),
  end_date: z.string(),
  utm_campaign: z.string().min(1).max(100),
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_content: z.string().max(100).optional(),
  utm_term: z.string().max(100).optional(),
  goal_revenue: z.number().min(0).optional(),
  goal_sales: z.number().int().min(0).optional(),
  goal_sessions: z.number().int().min(0).optional(),
  goal_conversion_rate: z.number().min(0).max(100).optional(),
  goal_average_ticket: z.number().min(0).optional(),
  goal_cps: z.number().min(0).optional(),
});

// Performance data types
export interface CampaignPerformanceData {
  id: string;
  campaign_id: string;
  date: string;
  utm_source?: string;
  sessions: number;
  clicks?: number;
  impressions?: number;
  cost?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePerformanceData {
  campaign_id: string;
  date: string;
  utm_source?: string;
  sessions: number;
  clicks?: number;
  impressions?: number;
  cost?: number;
}

export interface UpdatePerformanceData extends Partial<CreatePerformanceData> {}

export interface PerformanceFormData {
  date: Date;
  utm_source: string;
  sessions: string;
  clicks: string;
  impressions: string;
  cost: string;
}

// Validation schema for performance data
export const performanceFormSchema = z.object({
  date: z.date({ required_error: 'Data é obrigatória' }),
  utm_source: z.string().max(100, 'UTM Source deve ter no máximo 100 caracteres').optional(),
  sessions: z.string().refine(val => !isNaN(Number(val)) && Number(val) >= 0, 'Sessões deve ser um número válido'),
  clicks: z.string().refine(val => val === '' || (!isNaN(Number(val)) && Number(val) >= 0), 'Cliques deve ser um número válido').optional(),
  impressions: z.string().refine(val => val === '' || (!isNaN(Number(val)) && Number(val) >= 0), 'Impressões deve ser um número válido').optional(),
  cost: z.string().refine(val => val === '' || (!isNaN(Number(val)) && Number(val) >= 0), 'Custo deve ser um número válido').optional(),
});