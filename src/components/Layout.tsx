import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { PageHeader } from './PageHeader';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';

interface LayoutProps {
  children: ReactNode;
  onNewChannel?: () => void;
}

export function Layout({ children, onNewChannel }: LayoutProps) {
  const { toast } = useToast();
  const location = useLocation();

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
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Page Header */}
          <PageHeader onNewChannel={onNewChannel}>
            <div className="flex items-center gap-2">
              <SidebarTrigger className="md:hidden" />
              
              {showExportButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToExcel}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Exportar</span>
                </Button>
              )}
            </div>
          </PageHeader>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}