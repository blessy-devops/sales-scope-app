import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { useSubChannels } from '@/hooks/useSubChannels';
import { SubChannelFormModal } from './SubChannelFormModal';
import { SubChannel, CreateSubChannelData } from '@/types/subChannel';
import { useToast } from '@/hooks/use-toast';

interface SubChannelManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentChannelId: string;
  parentChannelName: string;
}

export function SubChannelManagerModal({ 
  open, 
  onOpenChange, 
  parentChannelId, 
  parentChannelName 
}: SubChannelManagerModalProps) {
  const { 
    subChannels, 
    loading, 
    createSubChannel, 
    updateSubChannel, 
    deleteSubChannel 
  } = useSubChannels(parentChannelId);
  
  const { toast } = useToast();
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingSubChannel, setEditingSubChannel] = useState<SubChannel | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleCreateSubChannel = async (data: CreateSubChannelData) => {
    try {
      setActionLoading(true);
      if (editingSubChannel) {
        await updateSubChannel(editingSubChannel.id, data);
        toast({
          title: "Sub-canal atualizado",
          description: `${data.name} foi atualizado com sucesso.`,
        });
      } else {
        await createSubChannel(data);
        toast({
          title: "Sub-canal criado",
          description: `${data.name} foi criado com sucesso.`,
        });
      }
      setFormModalOpen(false);
      setEditingSubChannel(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o sub-canal.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubChannel = (subChannel: SubChannel) => {
    setEditingSubChannel(subChannel);
    setFormModalOpen(true);
  };

  const handleDeleteSubChannel = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${name}"?`)) return;
    
    try {
      setActionLoading(true);
      await deleteSubChannel(id);
      toast({
        title: "Sub-canal excluído",
        description: `${name} foi excluído com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir o sub-canal.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleNewSubChannel = () => {
    setEditingSubChannel(null);
    setFormModalOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Sub-Canais de {parentChannelName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Gerencie os sub-canais para segmentar melhor suas fontes de tráfego
              </p>
              <Button onClick={handleNewSubChannel} className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Sub-Canal
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Carregando sub-canais...</span>
              </div>
            ) : subChannels.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Nenhum sub-canal cadastrado
                </h3>
                <p className="text-muted-foreground mb-6">
                  Crie sub-canais para organizar suas diferentes fontes de tráfego
                </p>
                <Button onClick={handleNewSubChannel} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Criar Primeiro Sub-Canal
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>UTM Source</TableHead>
                      <TableHead>UTM Medium</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subChannels.map((subChannel) => (
                      <TableRow key={subChannel.id}>
                        <TableCell className="font-medium">
                          {subChannel.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {subChannel.utm_source}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {subChannel.utm_medium}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSubChannel(subChannel)}
                              disabled={actionLoading}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSubChannel(subChannel.id, subChannel.name)}
                              disabled={actionLoading}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <SubChannelFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        onSubmit={handleCreateSubChannel}
        subChannel={editingSubChannel}
        loading={actionLoading}
        existingSubChannels={subChannels}
        parentChannelId={parentChannelId}
      />
    </>
  );
}