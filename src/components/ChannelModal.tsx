import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Channel, ChannelType, CreateChannelData } from '@/types/channel';
import { Loader2 } from 'lucide-react';

interface ChannelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateChannelData) => Promise<void>;
  channel?: Channel | null;
  loading?: boolean;
}

const channelTypes: ChannelType[] = ['E-commerce', 'Landing Page', 'Marketplace'];

export function ChannelModal({ 
  open, 
  onOpenChange, 
  onSubmit, 
  channel, 
  loading = false 
}: ChannelModalProps) {
  const [formData, setFormData] = useState<CreateChannelData>({
    name: '',
    type: 'E-commerce',
    icon_url: '',
    is_active: true,
  });

  useEffect(() => {
    if (channel) {
      setFormData({
        name: channel.name,
        type: channel.type,
        icon_url: channel.icon_url || '',
        is_active: channel.is_active,
      });
    } else {
      setFormData({
        name: '',
        type: 'E-commerce',
        icon_url: '',
        is_active: true,
      });
    }
  }, [channel, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {channel ? 'Editar Canal' : 'Novo Canal de Venda'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Nome do Canal
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Minha Loja Shopify"
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm font-medium">
              Tipo
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value: ChannelType) => 
                setFormData(prev => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border">
                {channelTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon_url" className="text-sm font-medium">
              URL do Ícone (opcional)
            </Label>
            <Input
              id="icon_url"
              type="url"
              value={formData.icon_url}
              onChange={(e) => setFormData(prev => ({ ...prev, icon_url: e.target.value }))}
              placeholder="https://exemplo.com/icone.png"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco para usar o ícone padrão
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_active" className="text-sm font-medium">
                Canal Ativo
              </Label>
              <p className="text-xs text-muted-foreground">
                Canais inativos não aparecem nos relatórios
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, is_active: checked }))
              }
            />
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
              disabled={loading || !formData.name.trim()}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {channel ? 'Salvar' : 'Criar Canal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}