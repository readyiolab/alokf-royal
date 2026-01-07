import { useState, useEffect } from "react";
import CashierLayout from "../../components/layouts/CashierLayout";
import { useSession } from "../../contexts/Sessioncontext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Wallet, TrendingDown, CreditCard, Coins, ArrowUp, Settings, Plus, Eye, ArrowDown } from "lucide-react";
import { StartSessionModal, AddFloatModal, ViewFloatModal, CloseDayModal } from "../../components/cashier";

const CashierDashboard = () => {
  const { session, dashboard, loading, hasActiveSession, refresh: refreshDashboard } = useSession();
  
  const [showStartSession, setShowStartSession] = useState(false);
  const [showAddFloatModal, setShowAddFloatModal] = useState(false);
  const [showViewFloatModal, setShowViewFloatModal] = useState(false);
  const [showCloseDayModal, setShowCloseDayModal] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount || 0);
  };

  const availableFloat = dashboard?.wallets?.primary?.current || 0;
  // ✅ FIXED: Use separate cash_balance and online_balance (not combined secondaryWallet)
  const cashInHand = dashboard?.wallets?.secondary?.cash_balance ?? 0; // Only cash buy-ins
  const onlineMoney = dashboard?.wallets?.secondary?.online_balance ?? 0; // Only online buy-ins
  
  // Debug: Log values to verify
  useEffect(() => {
    if (dashboard?.wallets?.secondary) {
      console.log('💰 Dashboard Wallet Data:', {
        cash_balance: dashboard.wallets.secondary.cash_balance,
        online_balance: dashboard.wallets.secondary.online_balance,
        current: dashboard.wallets.secondary.current,
        cashInHand,
        onlineMoney
      });
    }
  }, [dashboard, cashInHand, onlineMoney]);
  const totalPayouts = dashboard?.totals?.withdrawals || 0;
  const totalExpenses = dashboard?.totals?.expenses || 0;
  const outstandingCredit = dashboard?.outstanding_credit || 0;
  const openingChips = dashboard?.chip_inventory?.opening || {};
  const currentChips = dashboard?.chip_inventory?.current_in_hand || {};
  const sbiMoney = dashboard?.totals?.sbi_deposits || 0;
  const hdfcMoney = dashboard?.totals?.hdfc_deposits || 0;
  const dealerTips = dashboard?.totals?.dealer_tips || 0;
  const clubExpenses = dashboard?.totals?.club_expenses || 0;

  const handleSessionStarted = async () => {
    setShowStartSession(false);
    setShowAddFloatModal(false);
    setShowViewFloatModal(false);
    setShowCloseDayModal(false);
    // ✅ Immediately refresh to get fresh data for new session
    // Wait a bit for backend to process, then refresh
    setTimeout(async () => { 
      await refreshDashboard(); 
      // Force another refresh after a short delay to ensure fresh data
      setTimeout(async () => { await refreshDashboard(); }, 500);
    }, 1000);
  };

  if (loading) {
    return (
      <CashierLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </CashierLayout>
    );
  }

  // ✅ FIXED: session_id can be 0 which is falsy, so check for null/undefined explicitly
  const isSessionActive = !!hasActiveSession && 
                          session && 
                          (session.session_id !== null && session.session_id !== undefined) &&
                          (session.is_closed === 0 || session.is_closed === false || session.is_closed === null || session.is_closed === undefined);

  return (
    <CashierLayout>
      <div className="space-y-6 p-6" key={`dashboard-${session?.session_id ?? 'no-session'}-${hasActiveSession}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* DAILY SESSION Card */}
          <Card className="bg-white border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-gray-700">DAILY SESSION</CardTitle>
              <Clock className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold text-red-500">{formatCurrency(availableFloat)}</div>
              <p className="text-xs text-gray-600">AVAILABLE FLOAT</p>
              {isSessionActive ? (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button onClick={() => setShowAddFloatModal(true)} variant="outline" className="flex-1 text-xs h-8 border-gray-300 hover:bg-gray-50" size="sm">
                      <Plus className="w-3 h-3 mr-1" />Add Float
                    </Button>
                    <Button onClick={() => setShowViewFloatModal(true)} variant="outline" className="flex-1 text-xs h-8 border-gray-300 hover:bg-gray-50" size="sm">
                      <Eye className="w-3 h-3 mr-1" />View Float
                    </Button>
                  </div>
                  <Button onClick={() => setShowCloseDayModal(true)} variant="outline" className="w-full text-xs h-8 border-gray-300 hover:bg-gray-50" size="sm">
                    <ArrowDown className="w-3 h-3 mr-1" />Close
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setShowStartSession(true)} className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm h-8" size="sm">
                  <ArrowUp className="w-3 h-3 mr-1" />Start Session
                </Button>
              )}
            </CardContent>
          </Card>

          {/* TODAY'S MONEY Card */}
          <Card className="bg-white border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-gray-700">TODAY'S MONEY</CardTitle>
              <Wallet className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-sm"><span className="text-gray-600">Cash in Hand</span><span className="font-semibold text-black">{formatCurrency(cashInHand)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Online Money</span><span className="font-semibold text-black">{formatCurrency(onlineMoney)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">SBI</span><span className="font-semibold text-black">{formatCurrency(sbiMoney)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">HDFC</span><span className="font-semibold text-black">{formatCurrency(hdfcMoney)}</span></div>
              </div>
              {!isSessionActive && <p className="text-xs text-gray-500 mt-2">Day closed - Start new day to see stats</p>}
            </CardContent>
          </Card>

          {/* CASH TAKEN OUT Card */}
          <Card className="bg-white border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-gray-700">CASH TAKEN OUT</CardTitle>
              <TrendingDown className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold text-black">{formatCurrency(totalPayouts + totalExpenses)}</div>
              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-sm"><span className="text-gray-600">Payouts</span><span className="font-semibold text-black">{formatCurrency(totalPayouts)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Dealer Tips (Cash)</span><span className="font-semibold text-black">{formatCurrency(dealerTips)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Player Expenses (Vendors)</span><span className="font-semibold text-black">{formatCurrency(dashboard?.totals?.player_expenses || 0)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Club Expenses</span><span className="font-semibold text-black">{formatCurrency(clubExpenses)}</span></div>
              </div>
            </CardContent>
          </Card>

          {/* OUTSTANDING CREDIT Card */}
          <Card className="bg-white border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-gray-700">OUTSTANDING CREDIT</CardTitle>
              <CreditCard className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(outstandingCredit)}</div>
              <p className="text-xs text-gray-600">{outstandingCredit > 0 ? "Pending settlements" : "All settled"}</p>
            </CardContent>
          </Card>

          {/* CHIPS INVENTORY Card */}
          <Card className="bg-white border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-gray-700">CHIPS INVENTORY</CardTitle>
              <Settings className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Opening</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-black">{openingChips.total_count || 0} chips</span>
                    <span className="text-sm font-semibold text-black">Value {formatCurrency(openingChips.total_value || 0)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">With Cashier</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-black">{currentChips.total_count || 0} chips</span>
                    <span className="text-sm font-semibold text-black">Value {formatCurrency(currentChips.total_value || 0)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modals */}
        {showStartSession && <StartSessionModal open={showStartSession} onOpenChange={setShowStartSession} onSuccess={handleSessionStarted} />}
        {showAddFloatModal && <AddFloatModal isOpen={showAddFloatModal} onClose={() => setShowAddFloatModal(false)} onSuccess={handleSessionStarted} />}
        {showViewFloatModal && <ViewFloatModal open={showViewFloatModal} onOpenChange={setShowViewFloatModal} />}
        {showCloseDayModal && <CloseDayModal open={showCloseDayModal} onOpenChange={setShowCloseDayModal} onSuccess={handleSessionStarted} />}
      </div>
    </CashierLayout>
  );
};

export default CashierDashboard;