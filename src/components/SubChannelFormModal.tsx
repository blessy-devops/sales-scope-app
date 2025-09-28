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
import { SubChannel, CreateSubChannelData } from '@/types/subChannel';
import { Loader2 } from 'lucide-react';

interface SubChannelFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateSubChannelData) => Promise<void>;
  subChannel?: SubChannel | null;
  loading?: boolean;
}

export function SubChannelFormModal({ 
  open, 
  onOpenChange, 
  onSubmit, 
  subChannel, 
  loading = false 
}: SubChannelFormModalProps) {
  const [formData, setFormData] = useState<CreateSubChannelData>({
    name: '',
    utm_source: '',
    utm_medium: '',
  });

  useEffect(() => {
    if (subChannel) {
      setFormData({
        name: subChannel.name,
        utm_source: subChannel.utm_source,
        utm_medium: subChannel.utm_medium,
      });
    } else {
      setFormData({
        name: '',
        utm_source: '',
        utm_medium: '',
      });
    }
  }, [subChannel, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const isFormValid = formData.name.trim() && formData.utm_source.trim() && formData.utm_medium.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {subChannel ? 'Editar Sub-Canal' : 'Novo Sub-Canal'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Nome do Sub-Canal
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Instagram Ads"
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="utm_source" className="text-sm font-medium">
              UTM Source
            </Label>
            <Input
              id="utm_source"
              value={formData.utm_source}
              onChange={(e) => setFormData(prev => ({ ...prev, utm_source: e.target.value }))}
              placeholder="Ex: instagram"
              required
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Identificador da fonte de tráfego
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="utm_medium" className="text-sm font-medium">
              UTM Medium
            </Label>
            <Input
              id="utm_medium"
              value={formData.utm_medium}
              onChange={(e) => setFormData(prev => ({ ...prev, utm_medium: e.target.value }))}
              placeholder="Ex: cpc"
              required
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Tipo de mídia (cpc, social, email, etc.)
            </p>
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
              disabled={loading || !isFormValid}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {subChannel ? 'Salvar' : 'Criar Sub-Canal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}