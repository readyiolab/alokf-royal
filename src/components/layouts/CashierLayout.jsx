import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSession } from '../../hooks/useSession';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowUpDown, 
  LogOut,
  Menu,
  Bell,
  Settings,
  ChevronLeft,
  DollarSign,
  AlertCircle,
  Wallet,
  Coins,
  Users
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

const CashierLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { session, dashboard, loading, error, hasActiveSession, refreshSession } = useSession();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Navigation for cashier - only transaction-related items
  const navigation = [
    {
      name: 'Quick Actions',
      href: '/cashier/transactions',
      icon: ArrowUpDown,
      description: 'Deposits and withdrawals',
      badge: dashboard?.total_transactions || 0
    },
    {
      name: 'Players  ',
      href: '/cashier/players',
      icon: Users,
      description: 'Manage player accounts',
      badge: dashboard?.total_players || 0
    },
  
    {
      name: 'CRM',
      href: '/cashier/crm',
      icon: Users,
      description: 'Manage player relationships and retention',
      badgeColor: 'bg-purple-100 text-purple-700'
    }
  ];

  const isActive = (path) => location.pathname === path;

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || 'C';
  };

  const formatCurrency = (amount) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(numAmount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full bg-white shadow-lg ${mobile ? '' : 'hidden lg:flex'}`}>
      {/* Logo */}
      <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-5 py-4 border-b border-gray-200`}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3">
            <div className="leading-tight">
              <h1 className="text-black font-bold text-base">RoyalFlush</h1>
              <p className="text-xs text-gray-600">Cashier Panel</p>
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
                    ? 'bg-black text-white shadow-lg' 
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
                    <AvatarFallback className="bg-blue-600 text-white font-semibold">
                      {getInitials(user?.full_name || user?.username)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className="text-sm">
                  <p className="font-medium">{user?.full_name || user?.username}</p>
                  <p className="text-gray-600 text-xs">Cashier</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors shadow-sm">
            <Avatar className="w-10 h-10 shadow-md">
              <AvatarFallback className="bg-blue-600 text-white font-semibold">
                {getInitials(user?.full_name || user?.username)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-black truncate">
                {user?.full_name || user?.username}
              </p>
              <p className="text-xs text-gray-600">Cashier</p>
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
                  {navigation.find(nav => isActive(nav.href))?.name || 'Cashier Panel'}
                </h2>
                <p className="text-sm text-gray-600">
                  {hasActiveSession 
                    ? `Session: ${formatDate(session?.session_date)}`
                    : 'No active session'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Refresh Button */}
              {/* <Button
                variant="ghost"
                size="icon"
                onClick={refreshSession}
                disabled={loading}
                className="text-gray-600 hover:text-black hover:bg-gray-100"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </Button> */}

              {/* Session Stats - Desktop */}
              {hasActiveSession && (
                <div className="hidden md:flex items-center space-x-6 px-4 py-2 bg-gray-100 rounded-lg border border-gray-200 shadow-sm">
                  {/* Primary Wallet */}
                  <div className="text-right">
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      CEO
                    </p>
                    <p className="text-sm font-semibold text-blue-700">
{formatCurrency(parseFloat(session?.primary_wallet || 0))}

                    </p>
                  </div>

                  <div className="h-8 w-px bg-gray-300"></div>

                  {/* Secondary Wallet */}
                  <div className="text-right">
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <Wallet className="w-3 h-3" />
                      Secondary
                    </p>
                    <p className="text-sm font-semibold text-green-700">
                      {formatCurrency(session?.secondary_wallet)}
                    </p>
                  </div>

                  <div className="h-8 w-px bg-gray-300"></div>

                  {/* Chips Out */}
                  <div className="text-right">
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <Coins className="w-3 h-3" />
                      Chips Out
                    </p>
                    <p className="text-sm font-semibold text-purple-700">
                      {dashboard?.chip_inventory?.with_players?.total_count ?? 0}
                    </p>
                  </div>

                  {/* Outstanding Credit */}
                  {parseFloat(dashboard?.outstanding_credit || 0) > 0 && (
                    <>
                      <div className="h-8 w-px bg-gray-300"></div>
                      <div className="text-right">
                        <p className="text-xs text-yellow-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Credit Out
                        </p>
                        <p className="text-sm font-semibold text-yellow-700">
                          {formatCurrency(dashboard?.outstanding_credit)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              <Button 
                variant="ghost" 
                size="icon" 
                className="relative text-gray-600 hover:text-black hover:bg-gray-100"
              >
                <Bell className="w-5 h-5" />
                {dashboard?.pending_credit_requests?.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full shadow-sm"></span>
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-600 hover:text-black hover:bg-gray-100">
                    <Settings className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Cashier Menu</DropdownMenuLabel>
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
                <AvatarFallback className="bg-blue-600 text-white">
                  {getInitials(user?.full_name || user?.username)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 lg:p-6">
            {error && (
              <Alert className="mb-4 bg-red-50 border border-red-200 shadow-sm">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error}
                  {/* <Button 
                    onClick={refreshSession}
                    size="sm"
                    className="ml-4 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Retry
                  </Button> */}
                </AlertDescription>
              </Alert>
            )}
            {children || <Outlet />}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
            <p>© 2024 RoyalFlush Casino. All rights reserved.</p>
            <div className="flex space-x-4 mt-2 md:mt-0">
              <span>Cashier: {user?.username}</span>
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

export default CashierLayout;