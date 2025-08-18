import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useQueryClient } from '@tanstack/react-query';

interface Coupon {
  id: number;
  coupon_code: string;
  description: string | null;
  created_at: string;
}

interface CouponsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SalesMetricPreference = 'subtotal_price' | 'total_price';

export function CouponsModal({ open, onOpenChange }: CouponsModalProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [addingCoupon, setAddingCoupon] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  
  // Settings tab state
  const [salesMetricPreference, setSalesMetricPreference] = useState<SalesMetricPreference>('subtotal_price');
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      console.log('Fetching coupons from edge function...');
      
      const { data, error } = await supabase.functions.invoke('coupons-social-media', {
        body: { action: 'list' }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      
      console.log('Edge function response:', data);
      
      // Normalize coupon IDs to numbers
      const normalizedCoupons = (data.coupons || []).map((coupon: any) => ({
        ...coupon,
        id: Number(coupon.id)
      }));
      
      console.log('Normalized coupons:', normalizedCoupons);
      setCoupons(normalizedCoupons);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os cupons.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCoupon = async () => {
    if (!newCouponCode.trim()) {
      toast({
        title: "Erro",
        description: "Código do cupom é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      setAddingCoupon(true);
      const { data, error } = await supabase.functions.invoke('coupons-social-media', {
        body: {
          action: 'create',
          coupon_code: newCouponCode.trim(),
          description: newDescription.trim() || null
        }
      });

      if (error) throw error;

      setNewCouponCode('');
      setNewDescription('');
      
      // Re-fetch to stay in sync with DB
      await fetchCoupons();
      
      toast({
        title: "Sucesso",
        description: "Cupom adicionado com sucesso!",
      });
    } catch (error) {
      console.error('Error adding coupon:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o cupom.",
        variant: "destructive",
      });
    } finally {
      setAddingCoupon(false);
    }
  };

  const deleteCoupon = async (couponId: number) => {
    try {
      setDeletingIds(prev => new Set(prev).add(couponId));
      
      const { error } = await supabase.functions.invoke('coupons-social-media', {
        body: { action: 'delete', id: couponId }
      });

      if (error) throw error;

      // Re-fetch to stay in sync with DB
      await fetchCoupons();
      
      toast({
        title: "Sucesso",
        description: "Cupom removido com sucesso!",
      });
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o cupom.",
        variant: "destructive",
      });
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(couponId);
        return newSet;
      });
    }
  };

  const fetchSalesMetricPreference = async () => {
    try {
      setLoadingSettings(true);
      const { data, error } = await supabase.functions.invoke('settings/sales-metric', {
        body: { action: 'get' }
      });

      if (error) throw error;
      setSalesMetricPreference(data.value || 'subtotal_price');
    } catch (error) {
      console.error('Error fetching sales metric preference:', error);
      // Keep default value on error
      setSalesMetricPreference('subtotal_price');
    } finally {
      setLoadingSettings(false);
    }
  };

  const saveSalesMetricPreference = async () => {
    try {
      setSavingSettings(true);
      const { error } = await supabase.functions.invoke('settings/sales-metric', {
        body: { action: 'update', value: salesMetricPreference }
      });

      if (error) throw error;

      // Invalidate sales analytics queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['sales-analytics'] });
      
      toast({
        title: "Sucesso",
        description: "Configuração salva com sucesso!",
      });
    } catch (error) {
      console.error('Error saving sales metric preference:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a configuração.",
        variant: "destructive",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    console.log('Modal open state changing to:', newOpen);
    if (newOpen) {
      console.log('Modal opening, fetching coupons and settings...');
      fetchCoupons();
      fetchSalesMetricPreference();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="coupons" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="coupons">Cupons</TabsTrigger>
            <TabsTrigger value="display">Configurações de Exibição</TabsTrigger>
          </TabsList>

          <TabsContent value="coupons" className="space-y-6 mt-6">
            {/* Add new coupon form */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="coupon-code" className="block mb-2">Código do Cupom</Label>
                      <Input
                        id="coupon-code"
                        value={newCouponCode}
                        onChange={(e) => setNewCouponCode(e.target.value)}
                        placeholder="Ex: SOCIAL20"
                        disabled={addingCoupon}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description" className="block mb-2">Descrição (opcional)</Label>
                      <Input
                        id="description"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="Ex: 20% off para seguidores"
                        disabled={addingCoupon}
                      />
                    </div>
                  </div>
                  <Button onClick={addCoupon} disabled={addingCoupon} className="w-full">
                    {addingCoupon ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Adicionar Cupom
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Coupons list */}
            <div className="space-y-3">
              <h3 className="font-medium">Cupons Cadastrados</h3>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : coupons.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Nenhum cupom cadastrado ainda.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {coupons.map((coupon) => (
                    <Card key={coupon.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{coupon.coupon_code}</div>
                            {coupon.description && (
                              <div className="text-sm text-muted-foreground">
                                {coupon.description}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteCoupon(coupon.id)}
                            disabled={deletingIds.has(coupon.id)}
                          >
                            {deletingIds.has(coupon.id) ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="display" className="space-y-6 mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Cálculo do Total de Vendas</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Escolha se o valor das vendas deve incluir o frete e outras taxas (Valor Total) ou apenas o valor líquido dos produtos (Valor dos Produtos).
                    </p>
                  </div>

                  {loadingSettings ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : (
                    <RadioGroup
                      value={salesMetricPreference}
                      onValueChange={(value) => setSalesMetricPreference(value as SalesMetricPreference)}
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="subtotal_price" id="subtotal" />
                        <Label htmlFor="subtotal" className="font-normal">
                          Valor dos Produtos (sem frete)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="total_price" id="total" />
                        <Label htmlFor="total" className="font-normal">
                          Valor Total (com frete)
                        </Label>
                      </div>
                    </RadioGroup>
                  )}

                  <Button 
                    onClick={saveSalesMetricPreference} 
                    disabled={savingSettings || loadingSettings}
                    className="w-full"
                  >
                    {savingSettings ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Salvar Configuração
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}