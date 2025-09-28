import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Store, Globe, ShoppingBag, Settings } from 'lucide-react';
import { Channel, ChannelType } from '@/types/channel';

interface ChannelCardProps {
  channel: Channel;
  onEdit: (channel: Channel) => void;
  onDelete: (id: string) => void;
  onManageSubChannels?: (channel: Channel) => void;
}

const getChannelIcon = (type: ChannelType) => {
  switch (type) {
    case 'E-commerce':
      return Store;
    case 'Landing Page':
      return Globe;
    case 'Marketplace':
      return ShoppingBag;
    default:
      return Store;
  }
};

const getTypeVariant = (type: ChannelType) => {
  switch (type) {
    case 'E-commerce':
      return 'default';
    case 'Landing Page':
      return 'secondary';
    case 'Marketplace':
      return 'outline';
    default:
      return 'default';
  }
};

export function ChannelCard({ channel, onEdit, onDelete, onManageSubChannels }: ChannelCardProps) {
  const IconComponent = getChannelIcon(channel.type);

  return (
    <Card className="group hover:shadow-md transition-all duration-200 border border-border/50 hover:border-border">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
              {channel.icon_url ? (
                <img 
                  src={channel.icon_url} 
                  alt={channel.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.removeAttribute('style');
                  }}
                />
              ) : null}
              <IconComponent 
                className="w-6 h-6 text-muted-foreground" 
                style={channel.icon_url ? { display: 'none' } : {}}
              />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{channel.name}</h3>
              <Badge variant={getTypeVariant(channel.type)} className="mt-1">
                {channel.type}
              </Badge>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-56 bg-popover border border-border shadow-lg"
            >
              <DropdownMenuItem 
                onClick={() => onEdit(channel)}
                className="cursor-pointer"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              {channel.type === 'E-commerce' && onManageSubChannels && (
                <DropdownMenuItem 
                  onClick={() => onManageSubChannels(channel)}
                  className="cursor-pointer"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Gerenciar Sub-Canais
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onDelete(channel.id)}
                className="cursor-pointer text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              channel.is_active ? 'bg-success' : 'bg-muted-foreground'
            }`} />
            <span className={`text-sm ${
              channel.is_active ? 'text-success' : 'text-muted-foreground'
            }`}>
              {channel.is_active ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}