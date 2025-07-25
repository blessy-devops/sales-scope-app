import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Store, 
  Target, 
  DollarSign,
  Settings,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

const menuItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Canais de Venda', url: '/channels', icon: Store },
  { title: 'Metas', url: '/targets', icon: Target },
  { title: 'Lançar Vendas', url: '/sales', icon: DollarSign },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const currentPath = location.pathname;

  const collapsed = state === 'collapsed';
  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar 
      className={cn(
        "border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header com Logo */}
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sidebar-foreground truncate">
                Sales Scope
              </h2>
              <p className="text-xs text-sidebar-foreground/60">
                Dashboard de Vendas
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation Menu */}
      <SidebarContent className="flex-1 p-2">
        <nav className="space-y-1">
          <SidebarMenu>
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const active = isActive(item.url);
              
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    className={cn(
                      "w-full justify-start transition-all duration-200 group relative",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      collapsed ? "px-3" : "px-3",
                      active && "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    )}
                  >
                    <NavLink to={item.url} end>
                      <IconComponent className={cn(
                        "flex-shrink-0 transition-all duration-200",
                        collapsed ? "w-5 h-5" : "w-5 h-5"
                      )} />
                      {!collapsed && (
                        <span className="font-medium truncate">
                          {item.title}
                        </span>
                      )}
                      {/* Active indicator */}
                      {active && !collapsed && (
                        <div className="absolute right-2 w-1.5 h-1.5 bg-sidebar-primary-foreground rounded-full" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </nav>
      </SidebarContent>

      {/* Footer com Dark Mode e Configurações */}
      <SidebarFooter className="border-t border-sidebar-border p-2 space-y-1">
        {/* Dark Mode Toggle */}
        <SidebarMenuButton
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={cn(
            "w-full justify-start transition-all duration-200",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed ? "px-3" : "px-3"
          )}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
          {!collapsed && (
            <span className="font-medium">
              {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            </span>
          )}
        </SidebarMenuButton>

        {/* Configurações */}
        <SidebarMenuButton
          asChild
          className={cn(
            "w-full justify-start transition-all duration-200",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed ? "px-3" : "px-3",
            isActive('/settings') && "bg-sidebar-primary text-sidebar-primary-foreground"
          )}
        >
          <NavLink to="/settings">
            <Settings className="w-5 h-5" />
            {!collapsed && (
              <span className="font-medium">Configurações</span>
            )}
          </NavLink>
        </SidebarMenuButton>

        {/* Collapse Button */}
        <SidebarMenuButton
          onClick={toggleSidebar}
          className={cn(
            "w-full justify-start transition-all duration-200",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed ? "px-3" : "px-3"
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
          {!collapsed && (
            <span className="font-medium">Recolher</span>
          )}
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}