import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Plus, BarChart3, Calendar, Target, TrendingUp, DollarSign, ShoppingCart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useCampaignPerformance } from '@/hooks/useCampaignPerformance';
import { useCampaignAnalytics } from '@/hooks/useCampaignAnalytics';
import { CampaignPerformanceDialog } from '@/components/CampaignPerformanceDialog';
import { PerformanceTable } from '@/components/PerformanceTable';
import { CampaignKPICard } from '@/components/CampaignKPICard';
import { CampaignCharts } from '@/components/CampaignCharts';
import { CampaignAnalyticsTable } from '@/components/CampaignAnalyticsTable';
import { Campaign, CampaignPerformanceData, CampaignKPI, UTMSourceMetrics } from '@/types/campaign';

export default function CampaignDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { campaigns, loading: campaignsLoading } = useCampaigns();
  const { performanceData, loading: performanceLoading, createPerformanceData, updatePerformanceData, deletePerformanceData } = useCampaignPerformance(id);
  const { analyticsData, loading: analyticsLoading } = useCampaignAnalytics(id);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isPerformanceDialogOpen, setIsPerformanceDialogOpen] = useState(false);
  const [editingPerformance, setEditingPerformance] = useState<CampaignPerformanceData | null>(null);

  useEffect(() => {
    if (!campaignsLoading && campaigns.length > 0 && id) {
      const foundCampaign = campaigns.find(c => c.id === id);
      if (foundCampaign) {
        setCampaign(foundCampaign);
      } else {
        toast({
          title: "Erro",
          description: "Campanha não encontrada.",
          variant: "destructive",
        });
        navigate('/campanhas');
      }
    }
  }, [campaigns, campaignsLoading, id, navigate, toast]);

  const handleCreatePerformance = async (data: any) => {
    try {
      await createPerformanceData({
        campaign_id: id!,
        date: format(data.date, 'yyyy-MM-dd'),
        utm_source: data.utm_source || undefined,
        sessions: parseInt(data.sessions),
        clicks: data.clicks ? parseInt(data.clicks) : undefined,
        impressions: data.impressions ? parseInt(data.impressions) : undefined,
        cost: data.cost ? parseFloat(data.cost) : undefined,
      });
      
      toast({
        title: "Sucesso",
        description: "Dados de performance adicionados com sucesso.",
      });
      
      setIsPerformanceDialogOpen(false);
    } catch (error) {
      console.error('Error creating performance data:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar dados de performance.",
        variant: "destructive",
      });
    }
  };

  const handleEditPerformance = (performance: CampaignPerformanceData) => {
    setEditingPerformance(performance);
    setIsPerformanceDialogOpen(true);
  };

  const handleUpdatePerformance = async (data: any) => {
    if (!editingPerformance) return;

    try {
      await updatePerformanceData(editingPerformance.id, {
        date: format(data.date, 'yyyy-MM-dd'),
        utm_source: data.utm_source || undefined,
        sessions: parseInt(data.sessions),
        clicks: data.clicks ? parseInt(data.clicks) : undefined,
        impressions: data.impressions ? parseInt(data.impressions) : undefined,
        cost: data.cost ? parseFloat(data.cost) : undefined,
      });
      
      toast({
        title: "Sucesso",
        description: "Dados de performance atualizados com sucesso.",
      });
      
      setIsPerformanceDialogOpen(false);
      setEditingPerformance(null);
    } catch (error) {
      console.error('Error updating performance data:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar dados de performance.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePerformance = async (id: string) => {
    try {
      await deletePerformanceData(id);
      toast({
        title: "Sucesso",
        description: "Dados de performance removidos com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting performance data:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover dados de performance.",
        variant: "destructive",
      });
    }
  };

  const calculateTotalSessions = () => {
    return performanceData.reduce((total, data) => total + data.sessions, 0);
  };

  const calculateTotalCost = () => {
    return performanceData.reduce((total, data) => total + (data.cost || 0), 0);
  };

  // Generate KPIs from analytics data
  const generateKPIs = (): CampaignKPI[] => {
    if (!analyticsData || !campaign) return [];

    const { shopify_analytics, goals, performance_data } = analyticsData;
    const { totals } = shopify_analytics;
    
    // Calculate performance data totals
    const totalSessions = performance_data.reduce((sum, item) => sum + item.sessions, 0);
    const totalCost = performance_data.reduce((sum, item) => sum + (item.cost || 0), 0);
    
    // Calculate conversion rate
    const conversionRate = totalSessions > 0 ? (totals.total_sales / totalSessions) * 100 : 0;
    
    // Calculate CPS (Cost per Sale)
    const cps = totals.total_sales > 0 ? totalCost / totals.total_sales : 0;

    const kpis: CampaignKPI[] = [
      {
        label: 'Receita',
        value: totals.total_revenue,
        goal: goals.revenue,
        format: 'currency',
        icon: 'revenue'
      },
      {
        label: 'Vendas',
        value: totals.total_sales,
        goal: goals.sales,
        format: 'number',
        icon: 'sales'
      },
      {
        label: 'Sessões',
        value: totalSessions,
        goal: goals.sessions,
        format: 'number',
        icon: 'sessions'
      },
      {
        label: 'Conversão',
        value: conversionRate,
        goal: goals.conversion_rate,
        format: 'percentage',
        icon: 'conversion'
      },
      {
        label: 'Ticket Médio',
        value: totals.average_ticket,
        goal: goals.average_ticket,
        format: 'currency',
        icon: 'ticket'
      },
      {
        label: 'CPS',
        value: cps,
        goal: goals.cps,
        format: 'currency',
        icon: 'cps'
      }
    ];

    return kpis;
  };

  // Generate consolidated UTM analytics
  const generateUTMAnalytics = (): UTMSourceMetrics[] => {
    if (!analyticsData) return [];

    const { shopify_analytics, performance_data } = analyticsData;
    const utmMap = new Map<string, UTMSourceMetrics>();

    // Process Shopify data
    shopify_analytics.by_utm_source.forEach(item => {
      const key = item.utm_source || 'direct';
      utmMap.set(key, {
        utm_source: item.utm_source,
        revenue: item.revenue,
        sales: item.sales,
        average_ticket: item.average_ticket,
        conversion_rate: 0,
        cps: 0
      });
    });

    // Process performance data by grouping by utm_source
    const performanceBySource = performance_data.reduce((acc, item) => {
      const key = item.utm_source || 'direct';
      if (!acc[key]) {
        acc[key] = { sessions: 0, clicks: 0, impressions: 0, cost: 0 };
      }
      acc[key].sessions += item.sessions;
      acc[key].clicks += item.clicks || 0;
      acc[key].impressions += item.impressions || 0;
      acc[key].cost += item.cost || 0;
      return acc;
    }, {} as Record<string, { sessions: number; clicks: number; impressions: number; cost: number }>);

    // Merge performance data with Shopify data
    Object.entries(performanceBySource).forEach(([key, perfData]) => {
      const existing = utmMap.get(key);
      if (existing) {
        existing.sessions = perfData.sessions;
        existing.clicks = perfData.clicks;
        existing.impressions = perfData.impressions;
        existing.cost = perfData.cost;
        existing.conversion_rate = perfData.sessions > 0 ? (existing.sales / perfData.sessions) * 100 : 0;
        existing.cps = existing.sales > 0 ? perfData.cost / existing.sales : 0;
      } else {
        utmMap.set(key, {
          utm_source: key === 'direct' ? undefined : key,
          revenue: 0,
          sales: 0,
          average_ticket: 0,
          sessions: perfData.sessions,
          clicks: perfData.clicks,
          impressions: perfData.impressions,
          cost: perfData.cost,
          conversion_rate: 0,
          cps: 0
        });
      }
    });

    return Array.from(utmMap.values()).sort((a, b) => b.revenue - a.revenue);
  };

  if (campaignsLoading || !campaign) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando campanha...</p>
        </div>
      </div>
    );
  }

  const kpis = generateKPIs();
  const utmAnalytics = generateUTMAnalytics();

  const campaignStatus = () => {
    const now = new Date();
    const startDate = new Date(campaign.start_date);
    const endDate = new Date(campaign.end_date);

    if (now < startDate) return { label: 'Agendada', variant: 'secondary' as const };
    if (now > endDate) return { label: 'Finalizada', variant: 'outline' as const };
    return { label: 'Ativa', variant: 'default' as const };
  };

  const status = campaignStatus();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/campanhas')}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          {campaign.description && (
            <p className="text-muted-foreground mt-1">{campaign.description}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Período</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(new Date(campaign.start_date), 'dd/MM', { locale: ptBR })} - {format(new Date(campaign.end_date), 'dd/MM/yyyy', { locale: ptBR })}
            </div>
            <p className="text-xs text-muted-foreground">
              UTM Campaign: {campaign.utm_campaign}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Sessões</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateTotalSessions().toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {performanceData.length} dias com dados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {calculateTotalCost().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {campaign.goal_revenue ? `Meta: R$ ${campaign.goal_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Sem meta definida'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* KPIs Grid */}
      {analyticsData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.map((kpi, index) => (
              <CampaignKPICard key={index} kpi={kpi} />
            ))}
          </div>

          {/* Charts Section */}
          <CampaignCharts utmData={utmAnalytics} />

          {/* Analytics Table */}
          <CampaignAnalyticsTable 
            data={utmAnalytics}
            loading={analyticsLoading}
          />
        </>
      )}

      {analyticsLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando análises...</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Dados de Performance</CardTitle>
              <CardDescription>
                Gerencie os dados de sessões, cliques e custos da campanha
              </CardDescription>
            </div>
            <Button onClick={() => setIsPerformanceDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Dados
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <PerformanceTable 
            data={performanceData}
            loading={performanceLoading}
            onEdit={handleEditPerformance}
            onDelete={handleDeletePerformance}
          />
        </CardContent>
      </Card>

      <CampaignPerformanceDialog
        open={isPerformanceDialogOpen}
        onClose={() => {
          setIsPerformanceDialogOpen(false);
          setEditingPerformance(null);
        }}
        onSubmit={editingPerformance ? handleUpdatePerformance : handleCreatePerformance}
        initialData={editingPerformance}
        title={editingPerformance ? 'Editar Dados de Performance' : 'Adicionar Dados de Performance'}
      />
    </div>
  );
}