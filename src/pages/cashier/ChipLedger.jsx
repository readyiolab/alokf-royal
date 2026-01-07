// src/pages/cashier/ChipLedger.jsx
// Chip Ledger Page with Export and Email functionality

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Calendar,
  Download,
  Mail,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Coins,
  Gift,
  Handshake,
  ShoppingCart,
  Building,
  RotateCcw,
  X,
  Loader2,
  CreditCard,
  Wallet,
} from 'lucide-react';
import cashbookService from '../../services/cashbook.service';
import CashierLayout from '../../components/layouts/CashierLayout';
import TransactionCardList from '../../components/transactions/TransactionCardList';

const ChipLedger = () => {
  // Helper to get today's date in IST timezone (YYYY-MM-DD format)
  const getTodayIST = () => {
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayIST());
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeBuyInFilter, setActiveBuyInFilter] = useState('all'); // For buy-in online sub-filters
  
  // Export dialog state
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exporting, setExporting] = useState(false);
  
  // Email dialog state
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailStartDate, setEmailStartDate] = useState('');
  const [emailEndDate, setEmailEndDate] = useState('');
  const [emailRecipients, setEmailRecipients] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchLedgerData();
  }, [selectedDate]);

  const fetchLedgerData = async () => {
    setLoading(true);
    try {
      const res = await cashbookService.getChipLedgerByDate(selectedDate);
      console.log('📊 Chip Ledger API Response:', res);
      if (res.success) {
        console.log('✅ Chip Ledger Data:', {
          has_data: res.data?.has_data,
          movement_count: res.data?.movements?.length,
          movements: res.data?.movements
        });
        setLedgerData(res.data);
      } else {
        console.error('❌ Chip Ledger API returned success: false', res);
      }
    } catch (err) {
      console.error('❌ Error fetching chip ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const changeDate = (days) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleExport = async () => {
    if (!exportStartDate || !exportEndDate) return;
    
    setExporting(true);
    try {
      const blob = await cashbookService.exportChipLedgerCSV(exportStartDate, exportEndDate);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `chip_ledger_${exportStartDate}_to_${exportEndDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setShowExportDialog(false);
    } catch (err) {
      console.error('Error exporting:', err);
    } finally {
      setExporting(false);
    }
  };

  const addEmailRecipient = () => {
    if (newEmail && newEmail.includes('@') && !emailRecipients.includes(newEmail)) {
      setEmailRecipients([...emailRecipients, newEmail]);
      setNewEmail('');
    }
  };

  const removeEmailRecipient = (email) => {
    setEmailRecipients(emailRecipients.filter(e => e !== email));
  };

  const handleSendEmail = async () => {
    if (!emailStartDate || !emailEndDate || emailRecipients.length === 0) return;
    
    setSending(true);
    try {
      await cashbookService.emailChipLedgerReport(emailStartDate, emailEndDate, emailRecipients);
      
      setShowEmailDialog(false);
      setEmailRecipients([]);
    } catch (err) {
      console.error('Error sending email:', err);
    } finally {
      setSending(false);
    }
  };

  // Check if selected date is today (using IST timezone)
  const isToday = selectedDate === getTodayIST();

  // ✅ Filter transactions based on active filter
  // When "all" is selected, show EVERYTHING - no filtering
  const filterTransactions = (transactions) => {
    if (!transactions || transactions.length === 0) {
      console.log('⚠️ No transactions to filter');
      return [];
    }
    
    // ✅ When "all" is selected, return ALL transactions without any filtering
    if (activeFilter === 'all') {
      console.log(`✅ Showing ALL ${transactions.length} transactions`);
      return transactions;
    }

    // Filter by specific type
    const filtered = transactions.filter((t) => {
      const type = t.transaction_type || '';
      const activity = t.activity_type || '';

      switch (activeFilter) {
        case 'buy-in-cash':
          return type === 'buy_in' && t.payment_mode === 'cash';
        case 'buy-in-online':
          if (type !== 'buy_in' || !t.payment_mode?.startsWith('online_')) return false;
          if (activeBuyInFilter === 'all') return true;
          return t.payment_mode === `online_${activeBuyInFilter}`;
        case 'credit-issue':
          return type === 'credit_issued' || type === 'issue_credit';
        case 'cash-payout':
          return type === 'cash_payout';
        case 'deposit-chips':
          return type === 'deposit_chips' || type === 'return_chips' || type === 'opening_chips' || type === 'redeem_stored';
        case 'rakeback':
          return activity === 'rakeback' || type === 'rakeback' || 
                 (t.notes && t.notes.toLowerCase().includes('rakeback'));
        case 'dealer-tips':
          return activity === 'dealer_tip' || 
                 (t.notes && t.notes.toLowerCase().includes('dealer tip'));
        case 'player-expense':
          return activity === 'player_expense' || 
                 (type === 'expense' && t.player_id);
        case 'club-expense':
          return activity === 'club_expense' || 
                 (type === 'expense' && !t.player_id);
        case 'reversed':
          return t.is_reversed === 1 || t.is_reversed === true || 
                 type === 'reversal' || t.reversal_transaction_id;
        default:
          return true;
      }
    });
    
    console.log(`🔍 Filter "${activeFilter}": ${filtered.length} of ${transactions.length} transactions`);
    return filtered;
  };

  const filteredTransactions = ledgerData?.movements 
    ? filterTransactions(ledgerData.movements) 
    : [];

  // ✅ Filter configuration with colors and icons - includes ALL transaction types
  const filters = [
    { id: 'all', label: 'All', color: null, icon: Calendar },
    { id: 'buy-in-cash', label: 'Buy-in Cash', color: 'bg-green-500', icon: Plus },
    { id: 'buy-in-online', label: 'Buy-in Online', color: 'bg-blue-500', icon: Plus },
    { id: 'credit-issue', label: 'Credit Issue', color: 'bg-orange-500', icon: CreditCard },
    { id: 'cash-payout', label: 'Cash Payout', color: 'bg-red-500', icon: Minus },
    { id: 'deposit-chips', label: 'Deposit Chips', color: 'bg-yellow-500', icon: Coins },
    { id: 'rakeback', label: 'Rakeback', color: 'bg-purple-500', icon: Gift },
    { id: 'dealer-tips', label: 'Dealer Tips', color: 'bg-blue-500', icon: Wallet },
    { id: 'player-expense', label: 'Player Expense', color: 'bg-pink-500', icon: ShoppingCart },
    { id: 'club-expense', label: 'Club Expense', color: 'bg-gray-600', icon: Building },
    { id: 'reversed', label: 'Reversed', color: 'bg-pink-500', icon: RotateCcw },
  ];

  return (
    <CashierLayout>
      <div className="space-y-6">
        {/* Header with Title, Date Navigation, Summary, and Action Buttons - All in one row */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Left: Title */}
          <h1 className="text-2xl font-bold text-gray-900">Chip Ledger</h1>
          
          {/* Center: Date Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => changeDate(-1)} className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 px-3 py-1.5 border rounded-md">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-900">{formatDate(selectedDate)}</span>
            </div>
            <Button variant="outline" size="icon" onClick={() => changeDate(1)} disabled={isToday} className="h-8 w-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Right: Summary and Action Buttons */}
          {ledgerData?.has_data && (
            <div className="flex items-center gap-6">
              {/* Summary */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">With cashier:</span>
                <span className="font-semibold text-orange-600">
                  {ledgerData.summary?.with_cashier || 0} chips ({formatCurrency(ledgerData.summary?.with_cashier_value || 0)})
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setExportStartDate(selectedDate);
                    setExportEndDate(selectedDate);
                    setShowExportDialog(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Export Range
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEmailStartDate(selectedDate);
                    setEmailEndDate(selectedDate);
                    setShowEmailDialog(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        {ledgerData?.has_data && ledgerData.movements?.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <Button
                  key={filter.id}
                  variant={activeFilter === filter.id ? 'default' : 'outline'}
                  onClick={() => {
                    setActiveFilter(filter.id);
                    setActiveBuyInFilter('all'); // Reset sub-filter when changing main filter
                  }}
                  className={`flex items-center gap-2 ${
                    activeFilter === filter.id 
                      ? 'bg-gray-900 text-white hover:bg-gray-800' 
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {filter.color && (
                    <div className={`w-2 h-2 rounded-full ${filter.color}`} />
                  )}
                  {filter.label}
                </Button>
              ))}
            </div>

            {/* Buy-in Online Sub-filters */}
            {activeFilter === 'buy-in-online' && (
              <div className="flex flex-wrap gap-2 pl-4 border-l-2 border-blue-300">
                <span className="text-sm font-medium text-gray-700 mr-2 flex items-center">Online Type:</span>
                {['all', 'sbi', 'hdfc', 'icici', 'other'].map((type) => (
                  <Button
                    key={type}
                    variant={activeBuyInFilter === type ? 'default' : 'outline'}
                    onClick={() => setActiveBuyInFilter(type)}
                    size="sm"
                    className={`text-xs ${
                      activeBuyInFilter === type 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-white hover:bg-blue-50'
                    }`}
                  >
                    {type === 'all' ? 'All' : type.toUpperCase()}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Transactions List */}
        {ledgerData?.has_data && filteredTransactions.length > 0 && (
          <div>
            <TransactionCardList
              transactions={filteredTransactions}
              onRefresh={fetchLedgerData}
            />
          </div>
        )}

        {/* No Data */}
        {!loading && (!ledgerData?.has_data || (ledgerData.movements?.length === 0 && activeFilter === 'all')) && (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-900">
              {!ledgerData?.has_data 
                ? `No chip data found for ${formatDate(selectedDate)}`
                : `No chip transactions on ${formatDate(selectedDate)}`}
            </p>
          </div>
        )}

        {/* No filtered results */}
        {!loading && ledgerData?.has_data && ledgerData.movements?.length > 0 && filteredTransactions.length === 0 && (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-900">No chip transactions found for the selected filter</p>
          </div>
        )}

        {/* Export Dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Chip Ledger</DialogTitle>
              <DialogDescription>
                Select a date range to export chip ledger as CSV.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>Cancel</Button>
              <Button onClick={handleExport} disabled={exporting || !exportStartDate || !exportEndDate}>
                {exporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Export CSV
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Email Dialog */}
        <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Email Chip Ledger Report</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">From Date</label>
                  <Input
                    type="date"
                    value={emailStartDate}
                    onChange={(e) => setEmailStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">To Date</label>
                  <Input
                    type="date"
                    value={emailEndDate}
                    onChange={(e) => setEmailEndDate(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Recipients</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addEmailRecipient()}
                  />
                  <Button onClick={addEmailRecipient}>Add</Button>
                </div>
                
                {emailRecipients.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {emailRecipients.map((email, idx) => (
                      <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                        {email}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => removeEmailRecipient(email)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEmailDialog(false)}>Cancel</Button>
              <Button onClick={handleSendEmail} disabled={sending || emailRecipients.length === 0}>
                {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Send Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CashierLayout>
  );
};

export default ChipLedger;