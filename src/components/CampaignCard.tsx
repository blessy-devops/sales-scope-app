import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Trash2, Calendar, Target, TrendingUp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Campaign } from '@/types/campaign';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CampaignCardProps {
  campaign: Campaign;
  onEdit: (campaign: Campaign) => void;
  onDelete: (id: string) => void;
}

export function CampaignCard({ campaign, onEdit, onDelete }: CampaignCardProps) {
  const startDate = new Date(campaign.start_date);
  const endDate = new Date(campaign.end_date);
  const now = new Date();
  
  const isActive = startDate <= now && endDate >= now;
  const isPast = endDate < now;
  const isFuture = startDate > now;

  const getStatusBadge = () => {
    if (isActive) return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Ativa</Badge>;
    if (isPast) return <Badge variant="secondary">Finalizada</Badge>;
    if (isFuture) return <Badge variant="outline">Agendada</Badge>;
  };

  return (
    <Card className="relative hover:shadow-md transition-shadow bg-card border border-border">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-lg truncate">
              {campaign.name}
            </h3>
            <p className="text-sm text-muted-foreground font-mono">
              {campaign.utm_campaign}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border border-border">
                <DropdownMenuItem onClick={() => onEdit(campaign)} className="gap-2">
                  <Edit className="h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(campaign.id)} 
                  className="gap-2 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {campaign.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {campaign.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Period */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {format(startDate, 'dd/MM/yyyy', { locale: ptBR })} -{' '}
            {format(endDate, 'dd/MM/yyyy', { locale: ptBR })}
          </span>
        </div>

        {/* UTM Parameters */}
        {(campaign.utm_source || campaign.utm_medium) && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Parâmetros UTM
            </p>
            <div className="flex flex-wrap gap-1">
              {campaign.utm_source && (
                <Badge variant="outline" className="text-xs">
                  src: {campaign.utm_source}
                </Badge>
              )}
              {campaign.utm_medium && (
                <Badge variant="outline" className="text-xs">
                  med: {campaign.utm_medium}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Goals Summary */}
        {(campaign.goal_revenue || campaign.goal_sales) && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Metas
            </p>
            <div className="space-y-1">
              {campaign.goal_revenue && (
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-muted-foreground">
                    Receita: R$ {campaign.goal_revenue.toLocaleString('pt-BR')}
                  </span>
                </div>
              )}
              {campaign.goal_sales && (
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-3 w-3 text-blue-600" />
                  <span className="text-muted-foreground">
                    Vendas: {campaign.goal_sales}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}