import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, BarChart3, DollarSign, Clock, Plus, LayoutGrid, RotateCcw, TrendingUp, TrendingDown, Zap,Coins} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CreditRequestForm from '@/components/credit/CreditRequestForm';
import PendingCreditRequests from '@/components/credit/PendingCreditRequests';
import OutstandingCredits from '@/components/credit/OutstandingCredits';
import SettleCreditForm from '@/components/credit/SettleCreditForm';
import CreditApprovalDialog from '@/components/credit/CreditApprovalDialog';
import PlayerChipHoldings from '@/components/credit/PlayerChipHoldings';
import { useSession } from '@/hooks/useSession';
import { useAuth } from '@/hooks/useAuth';
import creditService from '@/services/credit.service';
import CashierLayout from "../../components/layouts/CashierLayout";

export const CashierCreditsPage = () => {
  const { session, dashboard, loading, hasActiveSession, refreshSession } = useSession();
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('request');
  const [creditStats, setCreditStats] = useState(null);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // ✅ NEW: Cashier Credit Limit System
  const [creditLimit, setCreditLimit] = useState(50000); // Default 50k mixed chips
  const [totalCreditIssued, setTotalCreditIssued] = useState(0);
  const [showLimitEditor, setShowLimitEditor] = useState(false);
  const [editingLimit, setEditingLimit] = useState(50000);

  const formatCurrency = (amount) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(numAmount || 0);
  };

  useEffect(() => {
    if (hasActiveSession && session?.session_id) {
      fetchCreditStats();
      // ✅ Calculate total credit issued from auto-approved + approved requests
      calculateTotalCreditIssued();
      // ✅ Fetch credit limit from backend
      fetchCreditLimit();
    }
  }, [hasActiveSession, session?.session_id, refreshTrigger]);

  // ✅ NEW: Calculate total credit already issued today (ALL approved - auto + admin)
  const calculateTotalCreditIssued = async () => {
    try {
      if (!session?.session_id) return;
      
      // Get all approved credit requests for today (both auto-approved AND admin-approved)
      const allRequests = await creditService.getAllRequests(session.session_id);
      if (allRequests?.data?.approved && Array.isArray(allRequests.data.approved)) {
        const total = allRequests.data.approved.reduce((sum, req) => sum + parseFloat(req.requested_amount || 0), 0);
        setTotalCreditIssued(total);
      } else {
        // Fallback: try auto-approved endpoint
        const approvedRequests = await creditService.getAutoApprovedRequests(session.session_id);
        if (approvedRequests && Array.isArray(approvedRequests)) {
          const total = approvedRequests.reduce((sum, req) => sum + parseFloat(req.requested_amount || 0), 0);
          setTotalCreditIssued(total);
        }
      }
    } catch (error) {
      console.error('Failed to calculate credit issued:', error);
    }
  };

  // ✅ NEW: Fetch credit limit from backend (now includes used amount)
  const fetchCreditLimit = async () => {
    try {
      if (!session?.session_id) return;
      
      const data = await creditService.getCreditLimit(session.session_id);
      if (data) {
        setCreditLimit(parseFloat(data.credit_limit) || 0);
        setEditingLimit(parseFloat(data.credit_limit) || 0);
        // Also set the used amount from backend
        if (data.credit_used !== undefined) {
          setTotalCreditIssued(parseFloat(data.credit_used) || 0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch credit limit:', error);
      // Don't alert - this is optional functionality
    }
  };

  // ✅ NEW: Get remaining credit limit
  const remainingCreditLimit = Math.max(0, creditLimit - totalCreditIssued);

  const fetchCreditStats = async () => {
    try {
      setStatsLoading(true);
      const stats = await creditService.getCreditStats(session.session_id);
      setCreditStats(stats);
    } catch (error) {
      console.error('Failed to fetch credit stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // ✅ NEW: Handle credit limit update
  const handleUpdateCreditLimit = async () => {
    try {
      if (!session?.session_id) {
        alert('No active session. Cannot set credit limit.');
        return;
      }

      const newLimit = parseFloat(editingLimit) || 50000;
      
      // Call backend to save the credit limit via service
      const result = await creditService.setCreditLimit(session.session_id, newLimit);
      
      if (result?.credit_limit) {
        setCreditLimit(newLimit);
        setShowLimitEditor(false);
        alert(`✅ Credit limit updated to ₹${newLimit.toLocaleString('en-IN')}`);
      } else {
        alert(`Error: Failed to update credit limit`);
      }
    } catch (error) {
      console.error('Failed to update credit limit:', error);
      alert(`Failed to update credit limit: ${error.message}`);
    }
  };

  const handleRequestSuccess = (result) => {
    setActiveTab('outstanding');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedCredit(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRefresh = () => {
    refreshSession();
    setRefreshTrigger(prev => prev + 1);
  };

  // Calculate Primary Wallet (Owner's Float)
  const primaryWallet = hasActiveSession && session
    ? (parseFloat(session?.opening_float || 0) + 
       parseFloat(session?.total_deposits || 0) - 
       parseFloat(session?.total_withdrawals || 0) - 
       parseFloat(session?.total_expenses || 0))
    : 0;

  // Show loading state
  if (loading) {
    return (
      <CashierLayout>
        <div className="p-6">
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 flex gap-3">
            <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 animate-spin" />
            <p className="text-sm text-blue-700">
              Loading session information...
            </p>
          </div>
        </div>
      </CashierLayout>
    );
  }



  return (
    <CashierLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-10">
        
        {/* --- No Session Warning Banner (Only for non-admin or when doing cashier functions) --- */}
        {(!hasActiveSession || !session) && user?.role !== 'admin' && (
          <Alert className="bg-yellow-50 border-2 border-yellow-300">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <AlertDescription className="ml-2 py-1 text-yellow-700 font-medium">
              ⚠️ No active session - showing placeholder data. Open a session to manage credits.
            </AlertDescription>
          </Alert>
        )}

        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutGrid className="w-5 h-5 text-black" />
              <span className="text-sm font-bold uppercase tracking-wider text-black">Cashier Terminal</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Credit Management</h1>
            <p className="text-gray-600 mt-1 font-medium">
              Manage player credits, issue requests, and settle payments
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="rounded-full px-6 border-gray-300 hover:bg-gray-50 transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Sync Data
          </Button>
        </div>

        {/* --- Wallet & Credit Overview --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Primary Wallet */}
          <Card className="bg-white border border-blue-200 shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Primary Wallet</p>
                  <p className="text-xs text-blue-600 font-medium mt-1">Owner Float</p>
                </div>
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-blue-700">
                {formatCurrency(primaryWallet)}
              </div>
              <p className="text-xs text-blue-600 mt-2">
                {hasActiveSession ? 'Capital available' : 'No active session'}
              </p>
            </CardContent>
          </Card>

          {/* Outstanding Credit */}
          <Card className="bg-white border border-orange-200 shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-bold text-orange-600 uppercase tracking-wide">Outstanding Credit</p>
                  <p className="text-xs text-orange-600 font-medium mt-1">Active Liability</p>
                </div>
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-2xl font-black text-orange-700">
                {formatCurrency(hasActiveSession ? (dashboard?.outstanding_credit || 0) : 0)}
              </div>
              <p className="text-xs text-orange-600 mt-2">
                {hasActiveSession ? 'Must be settled before payout' : 'No active session'}
              </p>
            </CardContent>
          </Card>

          {/* ✅ NEW: Cashier Credit Limit */}
          <Card className={`bg-white border shadow-lg ${
            remainingCreditLimit <= 0 
              ? 'border-red-300' 
              : remainingCreditLimit < creditLimit * 0.2 
                ? 'border-yellow-300' 
                : 'border-purple-200'
          }`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wide ${
                    remainingCreditLimit <= 0 ? 'text-red-600' : 'text-purple-600'
                  }`}>Credit Limit</p>
                  <p className={`text-xs font-medium mt-1 ${
                    remainingCreditLimit <= 0 ? 'text-red-600' : 'text-purple-600'
                  }`}>Mixed Chips Pool</p>
                </div>
                <Coins className={`w-5 h-5 ${
                  remainingCreditLimit <= 0 ? 'text-red-600' : 'text-purple-600'
                }`} />
              </div>
              
              {showLimitEditor ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={editingLimit}
                      onChange={(e) => setEditingLimit(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm font-semibold"
                      min="0"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleUpdateCreditLimit}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowLimitEditor(false);
                        setEditingLimit(creditLimit);
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={`text-2xl font-black ${
                    remainingCreditLimit <= 0 ? 'text-red-700' : 'text-purple-700'
                  }`}>
                    {formatCurrency(creditLimit)}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-3 mb-2">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          remainingCreditLimit <= 0 
                            ? 'bg-red-500' 
                            : remainingCreditLimit < creditLimit * 0.2 
                              ? 'bg-yellow-500' 
                              : 'bg-purple-500'
                        }`}
                        style={{ width: `${Math.min(100, (totalCreditIssued / creditLimit) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Status Display */}
                  {remainingCreditLimit <= 0 ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
                      <p className="text-xs font-bold text-red-700 text-center">
                        ⚠️ LIMIT EXHAUSTED
                      </p>
                      <p className="text-[10px] text-red-600 text-center mt-1">
                        Used: {formatCurrency(totalCreditIssued)} / {formatCurrency(creditLimit)}
                      </p>
                      {totalCreditIssued > creditLimit && (
                        <p className="text-[10px] text-red-600 text-center font-semibold">
                          Exceeded by: {formatCurrency(totalCreditIssued - creditLimit)}
                        </p>
                      )}
                    </div>
                  ) : remainingCreditLimit < creditLimit * 0.2 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3">
                      <p className="text-xs font-bold text-yellow-700 text-center">
                        ⚡ LOW LIMIT
                      </p>
                      <p className="text-[10px] text-yellow-600 text-center mt-1">
                        Remaining: {formatCurrency(remainingCreditLimit)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-purple-600 mt-1 mb-3">
                      Remaining: <span className="font-bold text-purple-700">{formatCurrency(remainingCreditLimit)}</span>
                      <span className="text-[10px] ml-1 text-gray-500">
                        (Used: {formatCurrency(totalCreditIssued)})
                      </span>
                    </p>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowLimitEditor(true)}
                    className={`w-full ${
                      remainingCreditLimit <= 0 
                        ? 'text-red-600 border-red-300 hover:bg-red-50' 
                        : 'text-purple-600 border-purple-300 hover:bg-purple-50'
                    }`}
                  >
                    Edit Limit
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* --- Credit Stats Grid --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Requested */}
          <Card className="border-none shadow-xl bg-white">
            <CardContent className="p-5">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Total Requested</p>
              <div className="text-2xl font-black text-slate-600 mt-1">
                {formatCurrency(creditStats?.data?.summary?.total_amount_requested || creditStats?.total_requested || 0)}
              </div>
              <p className="text-[10px] text-slate-600 mt-1 font-medium">
                {creditStats?.data?.summary?.total_requests || creditStats?.total_requests || 0} requests
              </p>
            </CardContent>
          </Card>

          {/* Pending Requests */}
          <Card className="border-none shadow-xl bg-white">
            <CardContent className="p-5">
              <p className="text-xs font-bold text-yellow-700 uppercase tracking-wide">Pending</p>
              <div className="text-2xl font-black text-yellow-600 mt-1">
                {creditStats?.data?.summary?.approval_breakdown?.pending || creditStats?.pending_count || 0}
              </div>
              <p className="text-[10px] text-yellow-600 mt-1 font-medium">
                {formatCurrency(creditStats?.data?.summary?.approval_breakdown?.pending_amount || creditStats?.pending_amount || 0)}
              </p>
            </CardContent>
          </Card>

          {/* Auto-Approved */}
          <Card className="border-none shadow-xl bg-white">
            <CardContent className="p-5">
              <p className="text-xs font-bold text-green-700 uppercase tracking-wide flex items-center gap-1">
                <Zap className="w-3 h-3" /> Auto-Approved
              </p>
              <div className="text-2xl font-black text-green-600 mt-1">
                {creditStats?.data?.summary?.approval_breakdown?.auto_approved || creditStats?.auto_approved_count || 0}
              </div>
              <p className="text-[10px] text-green-600 mt-1 font-medium">
                {formatCurrency(creditStats?.data?.summary?.approval_breakdown?.auto_approved_amount || creditStats?.auto_approved_amount || 0)}
              </p>
            </CardContent>
          </Card>

          {/* Total Outstanding */}
          <Card className="border-none shadow-xl bg-white">
            <CardContent className="p-5">
              <p className="text-xs font-bold text-red-700 uppercase tracking-wide">Total Outstanding</p>
              <div className="text-2xl font-black text-red-600 mt-1">
                {formatCurrency(creditStats?.total_outstanding || dashboard?.outstanding_credit || 0)}
              </div>
              <p className="text-[10px] text-red-600 mt-1 font-medium">
                From transactions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* --- Tabs Section --- */}
        <div className={`bg-white rounded-lg shadow-lg ${!hasActiveSession && user?.role !== 'admin' ? 'opacity-60 pointer-events-none' : ''}`}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="border-b border-gray-200 rounded-none px-6 py-0 h-auto bg-transparent">
              <TabsTrigger
                value="request"
                className="px-4 py-3 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Request
              </TabsTrigger>
              {user?.role === 'admin' && (
                <TabsTrigger
                  value="pending"
                  className="px-4 py-3 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Pending Approvals
                  {creditStats?.pending_count > 0 && (
                    <Badge className="bg-yellow-600">{creditStats.pending_count}</Badge>
                  )}
                </TabsTrigger>
              )}
              <TabsTrigger
                value="outstanding"
                className="px-4 py-3 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Outstanding Credits
              </TabsTrigger>
              <TabsTrigger
                value="chip-holdings"
                className="px-4 py-3 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none flex items-center gap-2"
              >
                <Coins className="w-4 h-4" />
                Player Chips
              </TabsTrigger>
            
            </TabsList>
            <TabsContent value="request" className="p-6">
              <div className="max-w-2xl">
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Credit System:</strong> Specify the credit amount and chip breakdown. Credit is tracked separately from float and settled during cashout.
                  </p>
                </div>
                {/* ✅ Show remaining credit limit */}
                <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-700">
                    <strong>Cashier Credit Limit:</strong> {formatCurrency(remainingCreditLimit)} remaining 
                    <span className="block text-xs text-purple-600 mt-1">
                      {totalCreditIssued > 0 ? `Used: ${formatCurrency(totalCreditIssued)} / ${formatCurrency(creditLimit)}` : `Total Limit: ${formatCurrency(creditLimit)}`}
                    </span>
                  </p>
                </div>
                <CreditRequestForm
                  onSuccess={handleRequestSuccess}
                  cashierCreditLimit={creditLimit}
                  remainingCreditLimit={remainingCreditLimit}
                  totalCreditIssued={totalCreditIssued}
                />
              </div>
            </TabsContent>

            {/* Pending Approvals Tab (Admin Only) */}
            {user?.role === 'admin' && (
              <TabsContent value="pending" className="p-6">
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      <strong>{creditStats?.pending_count || 0} request(s)</strong> awaiting your approval 
                      ({formatCurrency(creditStats?.pending_amount || 0)})
                    </p>
                  </div>
                  <PendingCreditRequests
                    sessionId={session.session_id}
                    onRefresh={() => setRefreshTrigger(prev => prev + 1)}
                  />
                </div>
              </TabsContent>
            )}

            {/* Outstanding Credits Tab */}
            <TabsContent value="outstanding" className="p-6">
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-700">
                    <strong>Total Outstanding: {formatCurrency(dashboard?.outstanding_credit || 0)}</strong> 
                    - Players must settle before cash payout
                  </p>
                </div>
                <OutstandingCredits 
                  sessionData={session}
                  onCreditSelected={(credit) => {
                    setSelectedCredit(credit);
                    setActiveTab('settle');
                  }}
                />
              </div>
            </TabsContent>

            {/* ✅ NEW: Player Chip Holdings Tab */}
            <TabsContent value="chip-holdings" className="p-6">
              <PlayerChipHoldings />
            </TabsContent>

            {/* Settle Credit Tab */}
            <TabsContent value="settle" className="p-6">
              <div className="max-w-2xl">
                {selectedCredit && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Selected Player:</strong> {selectedCredit.player_name}
                      <br />
                      <strong>Outstanding:</strong> {formatCurrency(selectedCredit.outstanding_credit)}
                    </p>
                  </div>
                )}
                <SettleCreditForm
                  creditData={selectedCredit}
                  onSuccess={(result) => {
                    alert(`✅ Credit settled!\nRemaining: ${formatCurrency(result.remaining_credit)}`);
                    setSelectedCredit(null);
                    setRefreshTrigger(prev => prev + 1);
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* 📊 All Credits Issued - Chip Breakdown */}
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-300">
          <CardHeader>
            <CardTitle className="text-black flex items-center gap-2">
              <Coins className="w-5 h-5 text-indigo-600" />
              All Credits Issued - Chip Breakdown
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">Complete record of credit issuances with denomination breakdown</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard?.outstanding_credits && dashboard.outstanding_credits.length > 0 ? (
                dashboard.outstanding_credits.map((credit) => (
                  <div key={credit.credit_id} className="bg-white p-4 rounded-lg border-2 border-indigo-200 hover:border-indigo-400 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-lg font-bold text-black">{credit.player_name || 'Unknown Player'}</p>
                        <p className="text-xs text-gray-600 mt-1">Credit ID: #{credit.credit_id} | Request ID: #{credit.credit_request_id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-indigo-600">{formatCurrency(credit.credit_issued)}</p>
                        <p className={`text-xs font-medium ${credit.is_fully_settled ? 'text-green-600' : 'text-orange-600'}`}>
                          {credit.is_fully_settled ? '✅ Fully Settled' : '⏳ Outstanding'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Settlement Status */}
                    {credit.credit_settled > 0 && (
                      <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-xs">
                        <p className="text-green-700 font-semibold">
                          Settled: {formatCurrency(credit.credit_settled)} on {credit.settled_at ? new Date(credit.settled_at).toLocaleDateString('en-IN') : 'N/A'}
                        </p>
                        <p className="text-green-600">Remaining: {formatCurrency(credit.credit_outstanding)}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded border border-green-200">
                        <p className="text-xs font-semibold text-gray-700">₹100 Chips</p>
                        <p className="text-xl font-bold text-green-600">{credit.chips_100 || 0}</p>
                        <p className="text-xs text-gray-600">{formatCurrency((credit.chips_100 || 0) * 100)}</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded border border-blue-200">
                        <p className="text-xs font-semibold text-gray-700">₹500 Chips</p>
                        <p className="text-xl font-bold text-blue-600">{credit.chips_500 || 0}</p>
                        <p className="text-xs text-gray-600">{formatCurrency((credit.chips_500 || 0) * 500)}</p>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded border border-orange-200">
                        <p className="text-xs font-semibold text-gray-700">₹5,000 Chips</p>
                        <p className="text-xl font-bold text-orange-600">{credit.chips_5000 || 0}</p>
                        <p className="text-xs text-gray-600">{formatCurrency((credit.chips_5000 || 0) * 5000)}</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded border border-purple-200">
                        <p className="text-xs font-semibold text-gray-700">₹10,000 Chips</p>
                        <p className="text-xl font-bold text-purple-600">{credit.chips_10000 || 0}</p>
                        <p className="text-xs text-gray-600">{formatCurrency((credit.chips_10000 || 0) * 10000)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600">
                        Issued: {new Date(credit.issued_at).toLocaleDateString('en-IN')} | 
                        Outstanding: {formatCurrency(credit.credit_outstanding)}
                      </p>
                      {credit.credit_settled > 0 && (
                        <p className="text-xs text-green-600 font-medium">Settled: {formatCurrency(credit.credit_settled)}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-600">
                  <Coins className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p>No credits issued yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Credit Approval Dialog */}

        <CreditApprovalDialog
          request={selectedCredit}
          isOpen={dialogOpen}
          onClose={handleDialogClose}
          onApproved={(result) => {
            alert(result.message);
            handleDialogClose();
          }}
        />
      </div>
    </CashierLayout>
  );
};

export default CashierCreditsPage;