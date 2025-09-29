import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { PeriodRangePicker } from '@/components/PeriodRangePicker';
import { Campaign, CampaignFormData, CreateCampaignData, campaignFormSchema } from '@/types/campaign';
import { formatDateLocal } from '@/lib/utils';

interface CampaignFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateCampaignData) => Promise<void>;
  campaign?: Campaign | null;
  loading?: boolean;
}

export function CampaignFormDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  campaign, 
  loading = false 
}: CampaignFormDialogProps) {
  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: '',
      description: '',
      dateRange: {
        from: new Date(),
        to: new Date(),
      },
      utm_campaign: '',
      utm_source: '',
      utm_medium: '',
      utm_content: '',
      utm_term: '',
      goal_revenue: '',
      goal_sales: '',
      goal_sessions: '',
      goal_conversion_rate: '',
      goal_average_ticket: '',
      goal_cps: '',
    },
  });

  useEffect(() => {
    if (campaign) {
      form.reset({
        name: campaign.name,
        description: campaign.description || '',
        dateRange: {
          from: new Date(campaign.start_date),
          to: new Date(campaign.end_date),
        },
        utm_campaign: campaign.utm_campaign,
        utm_source: campaign.utm_source || '',
        utm_medium: campaign.utm_medium || '',
        utm_content: campaign.utm_content || '',
        utm_term: campaign.utm_term || '',
        goal_revenue: campaign.goal_revenue?.toString() || '',
        goal_sales: campaign.goal_sales?.toString() || '',
        goal_sessions: campaign.goal_sessions?.toString() || '',
        goal_conversion_rate: campaign.goal_conversion_rate?.toString() || '',
        goal_average_ticket: campaign.goal_average_ticket?.toString() || '',
        goal_cps: campaign.goal_cps?.toString() || '',
      });
    } else {
      form.reset({
        name: '',
        description: '',
        dateRange: {
          from: new Date(),
          to: new Date(),
        },
        utm_campaign: '',
        utm_source: '',
        utm_medium: '',
        utm_content: '',
        utm_term: '',
        goal_revenue: '',
        goal_sales: '',
        goal_sessions: '',
        goal_conversion_rate: '',
        goal_average_ticket: '',
        goal_cps: '',
      });
    }
  }, [campaign, open, form]);

  const handleSubmit = async (data: CampaignFormData) => {
    console.log('🔍 Date objects recebidos:', {
      from: data.dateRange.from,
      to: data.dateRange.to,
      from_string: data.dateRange.from.toString(),
      to_string: data.dateRange.to.toString(),
      from_iso: data.dateRange.from.toISOString(),
      to_iso: data.dateRange.to.toISOString()
    });
    
    const submitData: CreateCampaignData = {
      name: data.name,
      description: data.description || undefined,
      start_date: formatDateLocal(data.dateRange.from),
      end_date: formatDateLocal(data.dateRange.to),
      utm_campaign: data.utm_campaign,
      utm_source: data.utm_source || undefined,
      utm_medium: data.utm_medium || undefined,
      utm_content: data.utm_content || undefined,
      utm_term: data.utm_term || undefined,
      goal_revenue: data.goal_revenue ? parseFloat(data.goal_revenue) : undefined,
      goal_sales: data.goal_sales ? parseInt(data.goal_sales) : undefined,
      goal_sessions: data.goal_sessions ? parseInt(data.goal_sessions) : undefined,
      goal_conversion_rate: data.goal_conversion_rate ? parseFloat(data.goal_conversion_rate) : undefined,
      goal_average_ticket: data.goal_average_ticket ? parseFloat(data.goal_average_ticket) : undefined,
      goal_cps: data.goal_cps ? parseFloat(data.goal_cps) : undefined,
    };

    console.log('📅 Datas formatadas para envio:', {
      start_date: submitData.start_date,
      end_date: submitData.end_date
    });

    await onSubmit(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {campaign ? 'Editar Campanha' : 'Nova Campanha'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Informações Básicas</h3>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Campanha</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Black Friday 2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva os objetivos e detalhes da campanha..."
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <FormField
              control={form.control}
              name="dateRange"
              render={({ field }) => (
                <FormItem className="space-y-3">
                    <FormLabel>Período da Campanha</FormLabel>
                    <FormControl>
                      <PeriodRangePicker
                        dateRange={field.value}
                        onDateRangeChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="utm_campaign"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UTM Campaign (obrigatório)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: black-friday-2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* UTMs Adicionais */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="utm-parameters" className="border border-border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <span className="text-base font-medium">Parâmetros UTM Adicionais</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="utm_source"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UTM Source</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: google, facebook" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="utm_medium"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UTM Medium</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: cpc, email, social" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="utm_content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UTM Content</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: banner-homepage" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="utm_term"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UTM Term</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: black friday" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Metas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Metas da Campanha</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="goal_revenue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta de Receita (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="goal_sales"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta de Vendas (qtd)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="goal_sessions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta de Sessões</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="goal_conversion_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta de Conversão (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="goal_average_ticket"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta de Ticket Médio (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="goal_cps"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta de CPS (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={loading}
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {campaign ? 'Salvar' : 'Criar Campanha'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}