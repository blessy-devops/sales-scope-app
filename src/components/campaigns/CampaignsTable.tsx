import { Campaign } from '@/types/campaign';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';

interface CampaignsTableProps {
  campaigns: Campaign[];
}

const getCampaignStatus = (campaign: Campaign) => {
  const now = new Date();
  const startDate = new Date(campaign.start_date);
  const endDate = new Date(campaign.end_date);

  if (now < startDate) {
    return { label: 'Agendada', variant: 'secondary' as const };
  } else if (now >= startDate && now <= endDate) {
    return { label: 'Ativa', variant: 'default' as const };
  } else {
    return { label: 'Finalizada', variant: 'outline' as const };
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDateRange = (startDate: string, endDate: string) => {
  const start = format(new Date(startDate), 'dd/MM/yyyy', { locale: ptBR });
  const end = format(new Date(endDate), 'dd/MM/yyyy', { locale: ptBR });
  return `${start} - ${end}`;
};

export function CampaignsTable({ campaigns }: CampaignsTableProps) {
  const navigate = useNavigate();

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma campanha encontrada
            </h3>
            <p className="text-muted-foreground">
              Tente buscar com outros termos ou crie uma nova campanha
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome da Campanha</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>UTM Campaign</TableHead>
              <TableHead className="text-right">Meta de Receita</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => {
              const status = getCampaignStatus(campaign);
              
              return (
                <TableRow
                  key={campaign.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/campaigns/${campaign.id}`)}
                >
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold text-foreground">
                        {campaign.name}
                      </div>
                      {campaign.description && (
                        <div className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {campaign.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateRange(campaign.start_date, campaign.end_date)}
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                      {campaign.utm_campaign}
                    </code>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {campaign.goal_revenue ? formatCurrency(campaign.goal_revenue) : '-'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}