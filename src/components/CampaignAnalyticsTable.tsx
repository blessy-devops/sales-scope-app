import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UTMSourceMetrics } from '@/types/campaign';

interface CampaignAnalyticsTableProps {
  data: UTMSourceMetrics[];
  loading?: boolean;
}

export function CampaignAnalyticsTable({ data, loading }: CampaignAnalyticsTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise por Fonte UTM</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise por Fonte UTM</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Nenhum dado disponível para análise
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value?: number) => {
    if (value === undefined) return '-';
    return `${value.toFixed(2)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise por Fonte UTM</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fonte UTM</TableHead>
                <TableHead className="text-right">Sessões</TableHead>
                <TableHead className="text-right">Cliques</TableHead>
                <TableHead className="text-right">Impressões</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">Conversão</TableHead>
                <TableHead className="text-right">Ticket Médio</TableHead>
                <TableHead className="text-right">CPS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Badge variant="outline">
                      {row.utm_source || 'Direct'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {row.sessions?.toLocaleString('pt-BR') || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.clicks?.toLocaleString('pt-BR') || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.impressions?.toLocaleString('pt-BR') || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.cost ? formatCurrency(row.cost) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {row.sales.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(row.revenue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercentage(row.conversion_rate)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.average_ticket)}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.cps ? formatCurrency(row.cps) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}