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
  Plus,
  RefreshCcw
} from 'lucide-react';

interface PageHeaderProps {
  title?: string;
  description?: string;
  children?: ReactNode;
  onNewChannel?: () => void;
  lastUpdated?: Date | null;
  onRefresh?: () => void;
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

export function PageHeader({ title, description, children, onNewChannel, lastUpdated, onRefresh }: PageHeaderProps) {
  const location = useLocation();
  const { isConnected, lastUpdate } = useRealTimeUpdates();
  const currentPath = location.pathname;
  
  const info = pageInfo[currentPath as keyof typeof pageInfo];
  const IconComponent = info?.icon || LayoutDashboard;
  
  const pageTitle = title || info?.title || 'Analytics';
  const pageDescription = description || info?.description || '';

  return (
    <div className="border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between px-6 py-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">{pageTitle}</h1>
          {pageDescription && (
            <p className="text-sm text-gray-600 dark:text-slate-400 font-medium mt-0.5">{pageDescription}</p>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Status de Conexão ou Atualização (apenas no dashboard) */}
          {currentPath === '/' && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
              {lastUpdated && onRefresh ? (
                <>
                  <span className="text-gray-600 dark:text-slate-400 text-sm font-medium">
                    Atualizado às {format(lastUpdated, 'HH:mm', { locale: ptBR })}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRefresh}
                    className="h-6 w-6 hover:bg-gray-200 dark:hover:bg-slate-700"
                  >
                    <RefreshCcw className="w-3 h-3" />
                  </Button>
                </>
              ) : (
                <>
                  {isConnected ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-600 dark:text-green-400 text-sm font-medium">Online</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-gray-500 dark:text-slate-400 text-sm font-medium">Offline</span>
                    </>
                  )}
                  {lastUpdate && (
                    <span className="text-gray-500 dark:text-slate-400 text-xs">
                      · {format(lastUpdate, 'HH:mm', { locale: ptBR })}
                    </span>
                  )}
                </>
              )}
            </div>
          )}
          
          {/* Botão específico para Canais */}
          {currentPath === '/channels' && onNewChannel && (
            <Button 
              onClick={onNewChannel} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
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
    </div>
  );
}
