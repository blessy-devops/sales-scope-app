import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search, Calendar, Target, LayoutGrid, List } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Input } from '@/components/ui/input';
import { CampaignFormDialog } from '@/components/CampaignFormDialog';
import { CampaignCard } from '@/components/CampaignCard';
import { CampaignsTable } from '@/components/campaigns/CampaignsTable';
import { useCampaigns } from '@/hooks/useCampaigns';
import { Campaign, CreateCampaignData } from '@/types/campaign';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Campaigns() {
  const { campaigns, loading, createCampaign, updateCampaign, deleteCampaign } = useCampaigns();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.utm_campaign.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (campaign.description && campaign.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateCampaign = async (data: CreateCampaignData) => {
    try {
      if (editingCampaign) {
        await updateCampaign(editingCampaign.id, data);
        toast({
          title: "Campanha atualizada",
          description: `${data.name} foi atualizada com sucesso.`,
        });
      } else {
        await createCampaign(data);
        toast({
          title: "Campanha criada",
          description: `${data.name} foi criada com sucesso.`,
        });
      }
      setModalOpen(false);
      setEditingCampaign(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar a campanha.",
        variant: "destructive",
      });
    }
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setModalOpen(true);
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      await deleteCampaign(id);
      toast({
        title: "Campanha excluída",
        description: "A campanha foi excluída com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir a campanha.",
        variant: "destructive",
      });
    }
  };

  const handleNewCampaign = () => {
    setEditingCampaign(null);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Campanhas</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas campanhas de marketing e monitore suas metas
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ToggleGroup 
              type="single" 
              value={viewMode} 
              onValueChange={(value) => value && setViewMode(value as 'grid' | 'list')}
              className="border rounded-md"
            >
              <ToggleGroupItem value="grid" aria-label="Visualização em galeria" size="sm">
                <LayoutGrid className="w-4 h-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="Visualização em lista" size="sm">
                <List className="w-4 h-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            <Button onClick={handleNewCampaign} className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Campanha
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar campanhas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 max-w-sm"
          />
        </div>

        {/* Campaigns Content */}
        {viewMode === 'grid' ? (
          filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchTerm ? 'Nenhuma campanha encontrada' : 'Nenhuma campanha cadastrada'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? 'Tente buscar com outros termos' 
                  : 'Comece criando sua primeira campanha de marketing'
                }
              </p>
              {!searchTerm && (
                <Button onClick={handleNewCampaign} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Criar Primeira Campanha
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onEdit={handleEditCampaign}
                  onDelete={handleDeleteCampaign}
                />
              ))}
            </div>
          )
        ) : (
          <CampaignsTable campaigns={filteredCampaigns} />
        )}

        {/* Modal */}
        <CampaignFormDialog
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSubmit={handleCreateCampaign}
          campaign={editingCampaign}
          loading={loading}
        />
      </div>
    </div>
  );
}