import { useState } from 'react';
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
  ChevronRight,
  LogOut,
  HelpCircle,
  BarChart3,
  Wrench,
  ShoppingBag,
  Megaphone
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const menuItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'E-commerce', url: '/ecommerce', icon: ShoppingBag },
  { title: 'Canais de Venda', url: '/channels', icon: Store },
  { title: 'Metas', url: '/targets', icon: Target },
  { title: 'Campanhas', url: '/campanhas', icon: Megaphone },
  { title: 'Lançar Vendas', url: '/sales', icon: DollarSign },
  { title: 'Análises', url: '/analises', icon: BarChart3 },
  { title: 'Ferramentas', url: '/ferramentas', icon: Wrench },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: (collapsed: boolean) => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const handleSignOut = async () => {
    await signOut();
  };

  const toggleSidebar = () => {
    onToggle(!collapsed);
  };

  const SidebarItem = ({ children, tooltip, ...props }: any) => {
    if (collapsed && tooltip) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {children}
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    return children;
  };

  return (
    <TooltipProvider>
      <div 
        className={cn(
          "fixed left-0 top-0 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transition-all duration-300 flex-shrink-0 flex flex-col h-screen z-40",
          collapsed ? 'w-16' : 'w-64'
        )}
        style={{
          minWidth: collapsed ? '64px' : '256px',
          maxWidth: collapsed ? '64px' : '256px'
        }}
      >
        {/* Header com Logo */}
        <div className={cn(
          "border-b border-gray-200 dark:border-slate-800",
          collapsed ? "p-3" : "p-6"
        )}>
          <div className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "gap-3"
          )}>
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
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 p-4">
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const active = isActive(item.url);
              
              return (
                <SidebarItem key={item.title} tooltip={collapsed ? item.title : undefined}>
                  <NavLink
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
                     {active && !collapsed && (
                       <div className="absolute right-3 w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                     )}
                  </NavLink>
                </SidebarItem>
              );
            })}
          </nav>
        </div>

        {/* Footer com Dark Mode e Configurações */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-800 space-y-2">
          {/* Dark Mode Toggle */}
          <SidebarItem tooltip={collapsed ? (theme === 'dark' ? 'Modo Claro' : 'Modo Escuro') : undefined}>
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
                   <Sun className="w-5 h-5 flex-shrink-0" />
                 ) : (
                   <Moon className="w-5 h-5 flex-shrink-0" />
                 )}
               {!collapsed && (
                 <span className="font-semibold text-sm">
                   {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                 </span>
               )}
             </button>
          </SidebarItem>

          {/* Configurações */}
          <SidebarItem tooltip={collapsed ? 'Configurações' : undefined}>
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
                   "w-5 h-5 flex-shrink-0",
                   isActive('/settings') ? "text-indigo-600 dark:text-indigo-400" : ""
                 )} />
               {!collapsed && (
                 <span className="font-semibold text-sm">Configurações</span>
               )}
               {isActive('/settings') && !collapsed && (
                 <div className="absolute right-3 w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
               )}
            </NavLink>
          </SidebarItem>

          {/* Logout */}
          <SidebarItem tooltip={collapsed ? 'Sair' : undefined}>
             <button
               onClick={handleSignOut}
               className={cn(
                 "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full",
                 "hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400",
                 "hover:text-red-700 dark:hover:text-red-300",
                 collapsed ? "justify-center" : "justify-start"
               )}
             >
                <LogOut className="w-5 h-5 flex-shrink-0" />
               {!collapsed && (
                 <span className="font-semibold text-sm">Sair</span>
               )}
             </button>
          </SidebarItem>

          {/* Collapse Button */}
          <SidebarItem tooltip={collapsed ? 'Expandir' : 'Recolher'}>
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
                   <ChevronRight className="w-5 h-5 flex-shrink-0" />
                 ) : (
                   <ChevronLeft className="w-5 h-5 flex-shrink-0" />
                 )}
               {!collapsed && (
                 <span className="font-medium text-sm">Recolher</span>
               )}
             </button>
          </SidebarItem>
        </div>
      </div>
    </TooltipProvider>
  );
}