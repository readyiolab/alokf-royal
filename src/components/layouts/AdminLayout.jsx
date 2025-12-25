import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSession } from '../../contexts/Sessioncontext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  FileText, 
  Calendar,
  BadgeCheck,
  LogOut,
  Menu,
  Bell,
  Settings,
  ChevronLeft,
  AlertCircle,
  StopCircle,
  DollarSign,
  Wallet,
  UserCog,
  HandCoins
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const { 
    sessionStatus, 
    isLoadingSession, 
    openSession,
    closeSession 
  } = useSession();
  
  const [showOpenSessionDialog, setShowOpenSessionDialog] = useState(false);
  const [showCloseSessionDialog, setShowCloseSessionDialog] = useState(false);
  const [floatAmount, setFloatAmount] = useState('');
  const [isOpeningSession, setIsOpeningSession] = useState(false);
  const [isClosingSession, setIsClosingSession] = useState(false);
  const [dialogError, setDialogError] = useState('');

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Sessions', href: '/admin/sessions', icon: Calendar },
    { name: 'User Management', href: '/admin/users', icon: Users, description: 'Manage cashiers & floor managers' },
    { name: 'Players', href: '/admin/players', icon: UserCog },
    { name: 'Staff', href: '/admin/staff', icon: UserCog },
    { name: 'Dealers', href: '/admin/dealers', icon: HandCoins },
    { name: 'KYC Management', href: '/admin/kyc', icon: BadgeCheck },
    { name: 'Credit Approvals', href: '/admin/credits', icon: CreditCard, badge: 3 },
  ];

  const isActive = (path) => location.pathname === path;

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || 'A';
  };

  const getSessionActive = () => {
    if (!sessionStatus) return false;
    return sessionStatus.has_active_session === true || sessionStatus?.data?.has_active_session === true;
  };

  const handleOpenSessionClick = () => {
    setShowOpenSessionDialog(true);
    setFloatAmount('');
    setDialogError('');
  };

  const handleOpenSession = async () => {
    const floatValue = parseFloat(floatAmount);
    
    if (!floatAmount || isNaN(floatValue) || floatValue <= 0) {
      setDialogError('Please enter a valid float amount greater than 0');
      return;
    }

    setIsOpeningSession(true);
    setDialogError('');

    try {
      await openSession(floatValue, null); // ✅ NO chip inventory - just money
      
      setShowOpenSessionDialog(false);
      setFloatAmount('');
      setDialogError('');
    } catch (error) {
      setDialogError(error.message || 'Failed to open session');
      console.error('Open session error:', error);
    } finally {
      setIsOpeningSession(false);
    }
  };

  const handleCloseSession = async () => {
    setIsClosingSession(true);
    setDialogError('');

    try {
      await closeSession();
      setShowCloseSessionDialog(false);
      setDialogError('');
    } catch (error) {
      setDialogError(error.message || 'Failed to close session');
      console.error('Close session error:', error);
    } finally {
      setIsClosingSession(false);
    }
  };

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full bg-white border-r-2 border-black ${mobile ? '' : 'hidden lg:flex'}`}>
      <div className={`flex items-center px-5 py-4 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3">
            <div className="leading-tight">
              <h1 className="text-black font-bold text-base">RoyalFlush</h1>
              <p className="text-xs text-gray-600">Admin Panel</p>
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

      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        <TooltipProvider delayDuration={300}>
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            const linkElement = (
              <Link
                to={item.href}
                onClick={() => mobile && setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                  transition-all duration-150 border-2
                  ${active
                    ? 'bg-black text-white border-black shadow-lg'
                    : 'text-gray-700 border-transparent hover:bg-gray-100 hover:text-black'
                  }
                  ${sidebarCollapsed ? 'justify-center px-2' : ''}
                `}
              >
                <Icon className="w-5 h-5 shrink-0" />

                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <Badge className="ml-auto bg-red-600 hover:bg-red-700 text-white">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            );

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    {linkElement}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-2">
                    {item.name}
                    {item.badge && (
                      <Badge className="ml-1 bg-red-600 text-white">
                        {item.badge}
                      </Badge>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            }
            
            return (
              <div key={item.name}>
                {linkElement}
              </div>
            );
          })}
        </TooltipProvider>
      </nav>

      <div className="p-4 mt-auto">
        {sidebarCollapsed ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <Avatar className="w-10 h-10 cursor-pointer border-2 border-black">
                    <AvatarFallback className="bg-black text-white font-semibold">
                      {getInitials(user?.full_name || user?.username)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className="text-sm">
                  <p className="font-medium">{user?.full_name || user?.username}</p>
                  <p className="text-gray-600 text-xs">{user?.email}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-100 border-2 border-gray-300 hover:border-black transition-all">
            <Avatar className="w-10 h-10 border-black">
              <AvatarFallback className="bg-black text-white font-semibold">
                {getInitials(user?.full_name || user?.username)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-black truncate">
                {user?.full_name || user?.username}
              </p>
              <p className="text-xs text-gray-600 truncate">
                {user?.email}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 hidden lg:block flex-shrink-0`}>
        <Sidebar />
      </aside>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-white">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white px-4 lg:px-6 py-4 flex-shrink-0 border-b-2 border-gray-200">
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
                  {navigation.find(nav => isActive(nav.href))?.name || 'Admin Panel'}
                </h2>
                <p className="text-sm text-gray-600">
                  Welcome back, {user?.full_name || user?.username}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {isLoadingSession ? (
                <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 border border-gray-300">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                  <span className="text-xs text-gray-600">Checking session...</span>
                </div>
              ) : getSessionActive() ? (
                <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-lg bg-green-50 border-2 border-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-700 font-medium">Session Active</span>
                  <Button
                    size="sm"
                    onClick={() => setShowCloseSessionDialog(true)}
                    className="ml-2 h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
                  >
                    <StopCircle className="w-3 h-3 mr-1" />
                    Close
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={handleOpenSessionClick}
                  className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  <Calendar className="w-4 h-4" />
                  Start Session
                </Button>
              )}

              <Button variant="ghost" size="icon" className="relative text-gray-600 hover:text-black hover:bg-gray-100">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-600 hover:text-black hover:bg-gray-100">
                    <Settings className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Admin Menu</DropdownMenuLabel>
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

              <Avatar className="w-9 h-9 hidden md:flex border-2 border-black">
                <AvatarFallback className="bg-black text-white">
                  {getInitials(user?.full_name || user?.username)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 lg:p-6">
            {children || <Outlet />}
          </div>
        </main>

        <footer className="bg-white px-6 py-4 flex-shrink-0 border-t-2 border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
            <p>© 2024 RoyalFlush Casino. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {/* ✅ SIMPLE Open Session Dialog - MONEY ONLY */}
      <Dialog open={showOpenSessionDialog} onOpenChange={setShowOpenSessionDialog}>
        <DialogContent className="bg-white border-2 border-black max-w-md">
          <DialogHeader>
            <DialogTitle className="text-black text-2xl flex items-center gap-2">
              <Wallet className="w-6 h-6 text-green-600" />
              Open Daily Session
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Enter the owner's float amount (cash) to start today's operations. Cashier will handle chip inventory.
            </DialogDescription>
          </DialogHeader>

          {dialogError && (
            <Alert className="bg-red-50 border-2 border-red-600">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-600 text-sm">{dialogError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="float-amount" className="text-black font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Owner Float Amount (₹) *
              </Label>
              <Input
                id="float-amount"
                type="number"
                placeholder="Enter amount in rupees (e.g., 100000)"
                className="h-12 border-2 border-gray-300 text-lg"
                value={floatAmount}
                onChange={(e) => setFloatAmount(e.target.value)}
                disabled={isOpeningSession}
                autoFocus
              />
              <p className="text-xs text-gray-600 mt-1">
                💰 This is the cash float. Cashier will set chip inventory when starting work.
              </p>
            </div>

            <Alert className="bg-blue-50 border-2 border-blue-600">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-xs">
                <strong>Admin's Job:</strong> Provide cash float only<br />
                <strong>Cashier's Job:</strong> Set chip inventory and handle all transactions
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="gap-2">
            <Button
              onClick={() => {
                setShowOpenSessionDialog(false);
                setFloatAmount('');
                setDialogError('');
              }}
              disabled={isOpeningSession}
              className="border-2 border-gray-300 text-black bg-white hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleOpenSession}
              disabled={isOpeningSession || !floatAmount}
              className="bg-green-600 text-white font-semibold hover:bg-green-700"
            >
              {isOpeningSession ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Opening...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Open Session
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Session Dialog */}
      <Dialog open={showCloseSessionDialog} onOpenChange={setShowCloseSessionDialog}>
        <DialogContent className="bg-white border-2 border-black">
          <DialogHeader>
            <DialogTitle className="text-black text-2xl flex items-center gap-2">
              <StopCircle className="w-6 h-6 text-red-600" />
              Close Daily Session
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to close today's session? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {dialogError && (
            <Alert className="bg-red-50 border-2 border-red-600">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-600 text-sm">{dialogError}</AlertDescription>
            </Alert>
          )}

          <Alert className="bg-yellow-50 border-2 border-yellow-600">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700 text-xs">
              Make sure all chips are returned and pending credits are settled before closing.
            </AlertDescription>
          </Alert>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCloseSessionDialog(false);
                setDialogError('');
              }}
              disabled={isClosingSession}
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCloseSession}
              disabled={isClosingSession}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {isClosingSession ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Closing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <StopCircle className="w-4 h-4" />
                  Close Session
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLayout;