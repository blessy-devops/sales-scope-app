import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { PageHeader } from './PageHeader';
import { Button } from '@/components/ui/button';
import { Download, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';

interface LayoutProps {
  children: ReactNode;
  onNewChannel?: () => void;
}

export function Layout({ children, onNewChannel }: LayoutProps) {
  const { toast } = useToast();
  const location = useLocation();
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

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
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50 dark:bg-slate-950">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Page Header */}
          <PageHeader onNewChannel={onNewChannel}>
            <div className="flex items-center gap-2 justify-between w-full">
              <SidebarTrigger />
              
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
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    {user?.email}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Sair</span>
                  </Button>
                </div>
              </div>
            </div>
          </PageHeader>

          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-gray-50 dark:bg-slate-950">
            <div className="min-h-full">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}