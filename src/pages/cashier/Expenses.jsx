// src/pages/cashier/Expenses.jsx
// Expense Report Page - Shows Dealer Tips and Club Expenses

import React, { useState, useEffect } from 'react';
import CashierLayout from '../../components/layouts/CashierLayout';
import cashbookService from '../../services/cashbook.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coins, ShoppingCart, Clock, ChevronLeft, ChevronRight, Calendar, Image as ImageIcon, Filter } from 'lucide-react';

const Expenses = () => {
  // Helper to get today's date in IST timezone (YYYY-MM-DD format)
  const getTodayIST = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayIST());
  const [expenseData, setExpenseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState(null);
  const [selectedDealerFilter, setSelectedDealerFilter] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  useEffect(() => {
    fetchExpenseData();
    // Reset filters when date changes
    setSelectedDealerFilter('all');
    setSelectedCategoryFilter('all');
  }, [selectedDate]);

  const fetchExpenseData = async () => {
    setLoading(true);
    try {
      const res = await cashbookService.getExpenseReportByDate(selectedDate);
      console.log('📊 Expense Report API Response:', res);
      if (res.success) {
        setExpenseData(res.data);
      }
    } catch (err) {
      console.error('❌ Error fetching expense report:', err);
      setExpenseData(null);
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

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
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

  const handleViewScreenshot = (expense) => {
    if (expense.attachment_url) {
      setScreenshotUrl(expense.attachment_url);
      setShowScreenshotModal(true);
    }
  };

  const isToday = selectedDate === getTodayIST();

  if (loading) {
    return (
      <CashierLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading expenses...</p>
          </div>
        </div>
      </CashierLayout>
    );
  }

  if (!expenseData?.has_data) {
    return (
      <CashierLayout>
        <div className="space-y-6 p-6">
          <div className="text-center py-12">
            <Coins className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-900 text-lg">No expense data found for {formatDate(selectedDate)}</p>
            <p className="text-gray-600 text-sm mt-2">{expenseData?.message || 'No session found for this date'}</p>
          </div>
        </div>
      </CashierLayout>
    );
  }

  // Remove duplicates from dealer tips (in case backend didn't catch them)
  const dealerTipsRaw = expenseData.dealer_tips || [];
  const seenTipIds = new Set();
  const uniqueDealerTips = dealerTipsRaw.filter((tip) => {
    // Use tip_id if valid, otherwise create a composite key
    const key = tip.tip_id && tip.tip_id > 0 
      ? `tip_${tip.tip_id}` 
      : `dealer_${tip.dealer_id}_${tip.cash_paid}_${tip.created_at}`;
    if (seenTipIds.has(key)) {
      return false; // Duplicate, filter it out
    }
    seenTipIds.add(key);
    return true;
  });

  // Group dealer tips by dealer name (sum amounts)
  const dealerTipsMap = new Map();
  uniqueDealerTips.forEach((tip) => {
    const dealerName = tip.dealer_name || 'Unknown Dealer';
    if (dealerTipsMap.has(dealerName)) {
      const existing = dealerTipsMap.get(dealerName);
      existing.amount += parseFloat(tip.cash_paid || 0);
      existing.count += 1;
      // Keep the most recent created_at
      if (new Date(tip.created_at) > new Date(existing.created_at)) {
        existing.created_at = tip.created_at;
      }
    } else {
      dealerTipsMap.set(dealerName, {
        dealer_name: dealerName,
        amount: parseFloat(tip.cash_paid || 0),
        notes: tip.notes || '',
        created_at: tip.created_at,
        count: 1
      });
    }
  });
  const dealerTips = Array.from(dealerTipsMap.values()).sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );

  // Group club expenses by category (sum amounts)
  const clubExpensesRaw = expenseData.club_expenses || [];
  const clubExpensesMap = new Map();
  clubExpensesRaw.forEach((expense) => {
    const category = expense.expense_category || 'Club Expense';
    const key = `${category}_${expense.expense_category_label || ''}`;
    if (clubExpensesMap.has(key)) {
      const existing = clubExpensesMap.get(key);
      existing.amount += parseFloat(expense.amount || 0);
      existing.count += 1;
      // Keep the most recent created_at and attachment
      if (new Date(expense.created_at) > new Date(existing.created_at)) {
        existing.created_at = expense.created_at;
        if (expense.attachment_url) {
          existing.attachment_url = expense.attachment_url;
        }
        if (expense.attachment_public_id) {
          existing.attachment_public_id = expense.attachment_public_id;
        }
      }
    } else {
      clubExpensesMap.set(key, {
        expense_category: category,
        expense_category_label: expense.expense_category_label || expense.description || category,
        amount: parseFloat(expense.amount || 0),
        notes: expense.notes || '',
        created_at: expense.created_at,
        attachment_url: expense.attachment_url || null,
        attachment_public_id: expense.attachment_public_id || null,
        count: 1
      });
    }
  });
  const clubExpenses = Array.from(clubExpensesMap.values()).sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );

  const totalDealerTips = expenseData.summary?.total_dealer_tips || 0;
  const totalClubExpenses = expenseData.summary?.total_club_expenses || 0;
  const totalExpenses = expenseData.summary?.total_expenses || 0;

  // Get unique dealer names and categories for filters
  const uniqueDealers = Array.from(dealerTipsMap.keys()).filter(d => d !== 'Unknown Dealer').sort();
  const uniqueCategories = Array.from(clubExpensesMap.keys()).map(key => {
    const expense = clubExpensesMap.get(key);
    return expense.expense_category;
  }).filter((cat, index, self) => self.indexOf(cat) === index).sort();

  // Filter dealer tips based on selected dealer
  const filteredDealerTips = selectedDealerFilter === 'all' 
    ? dealerTips 
    : dealerTips.filter(tip => tip.dealer_name === selectedDealerFilter);

  // Filter club expenses based on selected category
  const filteredClubExpenses = selectedCategoryFilter === 'all'
    ? clubExpenses
    : clubExpenses.filter(exp => exp.expense_category === selectedCategoryFilter);

  // Calculate filtered totals
  const filteredDealerTipsTotal = filteredDealerTips.reduce((sum, tip) => sum + (tip.amount || 0), 0);
  const filteredClubExpensesTotal = filteredClubExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  return (
    <CashierLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expense Report</h1>
            <p className="text-sm text-gray-600 mt-1">{isToday ? 'Live today\'s report' : `Report for ${formatDate(selectedDate)}`}</p>
          </div>
          
          {/* Date Navigation */}
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

          <div className="text-right">
            <p className="text-sm text-gray-600">TOTAL EXPENSES</p>
            <p className="text-3xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>

        {/* Expense Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* DEALER TIPS Card */}
          <Card className="border border-gray-200 bg-white">
            <CardHeader className="pb-3 border-b border-gray-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Coins className="w-5 h-5 text-gray-700" />
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-900">DEALER TIPS</CardTitle>
                  </div>
                  <Badge className="bg-gray-700 text-white text-base px-3 py-1">
                    {formatCurrency(selectedDealerFilter === 'all' ? totalDealerTips : filteredDealerTipsTotal)}
                  </Badge>
                </div>
                {uniqueDealers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <Select value={selectedDealerFilter} onValueChange={setSelectedDealerFilter}>
                      <SelectTrigger className="w-full h-8 text-sm">
                        <SelectValue placeholder="Filter by dealer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Dealers</SelectItem>
                        {uniqueDealers.map((dealer) => (
                          <SelectItem key={dealer} value={dealer}>
                            {dealer}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredDealerTips.length > 0 ? (
                <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                  <div className="space-y-0 divide-y divide-gray-100">
                    {filteredDealerTips.map((tip, idx) => {
                      const dealerName = tip.dealer_name || 'Unknown Dealer';
                      const amount = tip.amount || 0;
                      const notes = tip.notes || '';
                      const tipCount = tip.count || 1;
                      return (
                        <div key={`${dealerName}_${idx}`} className="flex items-center justify-between p-4 hover:bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">{dealerName}</p>
                              {tipCount > 1 && (
                                <Badge variant="outline" className="text-xs">
                                  {tipCount} tips
                                </Badge>
                              )}
                            </div>
                            {notes && (
                              <p className="text-sm text-gray-600 mt-1">{notes}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{formatTime(tip.created_at)}</span>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-lg font-bold text-gray-900">{formatCurrency(amount)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Coins className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm">No dealer tips recorded today</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CLUB EXPENSES Card */}
          <Card className="border border-gray-200 bg-white">
            <CardHeader className="pb-3 border-b border-gray-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <ShoppingCart className="w-5 h-5 text-gray-700" />
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-900">CLUB EXPENSES</CardTitle>
                  </div>
                  <Badge className="bg-gray-700 text-white text-base px-3 py-1">
                    {formatCurrency(selectedCategoryFilter === 'all' ? totalClubExpenses : filteredClubExpensesTotal)}
                  </Badge>
                </div>
                {uniqueCategories.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                      <SelectTrigger className="w-full h-8 text-sm">
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {uniqueCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredClubExpenses.length > 0 ? (
                <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                  <div className="space-y-0 divide-y divide-gray-100">
                    {filteredClubExpenses.map((expense, idx) => {
                      const expenseCategory = expense.expense_category || 'Club Expense';
                      const amount = expense.amount || 0;
                      const categoryLabel = expense.expense_category_label || expense.description || expense.expense_category || '';
                      const notes = expense.notes || '';
                      const hasAttachment = expense.attachment_url || expense.attachment_public_id;
                      return (
                        <div key={`${expense.expense_category}_${idx}`} className="flex items-center justify-between p-4 hover:bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">{expenseCategory}</p>
                              {/* Screenshot icon for club expenses */}
                              {hasAttachment && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button
                                      type="button"
                                      className="text-blue-600 hover:text-blue-700 transition-colors"
                                      title="View Expense Screenshot"
                                    >
                                      <ImageIcon className="w-4 h-4" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-2" align="start">
                                    <img
                                      src={expense.attachment_url}
                                      alt="Expense Screenshot"
                                      className="w-64 h-auto rounded border border-gray-200 cursor-pointer"
                                      onClick={() => handleViewScreenshot(expense)}
                                    />
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                            {categoryLabel && (
                              <p className="text-sm text-gray-600 mt-1">Category: {categoryLabel}</p>
                            )}
                            {notes && !categoryLabel && (
                              <p className="text-sm text-gray-600 mt-1">{notes}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{formatTime(expense.created_at)}</span>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-lg font-bold text-gray-900">{formatCurrency(amount)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm">No club expenses recorded today</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Screenshot Modal */}
        <Dialog open={showScreenshotModal} onOpenChange={setShowScreenshotModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Club Expense Screenshot</DialogTitle>
            </DialogHeader>
            {screenshotUrl && (
              <div className="relative w-full">
                <img
                  src={screenshotUrl}
                  alt="Club Expense Screenshot"
                  className="w-full h-auto rounded-lg border border-gray-200"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </CashierLayout>
  );
};

export default Expenses;

