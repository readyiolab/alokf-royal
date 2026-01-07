// ============================================
// FILE: pages/cashier/Transactions.jsx
// Cashier Transactions Dashboard - Modular Version
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import CashierLayout from '../../components/layouts/CashierLayout';
import { useSession } from '../../contexts/Sessioncontext'; // ✅ FIXED: Using context version (same as CashierLayout)
import { useAuth } from '../../hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Phone, Mail, Activity, Users, Clock, Wallet, TrendingDown, CreditCard, Coins, ArrowUp, Settings, Plus, Eye, ArrowDown } from 'lucide-react';

// Services
import playerService from '../../services/player.service';
import cashierService from '../../services/cashier.service';
import transactionService from '../../services/transaction.service';

// Modular Components
import {
 
  StartSessionModal,
  QuickActionsGrid,
 
  ChipsInventoryCard,
 
  TopUpFloatModal,
  ViewFloatModal,
  CloseDayModal,
} from '../../components/cashier';

// Transaction Forms
import BuyInForm from '../../components/transactions/BuyInForm';
import CashPayoutForm from '../../components/transactions/CashPayoutForm';
import CreditForm from '../../components/transactions/CreditForm';
import DepositChipsForm from '../../components/transactions/DepositChipsForm';
import SettleCreditForm from '../../components/credit/SettleCreditForm';

// Special Action Modals
import RakebackModal from '../../components/admin/RakebackModal';
import DealerTipModal from '../../components/admin/DealerTipModal';
import PlayerExpenseModal from '../../components/admin/PlayerExpenseModal';
import ClubExpenseModal from '../../components/admin/ClubExpenseModal';

// ==========================================
// TRANSACTION FILTERS
// ==========================================

const getTransactionType = (t) => {
  if (!t) return '';
  return t.transaction_type || '';
};

const getCashbookTransactions = (transactions = []) =>
  transactions.filter((t) => {
    if (!t) return false;
    
    const type = getTransactionType(t);
    
    // Debug: Log deposit_cash transactions
    if (type === 'deposit_cash') {
      console.log('🔍 Filtering deposit_cash transaction:', {
        transaction_id: t.transaction_id,
        type: t.transaction_type,
        amount: t.amount,
        primary_amount: t.primary_amount,
        secondary_amount: t.secondary_amount
      });
    }

    // ✅ deposit_cash should always appear in cashbook (cash deposit)
    if (type === 'deposit_cash') {
      console.log('✅ Including deposit_cash in cashbook');
      return true; // Always include deposit_cash transactions
    }

    if (['buy_in', 'cash_payout', 'settle_credit', 'add_float', 'expense'].includes(type)) {
      return true;
    }

    if (t.activity_type === 'dealer_tip') {
      const cashPaid = parseFloat(t.cash_paid_to_dealer || t.total_cash_paid || 0);
      return cashPaid > 0;
    }

    if (t.activity_type === 'club_expense') return true;
    if (t.activity_type === 'player_expense') return false;

    if (t.activity_type === 'rakeback' && parseFloat(t.cash_amount || 0) > 0) {
      return true;
    }

    const primaryMove = parseFloat(t.primary_amount || 0);
    const secondaryMove = parseFloat(t.secondary_amount || 0);
    if (primaryMove !== 0 || secondaryMove !== 0) return true;

    return false;
  });

const getChipLedgerTransactions = (transactions = []) =>
  transactions.filter((t) => {
    if (!t) return false;
    
    const type = t.transaction_type || getTransactionType(t);
    const activity = t.activity_type;

    // Debug: Log deposit_chips transactions
    if (type === 'deposit_chips') {
      console.log('🔍 Filtering deposit_chips transaction:', {
        transaction_id: t.transaction_id,
        type: t.transaction_type,
        chips_amount: t.chips_amount,
        chips_100: t.chips_100,
        chips_500: t.chips_500,
        chips_1000: t.chips_1000,
        chips_5000: t.chips_5000,
        chips_10000: t.chips_10000
      });
    }

    // ✅ deposit_chips should always appear in chip ledger (chips are being deposited)
    if (type === 'deposit_chips') {
      console.log('✅ Including deposit_chips in chip ledger');
      return true; // Always include deposit_chips transactions
    }

    if (['buy_in', 'cash_payout', 'credit_issued', 'issue_credit', 'return_chips', 'opening_chips', 'redeem_stored'].includes(type)) {
      return true;
    }

    if (activity === 'dealer_tip' && parseFloat(t.chip_amount || 0) > 0) return true;
    if (activity === 'player_expense' && parseFloat(t.chip_amount || 0) > 0) return true;
    if (activity === 'rakeback' && parseFloat(t.amount || t.chip_amount || 0) > 0) return true;

    // Check for chip breakdown or chips_amount
    if (
      parseInt(t.chips_100 || 0) > 0 ||
      parseInt(t.chips_500 || 0) > 0 ||
      parseInt(t.chips_1000 || 0) > 0 ||
      parseInt(t.chips_5000 || 0) > 0 ||
      parseInt(t.chips_10000 || 0) > 0 ||
      parseFloat(t.chips_amount || 0) > 0
    ) {
      return true;
    }

    return false;
  });

