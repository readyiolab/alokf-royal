// src/components/layouts/CashierLayout.jsx
// FIXED VERSION - Properly detects shifts after session start

import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSession } from '../../contexts/Sessioncontext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookOpen,
  Coins,
  CreditCard,
  Users,
  LogOut,
  Calendar,
  User,
  ChevronDown,
  RefreshCw,
  Receipt,
  Settings2,
  Wallet,
  FileText,
  UserPlus,
  Play,
  Download,
  Gift
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import cashierShiftService from '../../services/cashier-shift.service';
import userService from '../../services/user.service';
import { toast } from 'sonner';

const CashierLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { session, dashboard, loading, hasActiveSession, refresh: refreshSession } = useSession();
  const location = useLocation();
  const navigate = useNavigate();

  // Shift tracking state
  const [activeShift, setActiveShift] = useState(null);
  const [sessionCashiers, setSessionCashiers] = useState(null);
  const [showEndShiftDialog, setShowEndShiftDialog] = useState(false);
  const [shiftReport, setShiftReport] = useState(null);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [shiftTimer, setShiftTimer] = useState('00:00:00');
  const [showAssignCashierDialog, setShowAssignCashierDialog] = useState(false);
  const [availableCashiers, setAvailableCashiers] = useState([]);
  const [selectedCashierId, setSelectedCashierId] = useState('');
  const [assigningShift, setAssigningShift] = useState(false);
  const [allCashiers, setAllCashiers] = useState([]);
  const [allSessionShifts, setAllSessionShifts] = useState([]);

  // ✅ FIXED: Check session_id properly (0 is valid)
  const hasValidSession = hasActiveSession && 
                          session && 
                          (session.session_id !== null && session.session_id !== undefined);

  // ✅ FIX: Fetch shift info whenever session becomes active
  useEffect(() => {
    if (hasValidSession) {
      console.log('📍 Session is active (ID:', session.session_id, '), fetching shift info...');
      fetchShiftInfo();
    } else {
      console.log('📍 No active session, clearing shift info');
      setActiveShift(null);
      setSessionCashiers(null);
      setAllSessionShifts([]);
    }
  }, [hasValidSession, session?.session_id]);

  // ✅ FIX: Also refresh when session data changes (after starting)
  useEffect(() => {
    if (hasValidSession && session?.opened_at) {
      console.log('📍 Session data changed (opened_at), refreshing shift info in 2s...');
      const timer = setTimeout(() => {
        console.log('🔄 Now fetching shift info...');
        fetchShiftInfo();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [session?.opened_at, hasValidSession]);

  // Shift timer - update every second
  useEffect(() => {
    if (!activeShift || !activeShift.started_at) {
      setShiftTimer('00:00:00');
      return;
    }

    const updateTimer = () => {
      const started = new Date(activeShift.started_at);
      const now = new Date();
      const diff = Math.floor((now - started) / 1000);

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      setShiftTimer(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [activeShift?.started_at]);

  // ✅ FIXED: Find the CURRENT USER's active shift
  const fetchShiftInfo = async () => {
    if (!hasValidSession) {
      console.log('❌ Cannot fetch shift info: no valid session');
      setActiveShift(null);
      setSessionCashiers(null);
      setAllSessionShifts([]);
      return;
    }

    try {
      console.log('🔍 Fetching shift info for session:', session.session_id);
      const [cashiersRes, shiftsRes] = await Promise.all([
        cashierShiftService.getSessionCashiersInfo(),
        cashierShiftService.getAllShifts()
      ]);

      console.log('📊 Cashiers response:', cashiersRes);
      console.log('📊 Shifts response:', shiftsRes);

      if (cashiersRes.success) {
        setSessionCashiers(cashiersRes.data);
      }

      if (shiftsRes.success && shiftsRes.data) {
        setAllSessionShifts(shiftsRes.data);
        
        // ✅ FIX: Get current user's ID (could be user_id or cashier_id)
        const currentUserId = user?.user_id || user?.cashier_id;
        console.log('👤 Current user ID:', currentUserId, 'user object:', user);
        
        // Find active shift for CURRENT USER
        const currentUserShift = shiftsRes.data.find(s => {
          const isActive = s.is_active === 1 || s.is_active === true || 
                          s.is_active === '1' || parseInt(s.is_active) === 1;
          
          // ✅ Compare cashier_id with multiple possible user ID fields
          const shiftCashierId = parseInt(s.cashier_id);
          const userId = parseInt(currentUserId);
          const isCurrentUser = shiftCashierId === userId;
          
          console.log(`  Shift ${s.shift_id}: cashier_id=${s.cashier_id}, currentUserId=${currentUserId}, isActive=${isActive}, isCurrentUser=${isCurrentUser}`);
          
          return isActive && isCurrentUser;
        });
        
        // ✅ If no shift found for current user, find ANY active shift (for display purposes)
        let displayShift = currentUserShift;
        if (!displayShift) {
          displayShift = shiftsRes.data.find(s => {
            const isActive = s.is_active === 1 || s.is_active === true || 
                            s.is_active === '1' || parseInt(s.is_active) === 1;
            return isActive;
          });
          console.log('🔍 No shift for current user, showing any active shift:', displayShift);
        }
        
        console.log('🟢 Active shift to display:', displayShift);
        setActiveShift(displayShift || null);
      }
    } catch (err) {
      console.error('❌ Error fetching shift info:', err);
      setActiveShift(null);
      setSessionCashiers(null);
      setAllSessionShifts([]);
    }
  };

  const handleStartShift = async () => {
    try {
      const res = await cashierShiftService.startShift(false);
      if (res.success) {
        setActiveShift(res.data);
        fetchShiftInfo();
        refreshSession();
      }
    } catch (err) {
      console.error('Error starting shift:', err);
      toast.error(err.message || 'Failed to start shift');
    }
  };

  // Fetch all cashiers for dropdown
  useEffect(() => {
    const fetchAllCashiers = async () => {
      try {
        const response = await userService.getAllUsers('cashier');
        const cashiersList = response?.data || response || [];
        setAllCashiers(cashiersList.filter(c => c.is_active !== 0));
      } catch (err) {
        console.error('Error fetching cashiers:', err);
      }
    };

    fetchAllCashiers();
  }, []);

  // Fetch available cashiers when assign dialog opens
  useEffect(() => {
    const fetchAvailableCashiers = async () => {
      if (!showAssignCashierDialog || !hasValidSession) return;

      try {
        const response = await userService.getAllUsers('cashier');
        const allCashiersList = response?.data || response || [];
        const activeCashiers = allCashiersList.filter(c => c.is_active !== 0);

        if (allSessionShifts && allSessionShifts.length > 0) {
          const activeShiftCashierIds = allSessionShifts
            .filter(s => s.is_active === 1 || s.is_active === true || s.is_active === '1')
            .map(s => parseInt(s.cashier_id));
          const available = activeCashiers.filter(c => {
            const cashierId = parseInt(c.cashier_id || c.user_id);
            return !activeShiftCashierIds.includes(cashierId);
          });
          setAvailableCashiers(available);
        } else {
          setAvailableCashiers(activeCashiers);
        }
      } catch (err) {
        console.error('Error fetching cashiers:', err);
        toast.error('Failed to load cashiers');
      }
    };

    fetchAvailableCashiers();
  }, [showAssignCashierDialog, hasValidSession, allSessionShifts]);

  const handleAssignCashier = async () => {
    if (!selectedCashierId) {
      toast.error('Please select a cashier');
      return;
    }

    setAssigningShift(true);
    try {
      const res = await cashierShiftService.startShift(false, parseInt(selectedCashierId));
      if (res.success) {
        toast.success(`Shift started for cashier successfully`);
        setShowAssignCashierDialog(false);
        setSelectedCashierId('');
        setShiftReport(null);
        setHandoverNotes('');
        fetchShiftInfo();
        refreshSession();
      }
    } catch (err) {
      console.error('Error assigning cashier:', err);
      toast.error(err.message || 'Failed to start shift for cashier');
    } finally {
      setAssigningShift(false);
    }
  };

  const formatShiftDuration = (startTime) => {
    if (!startTime) return '0h 0m';
    const started = new Date(startTime);
    const now = new Date();
    const diffMs = now - started;
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    return `${hours}h ${minutes}m`;
  };

  const handleEndShift = async () => {
    if (!activeShift || !activeShift.shift_id) {
      toast.error('No active shift found. Please refresh the page.');
      setShowEndShiftDialog(false);
      return;
    }

    try {
      const res = await cashierShiftService.endShift(activeShift.shift_id, handoverNotes);

      if (res.success) {
        setShiftReport(res.data);
        setActiveShift(null);
        fetchShiftInfo();
        toast.success('Shift ended successfully');
      } else {
        toast.error(res.message || 'Failed to end shift');
      }
    } catch (err) {
      console.error('Error ending shift:', err);
      toast.error(err.message || 'Failed to end shift. Please try again.');
    }
  };

  const downloadShiftReport = async () => {
    if (!shiftReport) return;

    try {
      const blob = await cashierShiftService.downloadShiftReportCSV(shiftReport.shift_id);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `shift_report_${shiftReport.shift_id}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading report:', err);
    }
  };

  const handleLogout = async () => {
    if (activeShift) {
      setShowEndShiftDialog(true);
      return;
    }
    await logout();
    navigate('/login', { replace: true });
  };

  // Navigation items
  const navigation = [
    { name: 'Dashboard', href: '/cashier/dashboard', icon: Receipt },
    { name: 'Daily Cashbook', href: '/cashier/cashbook', icon: BookOpen },
    { name: 'Chip Ledger', href: '/cashier/chip-ledger', icon: Coins },
    { name: 'Credit Register', href: '/cashier/credit-register', icon: CreditCard },
    { name: 'Float & Chips Log', href: '/cashier/float-chips-log', icon: Wallet },
    { name: 'Players', href: '/cashier/players', icon: Users },
    { name: 'Promotion Management', href: '/cashier/promotions', icon: Gift },
    { name: 'Cashier Management', href: '/cashier/cashier-management', icon: Settings2 },
  ];

  const formatDate = () => {
    return new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar 
          collapsible="icon" 
          className="border-r border-gray-200 bg-white"
          style={{
            '--sidebar-width-icon': '6rem'
          }}
        >
          <SidebarHeader className="border-b border-gray-100 p-4 group-data-[collapsible=icon]:p-5 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md group-data-[collapsible=icon]:w-14 group-data-[collapsible=icon]:h-14">
                <Coins className="w-6 h-6 text-white group-data-[collapsible=icon]:w-7 group-data-[collapsible=icon]:h-7" />
              </div>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden min-w-0">
                <h1 className="font-bold text-gray-900 text-base leading-tight">Royal Flush</h1>
                <p className="text-xs text-gray-500 leading-tight">Cashier Module</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-3 group-data-[collapsible=icon]:p-5">
            <SidebarGroup>
              <SidebarMenu className="space-y-2 group-data-[collapsible=icon]:space-y-4">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.name}
                        className={`sidebar-nav-item-custom h-14 px-4 group-data-[collapsible=icon]:h-14 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto ${isActive ? 'active' : ''}`}
                      >
                        <NavLink to={item.href} className="flex items-center gap-4 w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
                          <div className={`icon-wrapper-custom flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 group-data-[collapsible=icon]:w-14 group-data-[collapsible=icon]:h-14 group-data-[collapsible=icon]:rounded-lg ${isActive ? 'active-icon' : ''}`}>
                            <Icon className="w-6 h-6 flex-shrink-0 transition-all duration-300 group-hover/menu-button:scale-110 group-data-[collapsible=icon]:w-7 group-data-[collapsible=icon]:h-7 text-white" />
                          </div>
                          <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">{item.name}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-100 p-3 group-data-[collapsible=icon]:p-5">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  tooltip="Logout"
                  className="sidebar-nav-item-custom h-14 px-4 text-gray-600 hover:bg-red-50 hover:text-red-600 group-data-[collapsible=icon]:h-14 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto"
                >
                  <div className="icon-wrapper-custom flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 bg-gray-200 group-data-[collapsible=icon]:w-14 group-data-[collapsible=icon]:h-14 group-data-[collapsible=icon]:rounded-lg">
                    <LogOut className="w-6 h-6 flex-shrink-0 transition-all duration-300 group-hover/menu-button:scale-110 group-data-[collapsible=icon]:w-7 group-data-[collapsible=icon]:h-7 text-gray-600" />
                  </div>
                  <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset className="flex flex-col bg-gray-50">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="mr-2" />
              <div className="flex items-center gap-2 text-gray-900">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-semibold">{user?.full_name || user?.username || 'Cashier'}</span>
              </div>
            </div>

          <div className="flex items-center gap-4">
            {/* Date and Shift Start Time */}
            <div className="flex items-center gap-2 text-gray-600 bg-gray-100 p-2 rounded-lg">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">{formatDate()}</span>
              {activeShift && activeShift.started_at && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-xs text-gray-500">
                    Started: {new Date(activeShift.started_at).toLocaleTimeString('en-IN', { 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      hour12: true 
                    })}
                  </span>
                </>
              )}
            </div>

            {/* Shift Status Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  {activeShift ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <div className="flex justify-center items-center gap-5">
                        <span className="text-green-600 font-semibold">
                          {activeShift.cashier_name || activeShift.full_name || 'On Duty'}
                        </span>
                        {shiftTimer && (
                          <span className="text-xs text-gray-500 font-mono">{shiftTimer}</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4" />
                      <div className="flex flex-col items-start">
                        {hasValidSession ? (
                          <span className="text-gray-600">No Active Shift</span>
                        ) : (
                          <span>No Active Session</span>
                        )}
                      </div>
                    </>
                  )}
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 max-h-[600px] overflow-y-auto">
                {/* Current Shift Section */}
                {activeShift && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b">
                      Current Shift
                    </div>
                    <div className="px-3 py-2">
                      <div className="font-semibold text-gray-900">{activeShift.cashier_name || activeShift.full_name || 'Cashier'}</div>
                      <div className="text-xs text-green-600 mt-0.5">
                        Started: {new Date(activeShift.started_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </div>
                      <DropdownMenuItem
                        onClick={() => setShowEndShiftDialog(true)}
                        className="mt-2 text-red-600 focus:text-red-600 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        End My Shift
                      </DropdownMenuItem>
                    </div>
                    <div className="border-t my-1"></div>
                  </>
                )}

                {/* All Cashiers Section */}
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b">
                  All Cashiers
                </div>
                {allCashiers.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">Loading cashiers...</div>
                ) : (
                  allCashiers.map((cashier) => {
                    const cashierId = parseInt(cashier.cashier_id || cashier.user_id);
                    const cashierShift = allSessionShifts.find(s => {
                      const shiftCashierId = parseInt(s.cashier_id);
                      const isActive = s.is_active === 1 || s.is_active === true || s.is_active === '1' || parseInt(s.is_active) === 1;
                      return shiftCashierId === cashierId && isActive;
                    });
                    const isOnDuty = !!cashierShift;

                    return (
                      <div key={cashierId} className="px-3 py-2 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <div className={`w-2 h-2 rounded-full ${isOnDuty ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{cashier.full_name || cashier.username}</div>
                              {isOnDuty && (
                                <div className="text-xs text-green-600 mt-0.5">On Duty</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!isOnDuty && hasValidSession && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const res = await cashierShiftService.startShift(false, cashierId);
                                    if (res.success) {
                                      toast.success(`Shift started for ${cashier.full_name || cashier.username}`);
                                      fetchShiftInfo();
                                      refreshSession();
                                    }
                                  } catch (err) {
                                    toast.error(err.message || 'Failed to start shift');
                                  }
                                }}
                                className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 font-medium"
                              >
                                <Play className="w-4 h-4" />
                                Start Shift
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                {!hasValidSession && (
                  <div className="px-3 py-2 text-sm text-gray-500 italic border-t mt-1">
                    No active session
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Refresh */}
            <button
              className="p-2 rounded-lg hover:bg-gray-100"
              onClick={() => {
                refreshSession();
                fetchShiftInfo();
              }}
              disabled={loading}
            >
              <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {children || <Outlet context={{ activeShift, handleStartShift, formatCurrency }} />}
          </main>
        </SidebarInset>
      </div>

      {/* End Shift Dialog */}
      <Dialog
        open={showEndShiftDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowEndShiftDialog(false);
            setShiftReport(null);
            setHandoverNotes('');
          } else if (!activeShift || !activeShift.shift_id) {
            toast.error('No active shift found. Please refresh the page.');
            setShowEndShiftDialog(false);
          } else {
            setShowEndShiftDialog(open);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">End Your Shift?</DialogTitle>
          </DialogHeader>

          {!shiftReport ? (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-3">
                  <p className="text-sm text-gray-900">
                    You are about to end your shift as <span className="font-bold">{activeShift?.cashier_name || activeShift?.full_name || user?.full_name || 'Cashier'}</span>.
                  </p>
                  <p className="text-sm text-gray-900">
                    Shift duration: <span className="font-bold">{activeShift?.started_at ? formatShiftDuration(activeShift.started_at) : '0h 0m'}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Another cashier can start their shift after this.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowEndShiftDialog(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEndShift}
                  disabled={!activeShift || !activeShift.shift_id}
                  className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  End Shift
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">✅ Shift Completed</h4>
                  <p className="text-sm text-green-700">Duration: {shiftReport.duration_formatted}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-600">Transactions</p>
                    <p className="font-bold text-lg">{shiftReport.statistics?.total_transactions || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-600">Players Served</p>
                    <p className="font-bold text-lg">{shiftReport.statistics?.unique_players || 0}</p>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={downloadShiftReport} className="w-full sm:w-auto">
                  Download CSV
                </Button>
                <Button
                  onClick={() => {
                    setShowEndShiftDialog(false);
                    setShowAssignCashierDialog(true);
                  }}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign New Cashier
                </Button>
                <Button
                  onClick={() => {
                    setShowEndShiftDialog(false);
                    setShiftReport(null);
                    setHandoverNotes('');
                  }}
                  className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600"
                >
                  Done
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign New Cashier Dialog */}
      <Dialog open={showAssignCashierDialog} onOpenChange={setShowAssignCashierDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign New Cashier</DialogTitle>
            <DialogDescription>
              Select a cashier to start their shift
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Cashier</Label>
              <Select
                value={selectedCashierId}
                onValueChange={setSelectedCashierId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a cashier..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCashiers.length > 0 ? (
                    availableCashiers.map((cashier) => (
                      <SelectItem key={cashier.user_id || cashier.cashier_id} value={(cashier.user_id || cashier.cashier_id)?.toString()}>
                        {cashier.full_name || cashier.username}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>No available cashiers</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {availableCashiers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  All active cashiers already have shifts running.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignCashierDialog(false);
                setSelectedCashierId('');
                setShiftReport(null);
                setHandoverNotes('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignCashier}
              disabled={!selectedCashierId || assigningShift || availableCashiers.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {assigningShift ? 'Starting...' : 'Start Shift'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default CashierLayout;