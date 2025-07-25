import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DailySaleData } from '@/types/sale';
import { useChannels } from '@/hooks/useChannels';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SaveSalesConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  date: Date;
  salesData: DailySaleData[];
  loading?: boolean;
}

export function SaveSalesConfirmation({
  open,
  onOpenChange,
  onConfirm,
  date,
  salesData,
  loading = false,
}: SaveSalesConfirmationProps) {
  const { channels } = useChannels();

  const getChannelName = (channelId: string) => {
    return channels.find(c => c.id === channelId)?.name || 'Canal não encontrado';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const salesWithValues = salesData.filter(s => s.amount > 0);
  const totalAmount = salesWithValues.reduce((sum, sale) => sum + sale.amount, 0);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Lançamento de Vendas</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Confirma o lançamento das vendas para{' '}
                <strong>{format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</strong>?
              </p>
              
              {salesWithValues.length > 0 && (
                <div className="border border-border/50 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium text-sm">Resumo das vendas:</h4>
                  {salesWithValues.map((sale) => (
                    <div key={sale.channel_id} className="flex justify-between text-sm">
                      <span>{getChannelName(sale.channel_id)}</span>
                      <span className="font-medium">{formatCurrency(sale.amount)}</span>
                    </div>
                  ))}
                  <div className="border-t border-border/50 pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <p className="text-sm text-muted-foreground">
                Esta ação não pode ser desfeita, mas você poderá editar os valores posteriormente.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={loading}>
            {loading ? 'Salvando...' : 'Confirmar Lançamento'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}