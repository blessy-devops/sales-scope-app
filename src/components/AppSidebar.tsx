import blessyLogo from '@/assets/blessy-logo.png';
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
        "bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800",
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header com Logo */}
      <SidebarHeader className="p-6 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
            <img 
              src={blessyLogo} 
              alt="Blessy Logo" 
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 dark:text-slate-100 text-lg truncate">
                Analytics
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                Performance Blessy
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation Menu */}
      <SidebarContent className="flex-1 p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const active = isActive(item.url);
            
            return (
              <NavLink
                key={item.title}
                to={item.url}
                end
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                  "hover:bg-gray-100 dark:hover:bg-slate-800",
                  collapsed ? "justify-center" : "justify-start",
                  active 
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                    : "text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100"
                )}
              >
                <IconComponent className={cn(
                  "flex-shrink-0 transition-all duration-200",
                  "w-5 h-5",
                  active ? "text-indigo-600 dark:text-indigo-400" : ""
                )} />
                {!collapsed && (
                  <span className="font-semibold truncate text-sm">
                    {item.title}
                  </span>
                )}
                {/* Active indicator */}
                {active && (
                  <div className="absolute right-3 w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                )}
              </NavLink>
            );
          })}
        </nav>
      </SidebarContent>

      {/* Footer com Dark Mode e Configurações */}
      <SidebarFooter className="p-4 border-t border-gray-200 dark:border-slate-800 space-y-2">
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full",
            "hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300",
            "hover:text-gray-900 dark:hover:text-slate-100",
            collapsed ? "justify-center" : "justify-start"
          )}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
          {!collapsed && (
            <span className="font-semibold text-sm">
              {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            </span>
          )}
        </button>

        {/* Configurações */}
        <NavLink
          to="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
            "hover:bg-gray-100 dark:hover:bg-slate-800",
            collapsed ? "justify-center" : "justify-start",
            isActive('/settings')
              ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100"
          )}
        >
          <Settings className={cn(
            "w-5 h-5",
            isActive('/settings') ? "text-indigo-600 dark:text-indigo-400" : ""
          )} />
          {!collapsed && (
            <span className="font-semibold text-sm">Configurações</span>
          )}
          {isActive('/settings') && (
            <div className="absolute right-3 w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
          )}
        </NavLink>

        {/* Collapse Button */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full",
            "hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-slate-400",
            "hover:text-gray-700 dark:hover:text-slate-300",
            collapsed ? "justify-center" : "justify-start"
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
          {!collapsed && (
            <span className="font-medium text-sm">Recolher</span>
          )}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}