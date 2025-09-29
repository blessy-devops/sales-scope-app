import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Plus, BarChart3, Calendar, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useCampaignPerformance } from '@/hooks/useCampaignPerformance';
import { CampaignPerformanceDialog } from '@/components/CampaignPerformanceDialog';
import { PerformanceTable } from '@/components/PerformanceTable';
import { Campaign, CampaignPerformanceData } from '@/types/campaign';

export default function CampaignDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { campaigns, loading: campaignsLoading } = useCampaigns();
  const { performanceData, loading: performanceLoading, createPerformanceData, updatePerformanceData, deletePerformanceData } = useCampaignPerformance(id);
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