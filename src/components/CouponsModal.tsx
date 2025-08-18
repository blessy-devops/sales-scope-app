import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

export function CouponsModal({ open, onOpenChange }: CouponsModalProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [addingCoupon, setAddingCoupon] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('coupons-social-media', {
        body: { action: 'list' }
      });

      if (error) throw error;

      setCoupons(data.coupons || []);
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

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      fetchCoupons();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Cupons de Social Media</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add new coupon form */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="coupon-code" className="pb-[5px]">Código do Cupom</Label>
                    <Input
                      id="coupon-code"
                      value={newCouponCode}
                      onChange={(e) => setNewCouponCode(e.target.value)}
                      placeholder="Ex: SOCIAL20"
                      disabled={addingCoupon}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição (opcional)</Label>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}