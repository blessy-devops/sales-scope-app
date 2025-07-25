import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TargetHistory } from '@/types/target';
import { useChannels } from '@/hooks/useChannels';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Plus } from 'lucide-react';

interface TargetHistoryPanelProps {
  history: TargetHistory[];
}

export function TargetHistoryPanel({ history }: TargetHistoryPanelProps) {
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

  const getChangeIcon = (oldAmount: number, newAmount: number) => {
    if (oldAmount === 0) return Plus;
    return newAmount > oldAmount ? TrendingUp : TrendingDown;
  };

  const getChangeVariant = (oldAmount: number, newAmount: number) => {
    if (oldAmount === 0) return 'default';
    return newAmount > oldAmount ? 'default' : 'destructive';
  };

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Alterações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Nenhuma alteração registrada para este mês
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Histórico de Alterações</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {history.map((change) => {
              const ChangeIcon = getChangeIcon(change.old_amount, change.new_amount);
              const changeVariant = getChangeVariant(change.old_amount, change.new_amount);
              
              return (
                <div
                  key={change.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50"
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      changeVariant === 'default' ? 'bg-primary/10' : 'bg-destructive/10'
                    )}>
                      <ChangeIcon className={cn(
                        "w-4 h-4",
                        changeVariant === 'default' ? 'text-primary' : 'text-destructive'
                      )} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {getChannelName(change.channel_id)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(change.changed_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(change.old_amount)}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">
                        {formatCurrency(change.new_amount)}
                      </span>
                    </div>
                    <Badge variant={changeVariant} className="mt-1">
                      {change.old_amount === 0 
                        ? 'Nova meta'
                        : change.new_amount > change.old_amount 
                          ? `+${formatCurrency(change.new_amount - change.old_amount)}`
                          : `-${formatCurrency(change.old_amount - change.new_amount)}`
                      }
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}