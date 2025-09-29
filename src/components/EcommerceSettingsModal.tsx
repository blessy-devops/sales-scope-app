import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EcommerceSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EcommerceSettingsModal({ open, onOpenChange }: EcommerceSettingsModalProps) {
  const [calculationMode, setCalculationMode] = useState<string>('paid_only');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'shopify_sales_calculation_mode')
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setCalculationMode(data.value);
      } else {
        // Default value
        setCalculationMode('paid_only');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Upsert the setting
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'shopify_sales_calculation_mode',
          value: calculationMode,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key',
        });

      if (error) throw error;

      // Invalidate queries to refetch with new mode
      queryClient.invalidateQueries({ queryKey: ['shopify-metrics'] });
      
      toast.success('Configurações salvas com sucesso');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Configurações do Dashboard</DialogTitle>
          <DialogDescription>
            Configure como os dados do e-commerce são calculados e exibidos
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="calculation" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="calculation">Configurações de Cálculo</TabsTrigger>
          </TabsList>

          <TabsContent value="calculation" className="space-y-4 mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Modo de Cálculo de Vendas Shopify
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Escolha quais pedidos devem ser incluídos no cálculo de vendas
                  </p>

                  <RadioGroup value={calculationMode} onValueChange={setCalculationMode}>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent/50 transition-colors">
                        <RadioGroupItem value="paid_only" id="paid_only" />
                        <div className="flex-1 space-y-1">
                          <Label htmlFor="paid_only" className="cursor-pointer font-medium">
                            Apenas Pedidos Pagos
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Inclui apenas pedidos com status "paid", não cancelados e não de teste.
                            <br />
                            <span className="text-xs">
                              (financial_status = 'paid' AND cancelled_at IS NULL AND test = false)
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent/50 transition-colors">
                        <RadioGroupItem value="paid_with_cancelled" id="paid_with_cancelled" />
                        <div className="flex-1 space-y-1">
                          <Label htmlFor="paid_with_cancelled" className="cursor-pointer font-medium">
                            Pedidos Pagos + Cancelados
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Inclui pedidos pagos, mesmo que tenham sido cancelados posteriormente.
                            <br />
                            <span className="text-xs">
                              (financial_status = 'paid' AND test = false)
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent/50 transition-colors">
                        <RadioGroupItem value="all_orders" id="all_orders" />
                        <div className="flex-1 space-y-1">
                          <Label htmlFor="all_orders" className="cursor-pointer font-medium">
                            Todos os Pedidos
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Inclui todos os pedidos: pagos, pendentes e cancelados (exceto testes).
                            <br />
                            <span className="text-xs">
                              (test = false)
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Configurações
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
