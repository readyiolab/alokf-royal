// src/pages/cashier/Expenses.jsx
// Expense Report Page - Shows Dealer Tips and Club Expenses

import React, { useState, useEffect } from 'react';
import CashierLayout from '../../components/layouts/CashierLayout';
import cashbookService from '../../services/cashbook.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Coins, ShoppingCart, Clock, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

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

  useEffect(() => {
    fetchExpenseData();
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

  const dealerTips = expenseData.dealer_tips || [];
  const clubExpenses = expenseData.club_expenses || [];
  const totalDealerTips = expenseData.summary?.total_dealer_tips || 0;
  const totalClubExpenses = expenseData.summary?.total_club_expenses || 0;
  const totalExpenses = expenseData.summary?.total_expenses || 0;

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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Coins className="w-5 h-5 text-gray-700" />
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-900">DEALER TIPS</CardTitle>
                </div>
                <Badge className="bg-gray-700 text-white text-base px-3 py-1">
                  {formatCurrency(totalDealerTips)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {dealerTips.length > 0 ? (
                <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                  <div className="space-y-0 divide-y divide-gray-100">
                    {dealerTips.map((tip, idx) => {
                      const dealerName = tip.dealer_name || 'Unknown Dealer';
                      const amount = tip.cash_paid || 0;
                      const notes = tip.notes || '';
                      return (
                        <div key={tip.tip_id || idx} className="flex items-center justify-between p-4 hover:bg-gray-50">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{dealerName}</p>
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-gray-700" />
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-900">CLUB EXPENSES</CardTitle>
                </div>
                <Badge className="bg-gray-700 text-white text-base px-3 py-1">
                  {formatCurrency(totalClubExpenses)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {clubExpenses.length > 0 ? (
                <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                  <div className="space-y-0 divide-y divide-gray-100">
                    {clubExpenses.map((expense, idx) => {
                      const expenseCategory = expense.expense_category || 'Club Expense';
                      const amount = expense.amount || 0;
                      const categoryLabel = expense.expense_category_label || expense.description || expense.expense_category || '';
                      const notes = expense.notes || '';
                      return (
                        <div key={expense.expense_id || idx} className="flex items-center justify-between p-4 hover:bg-gray-50">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{expenseCategory}</p>
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
      </div>
    </CashierLayout>
  );
};

export default Expenses;

