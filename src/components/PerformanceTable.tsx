import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CampaignPerformanceData } from '@/types/campaign';

interface PerformanceTableProps {
  data: CampaignPerformanceData[];
  loading: boolean;
  onEdit: (performance: CampaignPerformanceData) => void;
  onDelete: (id: string) => void;
}

export function PerformanceTable({ data, loading, onEdit, onDelete }: PerformanceTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhum dado de performance encontrado.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Clique em "Adicionar Dados" para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>UTM Source</TableHead>
            <TableHead className="text-right">Sessões</TableHead>
            <TableHead className="text-right">Cliques</TableHead>
            <TableHead className="text-right">Impressões</TableHead>
            <TableHead className="text-right">Custo</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((performance) => (
            <TableRow key={performance.id}>
              <TableCell className="font-medium">
                {format(new Date(performance.date), 'dd/MM/yyyy', { locale: ptBR })}
              </TableCell>
              <TableCell>
                {performance.utm_source ? (
                  <Badge variant="secondary">{performance.utm_source}</Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right font-mono">
                {performance.sessions.toLocaleString()}
              </TableCell>
              <TableCell className="text-right font-mono">
                {performance.clicks ? performance.clicks.toLocaleString() : '-'}
              </TableCell>
              <TableCell className="text-right font-mono">
                {performance.impressions ? performance.impressions.toLocaleString() : '-'}
              </TableCell>
              <TableCell className="text-right font-mono">
                {performance.cost 
                  ? `R$ ${performance.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : '-'
                }
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(performance)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(performance.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}