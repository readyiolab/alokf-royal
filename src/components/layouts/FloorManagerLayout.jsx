import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  LayoutGrid, 
  LogOut,
  Menu,
  Bell,
  Settings,
  ChevronLeft,
  
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const FloorManagerLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigation = [
    {
      name: 'Floor Manager',
      href: '/floor-manager',
      icon: LayoutGrid,
      description: 'Manage tables, dealers, and players'
    },
   
  ];

  const isActive = (path) => location.pathname === path;

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || 'FM';
  };

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full bg-white shadow-lg ${mobile ? '' : 'hidden lg:flex'}`}>
      {/* Logo */}
      <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-5 py-4 border-b border-gray-200`}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3">
            <div className="leading-tight">
              <h1 className="text-black font-bold text-base">RoyalFlush</h1>
              <p className="text-xs text-gray-600">Floor Manager</p>
            </div>
          </div>
        )}
        {!mobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-gray-600 hover:text-black hover:bg-gray-100"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        <TooltipProvider delayDuration={300}>
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            const linkContent = (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => mobile && setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                  transition-all duration-150
                  ${active 
                    ? 'bg-emerald-600 text-white shadow-lg' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                  }
                  ${sidebarCollapsed ? 'justify-center px-2' : ''}
                `}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {item.badge > 0 && (
                      <Badge className="ml-auto bg-red-600 hover:bg-red-700 text-white">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            );

            return sidebarCollapsed ? (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  {linkContent}
                </TooltipTrigger>
                <TooltipContent side="right" className="flex items-center gap-2">
                  {item.name}
                  {item.badge > 0 && (
                    <Badge className="ml-1 bg-red-600 text-white">
                      {item.badge}
                    </Badge>
                  )}
                </TooltipContent>
              </Tooltip>
            ) : linkContent;
          })}
        </TooltipProvider>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-200 mt-auto">
        {sidebarCollapsed ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <Avatar className="w-10 h-10 cursor-pointer shadow-md">
                    <AvatarFallback className="bg-emerald-600 text-white font-semibold">
                      {getInitials(user?.full_name || user?.username)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className="text-sm">
                  <p className="font-medium">{user?.full_name || user?.username}</p>
                  <p className="text-gray-600 text-xs">Floor Manager</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors shadow-sm">
            <Avatar className="w-10 h-10 shadow-md">
              <AvatarFallback className="bg-emerald-600 text-white font-semibold">
                {getInitials(user?.full_name || user?.username)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-black truncate">
                {user?.full_name || user?.username}
              </p>
              <p className="text-xs text-gray-600">Floor Manager</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-72'} transition-all duration-300 hidden lg:block flex-shrink-0`}>
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-72 bg-white">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex-shrink-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-black hover:bg-gray-100"
              >
                <Menu className="w-6 h-6" />
              </Button>
              <div>
                <h2 className="text-xl font-bold text-black">
                  {navigation.find(nav => isActive(nav.href))?.name || 'Floor Manager'}
                </h2>
                <p className="text-sm text-gray-600">
                  Manage tables and players
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative text-gray-600 hover:text-black hover:bg-gray-100"
              >
                <Bell className="w-5 h-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-600 hover:text-black hover:bg-gray-100">
                    <Settings className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Floor Manager Menu</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Avatar className="w-9 h-9 hidden md:flex shadow-md">
                <AvatarFallback className="bg-emerald-600 text-white">
                  {getInitials(user?.full_name || user?.username)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 lg:p-6">
            {children || <Outlet />}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
            <p>© 2024 RoyalFlush Casino. All rights reserved.</p>
            <div className="flex space-x-4 mt-2 md:mt-0">
              <span>Floor Manager: {user?.username}</span>
              <span>•</span>
              <span>{new Date().toLocaleTimeString('en-IN', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default FloorManagerLayout;

