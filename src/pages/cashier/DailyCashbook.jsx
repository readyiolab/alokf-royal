// src/pages/cashier/DailyCashbook.jsx
// Daily Cashbook Page with Export and Email functionality

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Download,
  Mail,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  X,
  Loader2
} from 'lucide-react';
import cashbookService from '../../services/cashbook.service';
import CashierLayout from '../../components/layouts/CashierLayout';
import TransactionCardList from '../../components/transactions/TransactionCardList';

const DailyCashbook = () => {
  // Helper to get today's date in IST timezone (YYYY-MM-DD format)
  const getTodayIST = () => {
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayIST());
  const [cashbookData, setCashbookData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeBuyInFilter, setActiveBuyInFilter] = useState('all'); // For buy-in online sub-filters
  const [activeSettleFilter, setActiveSettleFilter] = useState('all'); // For settle online sub-filters
  
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
    fetchCashbookData();
  }, [selectedDate]);

  const fetchCashbookData = async () => {
    setLoading(true);
    try {
      const res = await cashbookService.getCashbookByDate(selectedDate);
      console.log('📊 Cashbook API Response:', res);
      if (res.success) {
        console.log('✅ Cashbook Data:', {
          has_data: res.data?.has_data,
          transaction_count: res.data?.transactions?.length,
          transactions: res.data?.transactions
        });
        setCashbookData(res.data);
      } else {
        console.error('❌ Cashbook API returned success: false', res);
      }
    } catch (err) {
      console.error('❌ Error fetching cashbook:', err);
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
      timeZone: 'Asia/Kolkata',
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

  const setQuickDateRange = (range) => {
    // Helper to get date in IST
    const getDateIST = (daysOffset = 0) => {
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istTime = new Date(now.getTime() + istOffset + (daysOffset * 24 * 60 * 60 * 1000));
      return istTime.toISOString().split('T')[0];
    };

    const today = getDateIST();
    let start, end;
    
    switch (range) {
      case 'today':
        start = end = today;
        break;
      case 'yesterday':
        start = end = getDateIST(-1);
        break;
      case 'last7':
        end = today;
        start = getDateIST(-7);
        break;
      case 'last30':
        end = today;
        start = getDateIST(-30);
        break;
      case 'thisMonth':
        const nowIST = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
        start = new Date(Date.UTC(nowIST.getUTCFullYear(), nowIST.getUTCMonth(), 1)).toISOString().split('T')[0];
        end = today;
        break;
      case 'lastMonth':
        const lastMonthIST = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
        const lastMonth = new Date(Date.UTC(lastMonthIST.getUTCFullYear(), lastMonthIST.getUTCMonth() - 1, 1));
        start = lastMonth.toISOString().split('T')[0];
        end = new Date(Date.UTC(lastMonthIST.getUTCFullYear(), lastMonthIST.getUTCMonth(), 0)).toISOString().split('T')[0];
        break;
    }
    
    if (showExportDialog) {
      setExportStartDate(start);
      setExportEndDate(end);
    } else {
      setEmailStartDate(start);
      setEmailEndDate(end);
    }
  };

  const handleExport = async () => {
    if (!exportStartDate || !exportEndDate) return;
    
    setExporting(true);
    try {
      const blob = await cashbookService.exportCashbookCSV(exportStartDate, exportEndDate);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cashbook_${exportStartDate}_to_${exportEndDate}.csv`);
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
      await cashbookService.emailCashbookReport(emailStartDate, emailEndDate, emailRecipients);
      
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
        case 'settle-cash':
          return type === 'settle_credit' && t.payment_mode === 'cash';
        case 'settle-online':
          if (type !== 'settle_credit' || !t.payment_mode?.startsWith('online_')) return false;
          if (activeSettleFilter === 'all') return true;
          return t.payment_mode === `online_${activeSettleFilter}`;
        case 'cash-payout':
          return type === 'cash_payout';
        case 'deposit-chips':
          return type === 'deposit_chips' || type === 'return_chips';
        case 'deposit-cash':
          return type === 'deposit_cash';
        case 'credit-issue':
          return type === 'credit_issued' || type === 'issue_credit';
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
        default:
          return true;
      }
    });
    
    console.log(`🔍 Filter "${activeFilter}": ${filtered.length} of ${transactions.length} transactions`);
    return filtered;
  };

  const filteredTransactions = cashbookData?.transactions 
    ? filterTransactions(cashbookData.transactions) 
    : [];

  // ✅ Filter configuration with colors - includes ALL transaction types
  const filters = [
    { id: 'all', label: 'All', color: null },
    { id: 'buy-in-cash', label: 'Buy-in Cash', color: 'bg-green-500' },
    { id: 'buy-in-online', label: 'Buy-in Online', color: 'bg-blue-500' },
    { id: 'settle-cash', label: 'Settle Cash', color: 'bg-orange-500' },
    { id: 'settle-online', label: 'Settle Online', color: 'bg-orange-400' },
    { id: 'cash-payout', label: 'Cash Payout', color: 'bg-red-500' },
    { id: 'deposit-chips', label: 'Deposit Chips', color: 'bg-yellow-500' },
    { id: 'deposit-cash', label: 'Deposit Cash', color: 'bg-emerald-500' },
    { id: 'credit-issue', label: 'Issue Credit', color: 'bg-blue-500' },
    { id: 'rakeback', label: 'Rakeback', color: 'bg-purple-500' },
    { id: 'dealer-tips', label: 'Dealer Tips', color: 'bg-indigo-500' },
    { id: 'player-expense', label: 'Player Expense', color: 'bg-pink-500' },
    { id: 'club-expense', label: 'Club Expense', color: 'bg-gray-600' },
  ];

  return (
    <CashierLayout> 
    <div className="space-y-6">
      {/* Header with Title, Date Navigation, Summary, and Action Buttons - All in one row */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Left: Title */}
        <h1 className="text-2xl font-bold text-gray-900">Cashbook</h1>
        
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
        {cashbookData?.has_data && (
          <div className="flex items-center gap-6">
            {/* Summary */}
            <div className="flex items-center gap-4">
              <span className="text-green-600 font-semibold">
                +{formatCurrency(cashbookData.summary.total_inflow)}
              </span>
              <span className="text-red-600 font-semibold">
                -{formatCurrency(cashbookData.summary.total_outflow)}
              </span>
              <span className="text-gray-900 font-semibold">
                Net: {formatCurrency(cashbookData.summary.net_change)}
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
      {cashbookData?.has_data && cashbookData.transactions?.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Button
                key={filter.id}
                variant={activeFilter === filter.id ? 'default' : 'outline'}
                onClick={() => {
                  setActiveFilter(filter.id);
                  setActiveBuyInFilter('all'); // Reset buy-in sub-filter when changing main filter
                  setActiveSettleFilter('all'); // Reset settle sub-filter when changing main filter
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

          {/* Settle Online Sub-filters */}
          {activeFilter === 'settle-online' && (
            <div className="flex flex-wrap gap-2 pl-4 border-l-2 border-orange-300">
              <span className="text-sm font-medium text-gray-700 mr-2 flex items-center">Bank:</span>
              {['all', 'sbi', 'hdfc', 'icici', 'other'].map((type) => (
                <Button
                  key={type}
                  variant={activeSettleFilter === type ? 'default' : 'outline'}
                  onClick={() => setActiveSettleFilter(type)}
                  size="sm"
                  className={`text-xs ${
                    activeSettleFilter === type 
                      ? 'bg-orange-600 text-white hover:bg-orange-700' 
                      : 'bg-white hover:bg-orange-50'
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
      {cashbookData?.has_data && filteredTransactions.length > 0 && (
        <div>
          <TransactionCardList
            transactions={filteredTransactions}
            onRefresh={fetchCashbookData}
          />
        </div>
      )}

      {/* No filtered results */}
      {cashbookData?.has_data && cashbookData.transactions?.length > 0 && filteredTransactions.length === 0 && (
        <div className="p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-900">No transactions found for the selected filter</p>
        </div>
      )}

      {/* No Data */}
      {!loading && !cashbookData?.has_data && (
        <div className="p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-900">No data found for {formatDate(selectedDate)}</p>
        </div>
      )}

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Cashbook</DialogTitle>
            <DialogDescription>
              Select a date range to export transactions as CSV.
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
            
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setQuickDateRange('today')}>Today</Button>
              <Button size="sm" variant="outline" onClick={() => setQuickDateRange('yesterday')}>Yesterday</Button>
              <Button size="sm" variant="outline" onClick={() => setQuickDateRange('last7')}>Last 7 days</Button>
              <Button size="sm" variant="outline" onClick={() => setQuickDateRange('last30')}>Last 30 days</Button>
              <Button size="sm" variant="outline" onClick={() => setQuickDateRange('thisMonth')}>This month</Button>
              <Button size="sm" variant="outline" onClick={() => setQuickDateRange('lastMonth')}>Last month</Button>
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
            <DialogTitle>Email Cashbook Report</DialogTitle>
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

export default DailyCashbook;