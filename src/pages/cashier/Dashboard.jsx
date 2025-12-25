import { useState, useEffect } from "react";
import CashierLayout from "../../components/layouts/CashierLayout";
import { useSession } from "../../hooks/useSession";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Coins,
  Receipt,
  Wallet,
  Clock,
  Package,
  Save,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  History,
  Plus,
} from "lucide-react";
import cashierService from "../../services/cashier.service";

const CashierDashboard = () => {
  const { session, dashboard, loading, hasActiveSession, refresh: refreshDashboard } = useSession();

  const [showChipInventory, setShowChipInventory] = useState(false);
  const [chipInventory, setChipInventory] = useState({
    chips_100: 0,
    chips_500: 0,
    chips_5000: 0,
    chips_10000: 0,
  });
  // Add state for update inventory
  const [showUpdateInventory, setShowUpdateInventory] = useState(false);
  const [showOpenSession, setShowOpenSession] = useState(false);
  const [showCloseSession, setShowCloseSession] = useState(false);
  const [showAddFloat, setShowAddFloat] = useState(false);
  const [openingFloat, setOpeningFloat] = useState(0);
  const [floatAmount, setFloatAmount] = useState(0);
  const [floatReason, setFloatReason] = useState("");
  const [sessionClosing, setSessionClosing] = useState(false);
  const [sessionOpening, setSessionOpening] = useState(false);
  const [floatAdding, setFloatAdding] = useState(false);
  const [chipAdjustments, setChipAdjustments] = useState({
    chips_100_adjustment: 0,
    chips_500_adjustment: 0,
    chips_5000_adjustment: 0,
    chips_10000_adjustment: 0,
    reason: "",
  });

  const [adjustmentHistory, setAdjustmentHistory] = useState([]);
  const [submittingAdjustment, setSubmittingAdjustment] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load adjustment history
  const loadAdjustmentHistory = async () => {
    try {
      const response = await cashierService.getChipAdjustments();
      if (response.success) {
        setAdjustmentHistory(response.data);
      }
    } catch (err) {
      console.error("Failed to load adjustment history:", err);
    }
  };

  // Handle adjustment input
  const handleAdjustmentChange = (denomination, value) => {
    const numValue = parseInt(value) || 0;
    setChipAdjustments((prev) => ({
      ...prev,
      [denomination]: numValue,
    }));
  };

  // Submit adjustment
  const handleSubmitAdjustment = async () => {
    try {
      setSubmittingAdjustment(true);
      setError(null);
      setSuccess(null);

      const response = await cashierService.updateChipInventory(
        chipAdjustments
      );

      setSuccess(response.message || "Chip inventory updated successfully!");
      setChipAdjustments({
        chips_100_adjustment: 0,
        chips_500_adjustment: 0,
        chips_5000_adjustment: 0,
        chips_10000_adjustment: 0,
        reason: "",
      });
      setShowUpdateInventory(false);

      // Reload data
      setTimeout(() => {
        refreshDashboard();
        loadAdjustmentHistory();
        setSuccess(null);
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to update chip inventory");
    } finally {
      setSubmittingAdjustment(false);
    }
  };

  // Calculate adjustment totals
  const calculateAdjustmentTotal = () => {
    return (
      chipAdjustments.chips_100_adjustment * 100 +
      chipAdjustments.chips_500_adjustment * 500 +
      chipAdjustments.chips_5000_adjustment * 5000 +
      chipAdjustments.chips_10000_adjustment * 10000
    );
  };

  // Get owner's float from session
  const ownerFloat =
    dashboard?.wallets?.primary?.opening || session?.owner_float || 0;

  // Check if chip value matches float
  const chipValueMatchesFloat = () => {
    const value = calculateChipValue();
    return value === ownerFloat;
  };

  // Auto-show chip inventory form only if not yet set
  useEffect(() => {
    // Show chip inventory form only if not set AND has active session
    // But only on initial load, not when user clicks View Inventory
    if (dashboard && !dashboard.chip_inventory_set && hasActiveSession && !showChipInventory) {
      setShowChipInventory(true);
    }
  }, [dashboard?.chip_inventory_set, hasActiveSession]);

  // Clear success/error messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const calculateChipValue = () => {
    return cashierService.calculateChipValue(chipInventory);
  };

  const calculateChipCount = () => {
    return cashierService.calculateChipCount(chipInventory);
  };

  const difference = ownerFloat - calculateChipValue();

  const handleChipInputChange = (denomination, value) => {
    const numValue = parseInt(value) || 0;
    if (numValue >= 0) {
      setChipInventory((prev) => ({
        ...prev,
        [denomination]: numValue,
      }));
    }
  };

  const handleSubmitChipInventory = async () => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const response = await cashierService.setChipInventory(chipInventory);

      setSuccess(response.message || "Chip inventory set successfully!");
      
      // ✅ Close form immediately
      setShowChipInventory(false);
      
      // Force refresh with small delay to ensure backend processed
      setTimeout(async () => {
        try {
          await refreshDashboard();
        } catch (err) {
          console.error("Error refreshing dashboard:", err);
        }
        setSuccess(null);
      }, 1200);
    } catch (err) {
      setError(err.message || "Failed to set chip inventory");
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(numAmount || 0);
  };

  // ✅ Handle open session with opening float
  const handleOpenSession = async () => {
    try {
      setSessionOpening(true);
      setError(null);

      const response = await cashierService.openSession(
        parseFloat(openingFloat) || 0
      );

      setSuccess(response.data?.message || "Session opened successfully!");
      setShowOpenSession(false);
      setOpeningFloat(0);
      
      // Refresh dashboard
      setTimeout(() => {
        refreshDashboard();
        setSuccess(null);
      }, 1000);
    } catch (err) {
      setError(err.message || "Failed to open session");
      setSessionOpening(false);
    }
  };

  // ✅ Handle close session
  const handleCloseSession = async () => {
    try {
      setSessionClosing(true);
      setError(null);

      const response = await cashierService.closeSession();

      setSuccess(response.data?.message || "Session closed successfully!");
      setShowCloseSession(false);
      
      // Refresh dashboard
      setTimeout(() => {
        refreshDashboard();
        setSuccess(null);
      }, 1000);
    } catch (err) {
      setError(err.message || "Failed to close session");
      setSessionClosing(false);
    }
  };

  // ✅ Handle add float during session
  const handleAddFloat = async () => {
    try {
      setFloatAdding(true);
      setError(null);

      const response = await cashierService.addCashFloat(
        parseFloat(floatAmount) || 0,
        floatReason || "Additional float during session"
      );

      setSuccess(response.message || "Float added successfully!");
      setShowAddFloat(false);
      setFloatAmount(0);
      setFloatReason("");
      
      // Refresh dashboard
      setTimeout(() => {
        refreshDashboard();
        setSuccess(null);
      }, 1000);
    } catch (err) {
      setError(err.message || "Failed to add float");
      setFloatAdding(false);
    }
  };

  if (loading) {
    return (
      <CashierLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-black">Loading dashboard...</p>
          </div>
        </div>
      </CashierLayout>
    );
  }

  if (!hasActiveSession) {
    return (
      <CashierLayout>
        <div className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              No active session today. Open a session to start operations.
            </AlertDescription>
          </Alert>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-2xl text-black">Session Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-black mb-2">
                  Ready to Start?
                </h3>
                <p className="text-gray-600 text-center mb-6">
                  Click the button below to open today's session with opening float.
                </p>
                <Button
                  onClick={() => setShowOpenSession(true)}
                  className="bg-black hover:bg-gray-800 text-white px-8 py-3 text-lg"
                >
                  Open Session with Float
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Open Session Dialog */}
          {showOpenSession && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md border-2 border-black">
                <CardHeader>
                  <CardTitle className="text-black">Open Session with Opening Float</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-black mb-2 block">
                      Opening Float Amount (₹)
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g., 50000"
                      value={openingFloat}
                      onChange={(e) => setOpeningFloat(e.target.value)}
                      className="border-2 border-gray-300 text-black"
                    />
                  </div>

                  {error && (
                    <Alert className="bg-red-50 border-red-300">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowOpenSession(false)}
                      className="flex-1 border-2 border-gray-300 text-black hover:bg-gray-50"
                      disabled={sessionOpening}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleOpenSession}
                      className="flex-1 bg-black hover:bg-gray-800 text-white"
                      disabled={sessionOpening || !openingFloat}
                    >
                      {sessionOpening ? "Opening..." : "Open Session"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Add Float Dialog */}
          {showAddFloat && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md border-2 border-black">
                <CardHeader>
                  <CardTitle className="text-black">Add Cash Float (Mali)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-black mb-2 block">
                      Float Amount (₹)
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g., 10000"
                      value={floatAmount}
                      onChange={(e) => setFloatAmount(e.target.value)}
                      className="border-2 border-gray-300 text-black"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-black mb-2 block">
                      Reason (Optional)
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., Additional funding from manager"
                      value={floatReason}
                      onChange={(e) => setFloatReason(e.target.value)}
                      className="border-2 border-gray-300 text-black"
                    />
                  </div>

                  {error && (
                    <Alert className="bg-red-50 border-red-300">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddFloat(false)}
                      className="flex-1 border-2 border-gray-300 text-black hover:bg-gray-50"
                      disabled={floatAdding}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddFloat}
                      className="flex-1 bg-black hover:bg-gray-800 text-white"
                      disabled={floatAdding || !floatAmount}
                    >
                      {floatAdding ? "Adding..." : "Add Float"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Close Session Dialog */}
          {showCloseSession && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md border-2 border-black">
                <CardHeader>
                  <CardTitle className="text-black">Close Session</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-700">
                      Are you sure you want to close today's session? This will finalize all transactions for the day.
                    </AlertDescription>
                  </Alert>

                  <div className="bg-slate-50 p-3 rounded border border-slate-200">
                    <p className="text-sm text-slate-600">
                      Opening Float: <span className="font-semibold text-black">{formatCurrency(ownerFloat)}</span>
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      Current Balance: <span className="font-semibold text-black">{formatCurrency(primaryWallet)}</span>
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      Session P&L: <span className={`font-semibold ${(primaryWallet - ownerFloat) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(primaryWallet - ownerFloat)}
                      </span>
                    </p>
                  </div>

                  {error && (
                    <Alert className="bg-red-50 border-red-300">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowCloseSession(false)}
                      className="flex-1 border-2 border-gray-300 text-black hover:bg-gray-50"
                      disabled={sessionClosing}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCloseSession}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      disabled={sessionClosing}
                    >
                      {sessionClosing ? "Closing..." : "Close Session"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </CashierLayout>
    );
  }

  // Check if chip inventory needs to be set
  const chipInventorySet = dashboard?.chip_inventory_set || false;

  // Extract values from API response structure
  const primaryWallet = dashboard?.wallets?.primary?.current || 0;
  const secondaryWallet = dashboard?.wallets?.secondary?.current || 0;
  const totalDeposits = dashboard?.totals?.deposits || 0;
  const totalWithdrawals = dashboard?.totals?.withdrawals || 0;
  const totalExpenses = dashboard?.totals?.expenses || 0;

  // Transaction stats
  const buyInCount = dashboard?.transactions?.stats?.buy_ins?.count || 0;
  const buyInTotal = dashboard?.transactions?.stats?.buy_ins?.total || 0;
  const payoutCount = dashboard?.transactions?.stats?.payouts?.count || 0;
  const payoutTotal = dashboard?.transactions?.stats?.payouts?.total || 0;

  // Wallet breakdown
  const secondaryDeposits = dashboard?.wallets?.secondary?.total_received || 0;
  const secondaryPayouts = dashboard?.wallets?.secondary?.paid_in_payouts || 0;
  const primaryPayouts = dashboard?.wallets?.primary?.paid_in_payouts || 0;
  const primaryExpenses = dashboard?.wallets?.primary?.paid_in_expenses || 0;

  return (
    <CashierLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          
          {/* Premium Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Dashboard</h1>
              <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                {session?.session_date
                  ? new Date(session.session_date).toLocaleDateString("en-IN", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })
                  : "Today"}
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <Button
                onClick={() => setShowAddFloat(true)}
                className="bg-gray-600 hover:bg-gray-700 text-white"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Float
              </Button>
              <Button
                onClick={() => setShowCloseSession(true)}
                className="bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                <X className="w-4 h-4 mr-1" />
                Close Session
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="text-slate-600 border-slate-200 hover:bg-slate-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Success/Error Alerts */}
          {success && (
            <Alert className="bg-green-50 border-green-300">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert className="bg-red-50 border-red-300">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {/* Chip Inventory Setup Prompt */}
          {!chipInventorySet && !showChipInventory && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-4 border border-indigo-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Set Chip Inventory</p>
                    <p className="text-sm text-slate-500">Optional • Track chips accurately</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowChipInventory(true)}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Setup
                </Button>
              </div>
            </div>
          )}

          {/* Chip Inventory Setup Card - Premium */}
          {showChipInventory && !chipInventorySet && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Set Chip Inventory</h3>
                    <p className="text-sm text-slate-500">Break down {formatCurrency(ownerFloat)} into chips</p>
                  </div>
                </div>
                <button onClick={() => setShowChipInventory(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Chip Inputs Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: 'chips_100', label: '₹100', value: 100, color: 'emerald' },
                    { key: 'chips_500', label: '₹500', value: 500, color: 'blue' },
                    { key: 'chips_5000', label: '₹5,000', value: 5000, color: 'amber' },
                    { key: 'chips_10000', label: '₹10,000', value: 10000, color: 'violet' }
                  ].map((chip) => (
                    <div key={chip.key} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <label className="text-xs font-medium text-slate-500 mb-2 block">{chip.label}</label>
                      <Input
                        type="number"
                        min="0"
                        value={chipInventory[chip.key]}
                        onChange={(e) => handleChipInputChange(chip.key, e.target.value)}
                        className="text-center text-lg font-semibold"
                        placeholder="0"
                      />
                      <p className={`text-xs text-${chip.color}-600 mt-2 text-center`}>
                        {formatCurrency(chipInventory[chip.key] * chip.value)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Summary Bar */}
                <div className={`rounded-xl p-4 flex items-center justify-between ${
                  chipValueMatchesFloat() ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'
                }`}>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Your Total</p>
                      <p className={`text-xl font-bold ${chipValueMatchesFloat() ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {formatCurrency(calculateChipValue())}
                      </p>
                    </div>
                    <div className="text-slate-300">→</div>
                    <div>
                      <p className="text-xs text-slate-500">Target</p>
                      <p className="text-xl font-bold text-slate-900">{formatCurrency(ownerFloat)}</p>
                    </div>
                  </div>
                  {chipValueMatchesFloat() ? (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Match!</span>
                    </div>
                  ) : (
                    <div className="text-sm text-amber-600 font-medium">
                      {difference > 0 ? `Need +${formatCurrency(difference)}` : `Remove ${formatCurrency(Math.abs(difference))}`}
                    </div>
                  )}
                </div>

                {/* Error/Success */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-700 text-sm">
                    {success}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  onClick={handleSubmitChipInventory}
                  disabled={submitting || calculateChipCount() === 0 || !chipValueMatchesFloat()}
                  className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Setting...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Set Inventory
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Session Active Status */}
          {chipInventorySet && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Session Active</p>
                    <p className="text-sm text-slate-500">All transactions being recorded</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChipInventory(!showChipInventory)}
                  className="text-emerald-700"
                >
                  {showChipInventory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {showChipInventory ? 'Hide' : 'View'} Inventory
                </Button>
              </div>
            </div>
          )}

          {/* Chip Inventory Display - Premium Collapsible */}
          {chipInventorySet && showChipInventory && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {/* Opening */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-500 mb-3">Opening</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-400">₹100</span><span className="font-medium text-slate-700">{dashboard?.chip_inventory?.opening?.chips_100 || 0}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">₹500</span><span className="font-medium text-slate-700">{dashboard?.chip_inventory?.opening?.chips_500 || 0}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">₹5K</span><span className="font-medium text-slate-700">{dashboard?.chip_inventory?.opening?.chips_5000 || 0}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">₹10K</span><span className="font-medium text-slate-700">{dashboard?.chip_inventory?.opening?.chips_10000 || 0}</span></div>
                      <div className="flex justify-between pt-2 border-t border-slate-200"><span className="font-medium text-slate-600">Total</span><span className="font-bold text-slate-900">{dashboard?.chip_inventory?.opening?.total_count || 0}</span></div>
                    </div>
                  </div>
                  
                  {/* In Hand */}
                  <div className="bg-emerald-50 rounded-xl p-4">
                    <p className="text-xs font-medium text-emerald-600 mb-3">In Hand</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-emerald-400">₹100</span><span className="font-medium text-emerald-700">{dashboard?.chip_inventory?.current_in_hand?.chips_100 || 0}</span></div>
                      <div className="flex justify-between"><span className="text-emerald-400">₹500</span><span className="font-medium text-emerald-700">{dashboard?.chip_inventory?.current_in_hand?.chips_500 || 0}</span></div>
                      <div className="flex justify-between"><span className="text-emerald-400">₹5K</span><span className="font-medium text-emerald-700">{dashboard?.chip_inventory?.current_in_hand?.chips_5000 || 0}</span></div>
                      <div className="flex justify-between"><span className="text-emerald-400">₹10K</span><span className="font-medium text-emerald-700">{dashboard?.chip_inventory?.current_in_hand?.chips_10000 || 0}</span></div>
                      <div className="flex justify-between pt-2 border-t border-emerald-200"><span className="font-medium text-emerald-600">Total</span><span className="font-bold text-emerald-700">{dashboard?.chip_inventory?.current_in_hand?.total_count || 0}</span></div>
                    </div>
                  </div>
                  
                  {/* With Players */}
                  <div className="bg-violet-50 rounded-xl p-4">
                    <p className="text-xs font-medium text-violet-600 mb-3">With Players</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-violet-400">₹100</span><span className="font-medium text-violet-700">{dashboard?.chip_inventory?.with_players?.chips_100 || 0}</span></div>
                      <div className="flex justify-between"><span className="text-violet-400">₹500</span><span className="font-medium text-violet-700">{dashboard?.chip_inventory?.with_players?.chips_500 || 0}</span></div>
                      <div className="flex justify-between"><span className="text-violet-400">₹5K</span><span className="font-medium text-violet-700">{dashboard?.chip_inventory?.with_players?.chips_5000 || 0}</span></div>
                      <div className="flex justify-between"><span className="text-violet-400">₹10K</span><span className="font-medium text-violet-700">{dashboard?.chip_inventory?.with_players?.chips_10000 || 0}</span></div>
                      <div className="flex justify-between pt-2 border-t border-violet-200"><span className="font-medium text-violet-600">Total</span><span className="font-bold text-violet-700">{dashboard?.chip_inventory?.with_players?.total_count || 0}</span></div>
                    </div>
                  </div>
                </div>

                {/* House Profit Chips - Only show if house won chips */}
                {dashboard?.chip_inventory?.house_profit_chips?.total_count > 0 && (
                  <div className="mt-4 bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium text-amber-700">🏆 House Profit (Extra Chips Received)</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-sm">
                      <div className="text-center">
                        <span className="text-amber-500 text-xs">₹100</span>
                        <p className="font-bold text-amber-700">{dashboard?.chip_inventory?.house_profit_chips?.chips_100 || 0}</p>
                      </div>
                      <div className="text-center">
                        <span className="text-amber-500 text-xs">₹500</span>
                        <p className="font-bold text-amber-700">{dashboard?.chip_inventory?.house_profit_chips?.chips_500 || 0}</p>
                      </div>
                      <div className="text-center">
                        <span className="text-amber-500 text-xs">₹5K</span>
                        <p className="font-bold text-amber-700">{dashboard?.chip_inventory?.house_profit_chips?.chips_5000 || 0}</p>
                      </div>
                      <div className="text-center">
                        <span className="text-amber-500 text-xs">₹10K</span>
                        <p className="font-bold text-amber-700">{dashboard?.chip_inventory?.house_profit_chips?.chips_10000 || 0}</p>
                      </div>
                      <div className="text-center border-l border-amber-200">
                        <span className="text-amber-600 text-xs font-medium">Value</span>
                        <p className="font-bold text-amber-800">{formatCurrency(dashboard?.chip_inventory?.house_profit_chips?.total_value || 0)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Total Summary */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">In Hand Value:</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(dashboard?.chip_inventory?.current_in_hand?.total_value || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">With Players Value:</span>
                      <span className="font-bold text-violet-600">{formatCurrency(dashboard?.chip_inventory?.with_players?.total_value || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Wallet Cards - Premium Design */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Wallet */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Primary Wallet</p>
                    <p className="text-xs text-slate-400">Owner's Capital</p>
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-4">
                {formatCurrency(primaryWallet)}
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                  <span className="text-slate-500">Float: {formatCurrency(openingFloat)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-slate-500">Out: {formatCurrency(primaryPayouts)}</span>
                </div>
              </div>
            </div>

            {/* Secondary Wallet */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Secondary Wallet</p>
                    <p className="text-xs text-slate-400">Player Deposits</p>
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-4">
                {formatCurrency(secondaryWallet)}
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span className="text-slate-500">In: {formatCurrency(secondaryDeposits)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-slate-500">Out: {formatCurrency(secondaryPayouts)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chip Flow - Compact Premium Design */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-slate-600" />
                <h3 className="font-semibold text-slate-900">Chip Flow</h3>
              </div>
              <Badge variant="outline" className="text-slate-500 border-slate-200">
                Live
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-xl border border-red-100">
                <ArrowUpRight className="w-5 h-5 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(dashboard?.chip_inventory?.with_players?.total_value || 0)}
                </p>
                <p className="text-xs text-red-500 font-medium mt-1">OUT</p>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <ArrowDownLeft className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(dashboard?.chip_inventory?.current_in_hand?.total_value || 0)}
                </p>
                <p className="text-xs text-emerald-500 font-medium mt-1">IN</p>
              </div>
              <div className="text-center p-4 bg-violet-50 rounded-xl border border-violet-100">
                <Users className="w-5 h-5 text-violet-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-violet-600">
                  {formatCurrency(
                    (dashboard?.chip_inventory?.with_players?.total_value || 0) - 
                    (dashboard?.chip_inventory?.current_in_hand?.total_value || 0)
                  )}
                </p>
                <p className="text-xs text-violet-500 font-medium mt-1">NET</p>
              </div>
            </div>
          </div>

          {/* Stats Row - Minimal Design */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-slate-500">Buy-Ins</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(buyInTotal)}</p>
              <p className="text-xs text-slate-400 mt-1">{buyInCount} transactions</p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span className="text-sm text-slate-500">Payouts</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(payoutTotal)}</p>
              <p className="text-xs text-slate-400 mt-1">{payoutCount} transactions</p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <Coins className="w-4 h-4 text-violet-500" />
                <span className="text-sm text-slate-500">Chips Out</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{dashboard?.chip_inventory?.with_players?.total_count ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">pieces</p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-slate-500">Credit</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(dashboard?.outstanding_credit || 0)}</p>
              <p className="text-xs text-slate-400 mt-1">
                {parseFloat(dashboard?.outstanding_credit || 0) > 0 ? "Outstanding" : "All clear"}
              </p>
            </div>
          </div>

          {/* Recent Transactions - Clean Design */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Recent Activity</h3>
              <span className="text-xs text-slate-400">{dashboard?.transactions?.all?.length || 0} today</span>
            </div>
            <div className="divide-y divide-slate-50">
              {dashboard?.transactions?.all?.slice(0, 6).map((transaction, index) => (
                <div
                  key={transaction.transaction_id || index}
                  className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        transaction.transaction_type === "buy_in"
                          ? "bg-emerald-100"
                          : transaction.transaction_type === "cash_payout"
                          ? "bg-red-100"
                          : transaction.transaction_type === "issue_credit"
                          ? "bg-blue-100"
                          : transaction.transaction_type === "settle_credit"
                          ? "bg-violet-100"
                          : "bg-amber-100"
                      }`}
                    >
                      {transaction.transaction_type === "buy_in" ? (
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                      ) : transaction.transaction_type === "cash_payout" ? (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      ) : transaction.transaction_type === "issue_credit" ? (
                        <CreditCard className="w-4 h-4 text-blue-600" />
                      ) : transaction.transaction_type === "settle_credit" ? (
                        <CheckCircle className="w-4 h-4 text-violet-600" />
                      ) : (
                        <Receipt className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">
                        {transaction.player_name || "System"}
                      </p>
                      <p className="text-xs text-slate-400 capitalize">
                        {transaction.transaction_type?.replace(/_/g, " ") || "Unknown"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        ["buy_in", "settle_credit"].includes(transaction.transaction_type || "")
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {["buy_in", "settle_credit"].includes(transaction.transaction_type || "") ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(transaction.created_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {(!dashboard?.transactions?.all || dashboard.transactions.all.length === 0) && (
                <div className="py-12 text-center">
                  <Receipt className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No transactions yet</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </CashierLayout>
  );
};

export default CashierDashboard;
