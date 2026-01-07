// src/pages/cashier/CreditRegister.jsx
// Credit Register Page with Export and Email functionality

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
  CreditCard,
  RotateCcw,
  X,
  Loader2,
  Coins,
  Handshake,
} from 'lucide-react';
import cashbookService from '../../services/cashbook.service';
import CashierLayout from '../../components/layouts/CashierLayout';
import TransactionCardList from '../../components/transactions/TransactionCardList';

const CreditRegister = () => {
  // Helper to get today's date in IST timezone (YYYY-MM-DD format)
  const getTodayIST = () => {
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayIST());
  const [registerData, setRegisterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
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
    fetchRegisterData();
  }, [selectedDate]);

  const fetchRegisterData = async () => {
    setLoading(true);
    try {
      const res = await cashbookService.getCreditRegisterByDate(selectedDate);
      if (res.success) {
        const data = res.data;
        
        // Convert credits to transaction format for display
        const creditTransactions = (data.credits || []).map(credit => ({
          transaction_id: credit.credit_id,
          transaction_type: 'credit_issued',
          player_id: credit.player_id,
          player_name: credit.player_name,
          phone_number: credit.phone_number,
          amount: parseFloat(credit.credit_issued || 0),
          chips_amount: parseFloat(credit.credit_issued || 0),
          chips_100: credit.chips_100 || 0,
          chips_500: credit.chips_500 || 0,
          chips_5000: credit.chips_5000 || 0,
          chips_10000: credit.chips_10000 || 0,
          created_at: credit.created_at || credit.issued_at,
          notes: `Credit issued: ₹${parseFloat(credit.credit_issued || 0).toLocaleString('en-IN')}, Outstanding: ₹${parseFloat(credit.credit_outstanding || 0).toLocaleString('en-IN')}`,
          notes_count: 0,
          notes_resolved: 0,
          is_reversed: 0,
          reversal_reason: null
        }));
        
        // Combine with existing transactions
        const allTransactions = [...creditTransactions, ...(data.transactions || [])];
        
        // Sort by created_at descending
        allTransactions.sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateB - dateA;
        });
        
        setRegisterData({
          ...data,
          transactions: allTransactions
        });
      }
    } catch (err) {
      console.error('Error fetching credit register:', err);
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
      const blob = await cashbookService.exportCreditRegisterCSV(exportStartDate, exportEndDate);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `credit_register_${exportStartDate}_to_${exportEndDate}.csv`);
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
      await cashbookService.emailCreditRegisterReport(emailStartDate, emailEndDate, emailRecipients);
      
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

  // Filter transactions based on active filter
  const filterTransactions = (transactions) => {
    if (!transactions || transactions.length === 0) return [];
    if (activeFilter === 'all') return transactions;

    return transactions.filter((t) => {
      const type = t.transaction_type || '';
      const paymentMode = t.payment_mode || '';

      switch (activeFilter) {
        case 'credit-issue':
          return type === 'credit_issued' || type === 'issue_credit';
        case 'chip-return':
          return type === 'return_chips' || type === 'redeem_stored';
        case 'settle-cash':
          return type === 'settle_credit' && paymentMode === 'cash';
        case 'settle-online':
          if (type !== 'settle_credit' || !paymentMode?.startsWith('online_')) return false;
          if (activeSettleFilter === 'all') return true;
          return paymentMode === `online_${activeSettleFilter}`;
        default:
          return true;
      }
    });
  };

  const filteredTransactions = registerData?.transactions 
    ? filterTransactions(registerData.transactions) 
    : [];

  // Filter configuration with colors and icons
  const filters = [
    { id: 'all', label: 'All', color: null, icon: Calendar },
    { id: 'credit-issue', label: 'Credit Issue', color: 'bg-orange-500', icon: CreditCard },
    { id: 'chip-return', label: 'Chip Return', color: 'bg-green-500', icon: Coins },
    { id: 'settle-cash', label: 'Settle Cash', color: 'bg-orange-500', icon: Handshake },
    { id: 'settle-online', label: 'Settle Online', color: 'bg-orange-400', icon: Handshake },
  ];

  return (
    <CashierLayout>
      <div className="space-y-6">
        {/* Header with Title, Date Navigation, Summary, and Action Buttons - All in one row */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Left: Title */}
          <h1 className="text-2xl font-bold text-gray-900">Credit Register</h1>
          
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
          {registerData?.has_data && (
            <div className="flex items-center gap-6">
              {/* Summary */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Total outstanding:</span>
                <span className="font-semibold text-orange-600">
                  {formatCurrency(registerData.summary?.total_outstanding || 0)}
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
        {registerData?.has_data && registerData.transactions?.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <Button
                  key={filter.id}
                  variant={activeFilter === filter.id ? 'default' : 'outline'}
                  onClick={() => {
                    setActiveFilter(filter.id);
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
        {registerData?.has_data && filteredTransactions.length > 0 && (
          <div>
            <TransactionCardList
              transactions={filteredTransactions}
              onRefresh={fetchRegisterData}
              disableNotesAndReversal={true}
            />
          </div>
        )}

        {/* No Data */}
        {!loading && registerData?.has_data && (!registerData.transactions || registerData.transactions.length === 0) && activeFilter === 'all' && (
          <div className="p-8 text-center">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-900">No credit transactions on {formatDate(selectedDate)}</p>
          </div>
        )}

        {/* No Session Data */}
        {!loading && !registerData?.has_data && (
          <div className="p-8 text-center">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-900">No session data found for {formatDate(selectedDate)}</p>
          </div>
        )}

        {/* No filtered results */}
        {!loading && registerData?.has_data && registerData.transactions?.length > 0 && filteredTransactions.length === 0 && (
          <div className="p-8 text-center">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-900">No credit transactions found for the selected filter</p>
          </div>
        )}

        {/* Export Dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Credit Register</DialogTitle>
              <DialogDescription>
                Select a date range to export credit register as CSV.
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
              <DialogTitle>Email Credit Register Report</DialogTitle>
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
                      <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-sm">
                        {email}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => removeEmailRecipient(email)} />
                      </div>
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

export default CreditRegister;