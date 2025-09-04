import { ReactNode, useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { PageHeader } from './PageHeader';
import { UserDropdown } from './UserDropdown';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';
import { useDailySales } from '@/hooks/useDailySales';
import * as XLSX from 'xlsx';

interface LayoutProps {
  children: ReactNode;
  onNewChannel?: () => void;
}

export function Layout({ children, onNewChannel }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const { lastUpdated, refetchSales } = useDailySales();

  const exportToExcel = () => {
    try {
      // Dados mockados para demonstração
      const data = [
        { Canal: 'Shopify', Vendas: 15000, Meta: 20000, GAP: -25 },
        { Canal: 'Mercado Livre', Vendas: 22000, Meta: 18000, GAP: 22.2 },
        { Canal: 'Amazon', Vendas: 8500, Meta: 12000, GAP: -29.2 },
      ];

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Dashboard');
      
      XLSX.writeFile(workbook, `dashboard-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: 'Exportação concluída',
        description: 'Os dados foram exportados para Excel com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível exportar os dados.',
        variant: 'destructive',
      });
    }
  };

  // Mostrar botão de exportar apenas no dashboard
  const showExportButton = location.pathname === '/';

  return (
    <div className="min-h-screen">
      <AppSidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />
      
      <div className={`min-h-screen flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'pl-16' : 'pl-64'}`}>
        {/* Page Header */}
        <PageHeader 
          onNewChannel={onNewChannel}
          lastUpdated={location.pathname === '/' ? lastUpdated : undefined}
          onRefresh={location.pathname === '/' ? refetchSales : undefined}
        >
          <div className="flex items-center gap-2 justify-end w-full">
            
            <div className="flex items-center gap-2">
              {showExportButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToExcel}
                  className="gap-2 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Exportar</span>
                </Button>
              )}
              <UserDropdown />
            </div>
          </div>
        </PageHeader>

        {/* Main Content - ÁREA COM SCROLL */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}