const getCreditRegisterTransactions = (transactions = []) =>
  transactions.filter((t) => ['credit_issued', 'settle_credit'].includes(getTransactionType(t)));

const getUniquePlayersCount = (transactions = []) =>
  new Set(transactions.filter((t) => t.player_id).map((t) => t.player_id)).size;

// ==========================================
// MAIN COMPONENT
// ==========================================

const CashierTransactions = () => {
  const { toast } = useToast();
  // ✅ FIXED: Using context version with correct property name
  const { session, dashboard, loading, error, hasActiveSession, refresh: refreshSession } = useSession();
  const { token } = useAuth();

  // UI State
  const [activeForm, setActiveForm] = useState(null);
  const [showStartSessionModal, setShowStartSessionModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showViewFloatModal, setShowViewFloatModal] = useState(false);
  const [showCloseDayModal, setShowCloseDayModal] = useState(false);
  const [showFloatHistoryModal, setShowFloatHistoryModal] = useState(false);

  // Special Action Modals
  const [showRakebackModal, setShowRakebackModal] = useState(false);
  const [showDealerTipModal, setShowDealerTipModal] = useState(false);
  const [showPlayerExpenseModal, setShowPlayerExpenseModal] = useState(false);
  const [showClubExpenseModal, setShowClubExpenseModal] = useState(false);

  // Player State
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showPlayerTransactions, setShowPlayerTransactions] = useState(false);
  const [playerTransactions, setPlayerTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Float History State
  const [floatHistory, setFloatHistory] = useState(null);
  const [loadingFloatHistory, setLoadingFloatHistory] = useState(false);

  // ✅ FIXED: Compute isSessionActive - handle session_id === 0 as valid
  // session_id can be 0 which is falsy in JS, so we need explicit checks
  const isSessionActive = !!hasActiveSession && 
                          session && 
                          (session.session_id !== null && session.session_id !== undefined) && // ✅ Fixed: 0 is valid
                          (session.is_closed === 0 || session.is_closed === false || session.is_closed === null || session.is_closed === undefined);

  // Debug logging
  useEffect(() => {
    console.log('🎯 Transactions - hasActiveSession:', hasActiveSession, 'isSessionActive:', isSessionActive);
    console.log('   - session:', session);
    console.log('   - session?.session_id:', session?.session_id, 'type:', typeof session?.session_id);
    console.log('   - session?.is_closed:', session?.is_closed, 'type:', typeof session?.is_closed);
  }, [hasActiveSession, isSessionActive, session]);

  // ==========================================
  // DATA FETCHING
  // ==========================================

  const fetchPlayers = useCallback(async () => {
    if (!token) return;

    try {
      const response = await playerService.getAllPlayers(token);
      let playersList = [];

      if (Array.isArray(response)) {
        playersList = response;
      } else if (response?.data?.players && Array.isArray(response.data.players)) {
        playersList = response.data.players;
      } else if (response?.players && Array.isArray(response.players)) {
        playersList = response.players;
      }

      setPlayers(playersList);
    } catch (err) {
      console.error('Error fetching players:', err);
      setPlayers([]);
    }
  }, [token]);

  const fetchPlayerTransactions = async (playerId) => {
    if (!playerId) {
      setPlayerTransactions([]);
      return;
    }

    try {
      setLoadingTransactions(true);
      const transactions = await transactionService.getPlayerTransactionHistory(token, playerId);
      setPlayerTransactions(transactions || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setPlayerTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const fetchFloatHistory = async () => {
    if (session?.session_id === null || session?.session_id === undefined) return;

    setLoadingFloatHistory(true);
    try {
      const historyResult = await cashierService.getFloatHistory(session.session_id);
      const additions = historyResult?.data || [];

      const summary = {
        total_additions: additions.length,
        total_cash_added: additions.reduce((sum, a) => sum + Number(a.float_amount || 0), 0),
        total_chips_added: additions.reduce(
          (sum, a) =>
            sum +
            (a.chips_100 || 0) * 100 +
            (a.chips_500 || 0) * 500 +
            (a.chips_5000 || 0) * 5000 +
            (a.chips_10000 || 0) * 10000,
          0
        ),
      };

      setFloatHistory({ additions, summary });
    } catch (err) {
      console.error('Error fetching float history:', err);
      setFloatHistory({ additions: [], summary: {} });
    } finally {
      setLoadingFloatHistory(false);
    }
  };

  // ==========================================
  // EFFECTS
  // ==========================================

  useEffect(() => {
    if (token) {
      fetchPlayers();
    }
  }, [token, fetchPlayers]);

  useEffect(() => {
    if (!isSessionActive) {
      setActiveForm(null);
    }
  }, [isSessionActive]);

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleViewPlayer = (player) => {
    setSelectedPlayer(player);
    setShowPlayerTransactions(true);
    fetchPlayerTransactions(player.player_id);
  };

  const handleCloseSession = async () => {
    try {
      await cashierService.closeSession();
      toast({
        title: 'Session Closed',
        description: 'Session has been closed successfully. You can start a new session.',
      });
      refreshSession();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to close session',
      });
    }
  };

  const handleOpenFloatHistory = () => {
    setShowFloatHistoryModal(true);
    fetchFloatHistory();
  };

  const handleTransactionComplete = () => {
    setActiveForm(null);
    refreshSession();
  };

  const handleSessionStarted = async () => {
    console.log('=== handleSessionStarted CALLED (Transactions) ===');
    setShowStartSessionModal(false);
    setShowTopUpModal(false);
    setShowViewFloatModal(false);
    setShowCloseDayModal(false);
    
    // Wait for backend to process, then refresh context
    setTimeout(async () => {
      console.log('=== Refreshing session context (Transactions) ===');
      await refreshSession();
      console.log('=== Session context refreshed (Transactions) ===');
    }, 1500);
  };

  // ==========================================
  // HELPERS
  // ==========================================

  const formatCurrency = (amount) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(numAmount || 0);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // ==========================================
  // TRANSACTION TYPE MAPPING
  // ==========================================

  const transactionForms = {
    'issue-credit': { name: 'Issue Credit', component: CreditForm },
    'buy-in': { name: 'Buy-in', component: BuyInForm },
    'settle-cash': { name: 'Settle Cash', component: SettleCreditForm },
    'cash-payout': { name: 'Cash Payout', component: CashPayoutForm },
    'deposit-chips': { name: 'Deposit Chips', component: DepositChipsForm },
  };

  const activeTransaction = transactionForms[activeForm];
  const ActiveFormComponent = activeTransaction?.component;

  // ==========================================
  // COMPUTED VALUES
  // ==========================================

  const allTransactions = dashboard?.transactions?.all || [];
  
  // Debug: Log deposit transactions
  const depositCashTransactions = allTransactions.filter(t => t.transaction_type === 'deposit_cash');
  const depositChipsTransactions = allTransactions.filter(t => t.transaction_type === 'deposit_chips');
  if (depositCashTransactions.length > 0) {
    console.log('🔍 Found deposit_cash transactions:', depositCashTransactions);
  }
  if (depositChipsTransactions.length > 0) {
    console.log('🔍 Found deposit_chips transactions:', depositChipsTransactions);
  }
  
  const cashbookTransactions = getCashbookTransactions(allTransactions);
  const chipLedgerTransactions = getChipLedgerTransactions(allTransactions);
  const creditRegisterTransactions = getCreditRegisterTransactions(allTransactions);
  const uniquePlayers = getUniquePlayersCount(allTransactions);
  
  // Debug: Log filtered results
  const filteredDepositCash = cashbookTransactions.filter(t => t.transaction_type === 'deposit_cash');
  const filteredDepositChips = chipLedgerTransactions.filter(t => t.transaction_type === 'deposit_chips');
  if (depositCashTransactions.length > 0 && filteredDepositCash.length === 0) {
    console.warn('⚠️ deposit_cash transactions filtered out!', {
      original: depositCashTransactions.length,
      filtered: filteredDepositCash.length
    });
  }
  if (depositChipsTransactions.length > 0 && filteredDepositChips.length === 0) {
    console.warn('⚠️ deposit_chips transactions filtered out!', {
      original: depositChipsTransactions.length,
      filtered: filteredDepositChips.length
    });
  }

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <CashierLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-sm font-medium text-gray-500">Loading session data...</p>
        </div>
      </CashierLayout>
    );
  }

  // ✅ Only show error for real errors, not for "no session" or "session closed"
  if (error && !error.includes('No session') && !error.includes('No active session')) {
    return (
      <CashierLayout>
        <Alert variant="destructive" className="max-w-2xl mx-auto mt-10 border-2">
          <AlertCircle className="w-5 h-5" />
          <AlertDescription className="ml-2 py-1">
            {error}
          </AlertDescription>
        </Alert>
      </CashierLayout>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <CashierLayout>
      <div className="space-y-6 p-6" key={`transactions-${session?.session_id ?? 'no-session'}-${hasActiveSession}`}>
        {/* No Session Warning */}
        {!isSessionActive && (
          <Alert className="bg-yellow-50 border-2 border-yellow-300">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <AlertDescription className="ml-2 py-1 text-yellow-700 font-medium">
              No active session. Start a new session to record transactions.
            </AlertDescription>
          </Alert>
        )}

        {/* ============ SECTION 1: DASHBOARD CARDS ============ */}
        <div className="space-y-6">
          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* DAILY SESSION Card */}
            <Card className="bg-white border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-gray-700">DAILY SESSION</CardTitle>
                <Clock className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-bold text-black">
                  {formatCurrency(dashboard?.wallets?.primary?.current || 0)}
                </div>
                <p className="text-xs text-gray-600">AVAILABLE FLOAT</p>
                
                {/* ✅ FIXED: Render buttons based on session status - same logic as Dashboard */}
                {isSessionActive ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2 flex-col justify-between  ">
                      <Button
                        onClick={() => setShowTopUpModal(true)}
                        variant="outline"
                        className="flex-1 text-xs h-8 border-gray-300 hover:bg-gray-50"
                        size="sm"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Top Up
                      </Button>
                      <Button
                        onClick={() => setShowViewFloatModal(true)}
                        variant="outline"
                        className="flex-1 text-xs h-8 border-gray-300 hover:bg-gray-50"
                        size="sm"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Float
                      </Button>
                    </div>
                     <Button
                       onClick={() => setShowCloseDayModal(true)}
                       variant="outline"
                       className="w-full text-xs h-8 border-gray-300 hover:bg-gray-50"
                       size="sm"
                     >
                       <ArrowDown className="w-3 h-3 mr-1" />
                       Close
                     </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowStartSessionModal(true)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm h-8"
                    size="sm"
                  >
                    <ArrowUp className="w-3 h-3 mr-1" />
                    Start New Day
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
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cash in Hand</span>
                    <span className="font-semibold text-black">{formatCurrency(dashboard?.wallets?.secondary?.cash_balance || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Online Money</span>
                    <span className="font-semibold text-black">{formatCurrency(dashboard?.wallets?.secondary?.online_balance || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">SBI</span>
                    <span className="font-semibold text-black">{formatCurrency(dashboard?.totals?.sbi_deposits || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">HDFC</span>
                    <span className="font-semibold text-black">{formatCurrency(dashboard?.totals?.hdfc_deposits || 0)}</span>
                  </div>
                </div>
                {!isSessionActive && (
                  <p className="text-xs text-gray-500 mt-2">Day closed - Start new day to see stats</p>
                )}
              </CardContent>
            </Card>

            {/* CASH TAKEN OUT Card */}
            <Card className="bg-white border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-gray-700">CASH TAKEN OUT</CardTitle>
                <TrendingDown className="w-4 h-4 text-red-500" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold text-black">
                  {formatCurrency((dashboard?.totals?.withdrawals || 0) + (dashboard?.totals?.expenses || 0))}
                </div>
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payouts</span>
                    <span className="font-semibold text-black">{formatCurrency(dashboard?.totals?.withdrawals || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Dealer Tips (Cash)</span>
                    <span className="font-semibold text-black">{formatCurrency(dashboard?.totals?.dealer_tips || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Player Expenses (Vendors)</span>
                    <span className="font-semibold text-black">{formatCurrency(dashboard?.totals?.player_expenses || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Club Expenses</span>
                    <span className="font-semibold text-black">{formatCurrency(dashboard?.totals?.club_expenses || 0)}</span>
                  </div>
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
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(dashboard?.outstanding_credit || 0)}
                </div>
                <p className="text-xs text-gray-600">
                  {(dashboard?.outstanding_credit || 0) > 0 ? "Pending settlements" : "All settled"}
                </p>
              </CardContent>
            </Card>

            {/* CHIPS INVENTORY Card */}
            <ChipsInventoryCard 
              dashboard={dashboard} 
              formatCurrency={formatCurrency}
            />
          </div>
        </div>

        {/* ============ SECTION 2: QUICK ACTIONS ============ */}
        <QuickActionsGrid
          hasActiveSession={isSessionActive}
          onSelectTransaction={setActiveForm}
          onRakeback={() => setShowRakebackModal(true)}
          onDealerTip={() => setShowDealerTipModal(true)}
          onPlayerExpense={() => setShowPlayerExpenseModal(true)}
          onClubExpense={() => setShowClubExpenseModal(true)}
        />

        
      </div>

      {/* ============ MODALS ============ */}

      {/* Transaction Form Modal */}
      <Dialog open={!!activeForm} onOpenChange={(open) => !open && setActiveForm(null)}>
        <DialogContent className={`${activeForm === 'cash-payout' ? 'max-w-5xl w-full max-h-[95vh] overflow-y-auto' : activeForm === 'buy-in' ? 'sm:max-w-2xl max-h-[90vh] p-0 overflow-hidden border-0 bg-white shadow-2xl rounded-2xl' : 'sm:max-w-2xl max-h-[90vh] bg-card border-border'}`}>
          {activeForm === 'issue-credit' ? (
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Coins className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span>Issue Credit</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Give credit to a player in mixed chips
                  </span>
                </div>
              </DialogTitle>
            </DialogHeader>
          ) : activeForm !== 'buy-in' ? (
            <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white sticky top-0 z-10">
              <DialogTitle className="text-xl font-bold">{activeTransaction?.name}</DialogTitle>
            </DialogHeader>
          ) : null}

          <div className={`${activeForm === 'cash-payout' ? 'p-6' : activeForm === 'buy-in' ? 'p-6 overflow-y-auto max-h-[calc(90vh-0px)]' : activeForm === 'issue-credit' ? 'p-6 overflow-y-auto max-h-[calc(90vh-120px)]' : activeForm === 'deposit-chips' ? 'p-6 overflow-y-auto max-h-[calc(90vh-100px)]' : 'p-6 overflow-y-auto max-h-[calc(90vh-100px)]'}`}>
            {ActiveFormComponent && (
              <ActiveFormComponent onSuccess={handleTransactionComplete} onCancel={() => setActiveForm(null)} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Start Session Modal */}
      <StartSessionModal
        open={showStartSessionModal}
        onOpenChange={setShowStartSessionModal}
        onSuccess={handleSessionStarted}
      />

        {/* Top Up Float Modal */}
        <TopUpFloatModal
          open={showTopUpModal}
          onOpenChange={setShowTopUpModal}
          onSuccess={handleSessionStarted}
        />

      {/* View Float Modal */}
      <ViewFloatModal
        open={showViewFloatModal}
        onOpenChange={setShowViewFloatModal}
      />

      {/* Close Day Modal */}
      <CloseDayModal
        open={showCloseDayModal}
        onOpenChange={setShowCloseDayModal}
        onSuccess={handleSessionStarted}
      />

      {/* Special Action Modals */}
      <RakebackModal
        isOpen={showRakebackModal}
        onClose={() => setShowRakebackModal(false)}
        onSuccess={() => {
          setShowRakebackModal(false);
          refreshSession();
        }}
        sessionId={session?.session_id}
      />

      <DealerTipModal
        isOpen={showDealerTipModal}
        onClose={() => setShowDealerTipModal(false)}
        onSuccess={() => {
          setShowDealerTipModal(false);
          refreshSession();
        }}
        sessionId={session?.session_id}
      />

      <PlayerExpenseModal
        isOpen={showPlayerExpenseModal}
        onClose={() => setShowPlayerExpenseModal(false)}
        onSuccess={() => {
          setShowPlayerExpenseModal(false);
          refreshSession();
        }}
        sessionId={session?.session_id}
      />

      <ClubExpenseModal
        isOpen={showClubExpenseModal}
        onClose={() => setShowClubExpenseModal(false)}
        onSuccess={() => {
          setShowClubExpenseModal(false);
          refreshSession();
        }}
      />

      {/* Player Transactions Modal */}
      <Dialog open={showPlayerTransactions} onOpenChange={setShowPlayerTransactions}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 overflow-hidden border-0 bg-white shadow-2xl rounded-2xl">
          <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white sticky top-0 z-10">
            <DialogTitle className="text-xl font-bold flex items-center gap-3">
              <Users className="w-6 h-6 text-white" />
              {selectedPlayer ? `${selectedPlayer.player_name}'s Transactions` : 'Player Transactions'}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
            {selectedPlayer && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-blue-600 text-white font-semibold text-lg">
                      {getInitials(selectedPlayer.player_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{selectedPlayer.player_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="text-xs">{selectedPlayer.player_code}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {selectedPlayer.phone_number}
                      </span>
                      {selectedPlayer.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {selectedPlayer.email}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {selectedPlayer.visit_count} visits
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Outstanding Credit</p>
                    <p className="text-lg font-semibold text-orange-600">
                      {formatCurrency(selectedPlayer.outstanding_credit)}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {loadingTransactions ? (
              <div className="text-center py-8 text-blue-700 font-semibold">Loading transactions...</div>
            ) : playerTransactions && playerTransactions.length > 0 ? (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Transaction History</h4>
                <div className="divide-y divide-gray-200">
                  {playerTransactions.map((transaction, idx) => (
                    <div key={transaction.transaction_id || idx} className="py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            {transaction.transaction_type?.replace('_', ' ').toUpperCase() || 'Transaction'}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {transaction.status || 'completed'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {transaction.description || transaction.notes || 'No description'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {transaction.created_at ? new Date(transaction.created_at).toLocaleString('en-IN') : ''}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 text-right min-w-[120px]">
                        <div className="text-lg font-bold text-green-600">{formatCurrency(transaction.amount || 0)}</div>
                        {transaction.chips_amount && transaction.chips_amount > 0 && (
                          <div className="text-sm text-purple-600">Chips: {formatCurrency(transaction.chips_amount)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No transactions found for this player.</div>
            )}
            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setShowPlayerTransactions(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Float History Modal */}
      <Dialog open={showFloatHistoryModal} onOpenChange={setShowFloatHistoryModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 overflow-hidden border-0 bg-white shadow-2xl rounded-2xl">
          <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white sticky top-0 z-10">
            <DialogTitle className="text-xl font-bold flex items-center gap-3">Float Addition History</DialogTitle>
          </DialogHeader>
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
            {loadingFloatHistory ? (
              <div className="text-center py-8 text-blue-700 font-semibold">Loading...</div>
            ) : floatHistory && floatHistory.additions && floatHistory.additions.length > 0 ? (
              <div>
                <div className="mb-4">
                  <div className="font-semibold text-lg text-blue-900 mb-1">Summary</div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-black">
                    <div>
                      Total Additions: <span className="font-bold">{floatHistory.summary?.total_additions || 0}</span>
                    </div>
                    <div>
                      Total Cash Added:{' '}
                      <span className="font-bold text-green-700">
                        {formatCurrency(floatHistory.summary?.total_cash_added || 0)}
                      </span>
                    </div>
                    <div>
                      Total Chips Added:{' '}
                      <span className="font-bold text-purple-700">
                        {formatCurrency(floatHistory.summary?.total_chips_added || 0)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {floatHistory.additions.map((add, idx) => (
                    <div key={add.addition_id || idx} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex-1">
                        <div className="font-semibold text-blue-800">
                          {formatCurrency(add.float_amount)}{' '}
                          {add.addition_type === 'cash_with_chips' && (
                            <span className="text-xs text-purple-700">(+chips)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{add.reason || add.notes}</div>
                        <div className="text-xs text-gray-400">
                          {add.created_at ? new Date(add.created_at).toLocaleString('en-IN') : ''}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 text-xs text-right min-w-[120px]">
                        <div>
                          Chips:{' '}
                          <span className="font-bold text-purple-700">
                            {formatCurrency(
                              (add.chips_100 || 0) * 100 +
                                (add.chips_500 || 0) * 500 +
                                (add.chips_5000 || 0) * 5000 +
                                (add.chips_10000 || 0) * 10000
                            )}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {add.chips_100 ? (
                            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">100×{add.chips_100}</span>
                          ) : null}
                          {add.chips_500 ? (
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">500×{add.chips_500}</span>
                          ) : null}
                          {add.chips_5000 ? (
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">5K×{add.chips_5000}</span>
                          ) : null}
                          {add.chips_10000 ? (
                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded">10K×{add.chips_10000}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No float additions yet.</div>
            )}
            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setShowFloatHistoryModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </CashierLayout>
  );
};

export default CashierTransactions;