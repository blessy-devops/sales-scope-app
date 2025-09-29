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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SubChannel, CreateSubChannelData } from '@/types/subChannel';
import { useOverlapValidation } from '@/hooks/useOverlapValidation';
import { Loader2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface SubChannelFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateSubChannelData) => Promise<void>;
  subChannel?: SubChannel | null;
  loading?: boolean;
  existingSubChannels: SubChannel[];
  parentChannelId: string;
}

export function SubChannelFormModal({ 
  open, 
  onOpenChange, 
  onSubmit, 
  subChannel, 
  loading = false,
  existingSubChannels,
  parentChannelId
}: SubChannelFormModalProps) {
  const [formData, setFormData] = useState<CreateSubChannelData>({
    name: '',
    utm_source: '',
    utm_medium: '',
    utm_medium_matching_type: 'exact',
  });

  const { validationState, validateOverlap } = useOverlapValidation(existingSubChannels, parentChannelId);

  useEffect(() => {
    if (subChannel) {
      setFormData({
        name: subChannel.name,
        utm_source: subChannel.utm_source,
        utm_medium: subChannel.utm_medium,
        utm_medium_matching_type: subChannel.utm_medium_matching_type,
      });
    } else {
      setFormData({
        name: '',
        utm_source: '',
        utm_medium: '',
        utm_medium_matching_type: 'exact',
      });
    }
  }, [subChannel, open]);

  // Validate overlap whenever form data changes
  useEffect(() => {
    if (formData.utm_source.trim() && formData.utm_medium.trim()) {
      validateOverlap(formData, subChannel?.id);
    }
  }, [formData, validateOverlap, subChannel?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const isFormValid = formData.name.trim() && formData.utm_source.trim() && formData.utm_medium.trim() && formData.utm_medium_matching_type && validationState.type !== 'error';

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

            <div className="space-y-2">
              <Label htmlFor="utm_medium_matching_type" className="text-sm font-medium">
                Tipo de Correspondência UTM Medium
              </Label>
              <Select
                value={formData.utm_medium_matching_type}
                onValueChange={(value: 'exact' | 'contains') => 
                  setFormData(prev => ({ ...prev, utm_medium_matching_type: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exact">Correspondência Exata</SelectItem>
                  <SelectItem value="contains">Contém Termo</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                <strong>Exata:</strong> UTM Medium deve corresponder exatamente<br />
                <strong>Contém:</strong> UTM Medium pode estar contido em valores maiores<br />
                <em>Nota: UTM Source sempre usa correspondência exata</em>
              </p>
            </div>

          {/* Validation Alert */}
          {validationState.type !== 'none' && (
            <Alert className={`${
              validationState.type === 'error' 
                ? 'border-destructive bg-destructive/10' 
                : 'border-warning bg-warning/10'
            }`}>
              <div className="flex items-start gap-2">
                {validationState.type === 'error' ? (
                  <XCircle className="h-4 w-4 text-destructive mt-0.5" />
                ) : validationState.type === 'warning' ? (
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                )}
                <AlertDescription className={`text-sm whitespace-pre-line ${
                  validationState.type === 'error' 
                    ? 'text-destructive' 
                    : validationState.type === 'warning'
                    ? 'text-warning'
                    : 'text-success'
                }`}>
                  {validationState.message}
                </AlertDescription>
              </div>
            </Alert>
          )}

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