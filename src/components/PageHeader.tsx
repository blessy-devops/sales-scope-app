import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Store, 
  Target, 
  DollarSign,
  Settings,
  Wifi,
  WifiOff,
  Plus
} from 'lucide-react';

interface PageHeaderProps {
  title?: string;
  description?: string;
  children?: ReactNode;
  onNewChannel?: () => void;
}

const pageInfo = {
  '/': {
    title: 'Dashboard',
    description: 'Visão geral das vendas e metas',
    icon: LayoutDashboard
  },
  '/channels': {
    title: 'Canais de Venda',
    description: 'Gerencie seus canais de vendas',
    icon: Store
  },
  '/targets': {
    title: 'Metas',
    description: 'Configure suas metas mensais',
    icon: Target
  },
  '/sales': {
    title: 'Lançar Vendas',
    description: 'Registre suas vendas diárias',
    icon: DollarSign
  },
  '/settings': {
    title: 'Configurações',
    description: 'Personalize sua experiência',
    icon: Settings
  }
};

export function PageHeader({ title, description, children, onNewChannel }: PageHeaderProps) {
  const location = useLocation();
  const { isConnected, lastUpdate } = useRealTimeUpdates();
  const currentPath = location.pathname;
  
  const info = pageInfo[currentPath as keyof typeof pageInfo];
  const IconComponent = info?.icon || LayoutDashboard;
  
  const pageTitle = title || info?.title || 'Sales Scope';
  const pageDescription = description || info?.description || '';

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <IconComponent className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
            {pageDescription && (
              <p className="text-sm text-muted-foreground">{pageDescription}</p>
            )}
          </div>
        </div>
        
        {/* Status de Conexão (apenas no dashboard) */}
        {currentPath === '/' && (
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-success" />
                <span className="text-success">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Offline</span>
              </>
            )}
            {lastUpdate && (
              <span className="text-muted-foreground">
                · {format(lastUpdate, 'HH:mm', { locale: ptBR })}
              </span>
            )}
          </div>
        )}
        
        {/* Botão específico para Canais */}
        {currentPath === '/channels' && onNewChannel && (
          <Button onClick={onNewChannel} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Canal
          </Button>
        )}
        
        {children && (
          <div className="flex items-center gap-2">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}