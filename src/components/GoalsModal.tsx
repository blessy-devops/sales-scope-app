import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target, Save, X } from 'lucide-react';
import { CurrencyInput } from '@/components/ui/currency-input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GoalsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GoalsModal: React.FC<GoalsModalProps> = ({ open, onOpenChange }) => {
  const [followerGoal, setFollowerGoal] = useState('');
  const [salesGoal, setSalesGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!followerGoal || !salesGoal) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('goals-social-media', {
        body: {
          follower_goal: parseInt(followerGoal),
          sales_goal: parseFloat(salesGoal.replace(/[^\d,]/g, '').replace(',', '.'))
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Metas salvas com sucesso!"
      });

      onOpenChange(false);
      setFollowerGoal('');
      setSalesGoal('');
    } catch (error) {
      console.error('Error saving goals:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar as metas. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <DialogTitle>Definir Metas do Mês</DialogTitle>
              <DialogDescription>
                Configure as metas de seguidores e vendas para o mês atual
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="follower-goal">Meta de Seguidores (mês)</Label>
            <Input
              id="follower-goal"
              type="number"
              placeholder="Ex: 1000"
              value={followerGoal}
              onChange={(e) => setFollowerGoal(e.target.value)}
              min="0"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sales-goal">Meta de Vendas com Cupom (mês)</Label>
            <CurrencyInput
              id="sales-goal"
              value={salesGoal}
              onValueChange={setSalesGoal}
              placeholder="R$ 0,00"
            />
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Metas'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};