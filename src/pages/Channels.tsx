import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ChannelCard } from '@/components/ChannelCard';
import { ChannelModal } from '@/components/ChannelModal';
import { useChannels } from '@/hooks/useChannels';
import { Channel, CreateChannelData } from '@/types/channel';
import { useToast } from '@/hooks/use-toast';

export default function Channels() {
  const { channels, loading, createChannel, updateChannel, deleteChannel } = useChannels();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    channel.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateChannel = async (data: CreateChannelData) => {
    try {
      if (editingChannel) {
        await updateChannel(editingChannel.id, data);
        toast({
          title: "Canal atualizado",
          description: `${data.name} foi atualizado com sucesso.`,
        });
      } else {
        await createChannel(data);
        toast({
          title: "Canal criado",
          description: `${data.name} foi criado com sucesso.`,
        });
      }
      setModalOpen(false);
      setEditingChannel(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o canal.",
        variant: "destructive",
      });
    }
  };

  const handleEditChannel = (channel: Channel) => {
    setEditingChannel(channel);
    setModalOpen(true);
  };

  const handleDeleteChannel = async (id: string) => {
    try {
      await deleteChannel(id);
      toast({
        title: "Canal excluído",
        description: "O canal foi excluído com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir o canal.",
        variant: "destructive",
      });
    }
  };

  const handleNewChannel = () => {
    setEditingChannel(null);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Canais de Venda</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus canais de venda e monitore seu desempenho
            </p>
          </div>
          <Button onClick={handleNewChannel} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Canal
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar canais..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 max-w-sm"
          />
        </div>

        {/* Channels Grid */}
        {filteredChannels.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchTerm ? 'Nenhum canal encontrado' : 'Nenhum canal cadastrado'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm 
                ? 'Tente buscar com outros termos' 
                : 'Comece criando seu primeiro canal de venda'
              }
            </p>
            {!searchTerm && (
              <Button onClick={handleNewChannel} className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Primeiro Canal
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredChannels.map((channel) => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                onEdit={handleEditChannel}
                onDelete={handleDeleteChannel}
              />
            ))}
          </div>
        )}

        {/* Modal */}
        <ChannelModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSubmit={handleCreateChannel}
          channel={editingChannel}
          loading={loading}
        />
      </div>
    </div>
  );
}