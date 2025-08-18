import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target, Save, X, History, ChevronLeft, ChevronRight } from 'lucide-react';
import { CurrencyInput } from '@/components/ui/currency-input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GoalsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
}

export const GoalsModal: React.FC<GoalsModalProps> = ({ open, onOpenChange, selectedDate }) => {
  const [followerGoal, setFollowerGoal] = useState('');
  const [salesGoal, setSalesGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [targetDate, setTargetDate] = useState(selectedDate);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current goals for the selected month
  const { data: currentGoals, refetch: refetchGoals } = useQuery({
    queryKey: ['monthly-goals', targetDate.getFullYear(), targetDate.getMonth() + 1],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('goals-social-media', {
        body: {
          action: 'get',
          month: targetDate.getMonth() + 1,
          year: targetDate.getFullYear()
        }
      });
      
      if (error) throw error;
      return data?.data;
    },
    enabled: open
  });

  // Fetch goals history
  const { data: goalsHistory } = useQuery({
    queryKey: ['monthly-goals-history'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('goals-social-media', {
        body: { action: 'history' }
      });
      
      if (error) throw error;
      return data?.data || [];
    },
    enabled: open
  });

  // Update form when current goals change or modal opens
  useEffect(() => {
    if (open) {
      setTargetDate(selectedDate);
    }
  }, [open, selectedDate]);

  useEffect(() => {
    if (currentGoals) {
      setFollowerGoal(currentGoals.follower_goal?.toString() || '');
      setSalesGoal(currentGoals.sales_goal?.toString() || '');
    } else {
      setFollowerGoal('');
      setSalesGoal('');
    }
  }, [currentGoals]);

  // Refetch goals when target date changes
  useEffect(() => {
    if (open) {
      refetchGoals();
    }
  }, [targetDate, refetchGoals, open]);

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
          action: 'save',
          follower_goal: parseInt(followerGoal),
          sales_goal: parseFloat(salesGoal),
          month: targetDate.getMonth() + 1,
          year: targetDate.getFullYear()
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: `Metas salvas para ${format(targetDate, "MMMM 'de' yyyy", { locale: ptBR })}!`
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['monthly-goals'] });
      queryClient.invalidateQueries({ queryKey: ['followers-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['sales-analytics'] });

      onOpenChange(false);
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

  const handleLoadGoalsFromHistory = (goals: any) => {
    setFollowerGoal(goals.follower_goal?.toString() || '');
    setSalesGoal(goals.sales_goal?.toString() || '');
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const handlePreviousMonth = () => {
    setTargetDate(subMonths(targetDate, 1));
  };

  const handleNextMonth = () => {
    setTargetDate(addMonths(targetDate, 1));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <DialogTitle>Definir Metas</DialogTitle>
              <DialogDescription>
                Configure as metas de seguidores e vendas para qualquer mês
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Month Navigation */}
          <div className="space-y-2">
            <Label>Mês de Referência</Label>
            <div className="flex items-center justify-center gap-4 p-2 border rounded-lg">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handlePreviousMonth}
                className="p-1 h-8 w-8"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex-1 text-center font-medium">
                {format(targetDate, "MMMM 'de' yyyy", { locale: ptBR })}
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleNextMonth}
                className="p-1 h-8 w-8"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Goals Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="follower-goal">Meta de Seguidores</Label>
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
              <Label htmlFor="sales-goal">Meta de Vendas com Cupom</Label>
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

          {/* Goals History */}
          {goalsHistory && goalsHistory.length > 0 && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Metas Anteriores
              </Label>
              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {goalsHistory.map((goals: any) => {
                  const goalDate = new Date(goals.month + 'T00:00:00');
                  return (
                    <Card key={goals.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">
                            {format(goalDate, "MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <p>Seguidores: {goals.follower_goal?.toLocaleString('pt-BR') || 'N/A'}</p>
                            <p>Vendas: {goals.sales_goal ? formatCurrency(goals.sales_goal) : 'N/A'}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleLoadGoalsFromHistory(goals)}
                          disabled={loading}
                        >
                          Usar
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};