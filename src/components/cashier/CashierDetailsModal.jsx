import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, User, Calendar, Clock, TrendingUp, TrendingDown, Wallet, Coins, CreditCard, FileText } from 'lucide-react';
import cashierShiftService from '../../services/cashier-shift.service';

const CashierDetailsModal = ({ cashier, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [cashierData, setCashierData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && cashier?.cashier_id) {
      fetchCashierDetails();
    } else {
      setCashierData(null);
      setError(null);
    }
  }, [isOpen, cashier?.cashier_id]);

  const fetchCashierDetails = async () => {
    if (!cashier?.cashier_id) return;

    setLoading(true);
    setError(null);
    try {
      const response = await cashierShiftService.getCashierTransactions(cashier.cashier_id);
      setCashierData(response.data || response);
    } catch (err) {
      console.error('Error fetching cashier details:', err);
      setError(err.message || 'Failed to load cashier details');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTransactionTypeLabel = (type) => {
    const labels = {
      buy_in: 'Buy-In',
      cash_payout: 'Cash Payout',
      credit_issued: 'Credit Issued',
      settle_credit: 'Settle Credit',
      deposit_chips: 'Deposit Chips',
      redeem_stored: 'Redeem Stored',
      add_float: 'Add Float',
      expense: 'Expense',
      dealer_tip: 'Dealer Tip',
      rakeback: 'Rakeback',
    };
    return labels[type] || type;
  };

  const getTransactionColor = (type) => {
    const profitTypes = ['buy_in', 'settle_credit', 'deposit_cash', 'redeem_stored', 'add_float'];
    return profitTypes.includes(type) ? 'text-green-600' : 'text-red-600';
  };

  if (!cashier) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{cashier.full_name}</h2>
              <p className="text-sm text-gray-600 mt-1">
                Cashier Details & Transaction History
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            <span className="ml-3 text-gray-600">Loading cashier details...</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : cashierData ? (
          <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="shifts">Shifts ({cashierData.total_shifts || 0})</TabsTrigger>
              <TabsTrigger value="transactions">Transactions ({cashierData.total_transactions || 0})</TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full" style={{ height: 'calc(90vh - 280px)' }}>
                <TabsContent value="overview" className="space-y-4 pr-4">
                {/* Cashier Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cashier Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold">{cashier.full_name}</p>
                    </div>
                    {cashier.phone_number && (
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-semibold">{cashier.phone_number}</p>
                      </div>
                    )}
                    {cashier.email && (
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-semibold">{cashier.email}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Total Shifts</p>
                      <p className="font-semibold">{cashierData.total_shifts || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Transactions</p>
                      <p className="font-semibold">{cashierData.total_transactions || 0}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Summary Stats */}
                {cashierData.shifts && cashierData.shifts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Summary Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {cashierData.shifts.reduce((acc, shift) => {
                          const stats = shift.statistics || {};
                          acc.buy_ins += stats.buy_ins?.amount || 0;
                          acc.cashouts += stats.cashouts?.amount || 0;
                          acc.credits_issued += stats.credits_issued?.amount || 0;
                          acc.credits_settled += stats.credits_settled?.amount || 0;
                          return acc;
                        }, { buy_ins: 0, cashouts: 0, credits_issued: 0, credits_settled: 0 }) && (
                          <>
                            <div className="bg-green-50 p-4 rounded-lg">
                              <p className="text-xs text-gray-600 mb-1">Total Buy-Ins</p>
                              <p className="text-lg font-bold text-green-700">
                                {formatCurrency(
                                  cashierData.shifts.reduce((sum, shift) => 
                                    sum + (shift.statistics?.buy_ins?.amount || 0), 0
                                  )
                                )}
                              </p>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg">
                              <p className="text-xs text-gray-600 mb-1">Total Cashouts</p>
                              <p className="text-lg font-bold text-red-700">
                                {formatCurrency(
                                  cashierData.shifts.reduce((sum, shift) => 
                                    sum + (shift.statistics?.cashouts?.amount || 0), 0
                                  )
                                )}
                              </p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <p className="text-xs text-gray-600 mb-1">Credits Issued</p>
                              <p className="text-lg font-bold text-blue-700">
                                {formatCurrency(
                                  cashierData.shifts.reduce((sum, shift) => 
                                    sum + (shift.statistics?.credits_issued?.amount || 0), 0
                                  )
                                )}
                              </p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                              <p className="text-xs text-gray-600 mb-1">Credits Settled</p>
                              <p className="text-lg font-bold text-purple-700">
                                {formatCurrency(
                                  cashierData.shifts.reduce((sum, shift) => 
                                    sum + (shift.statistics?.credits_settled?.amount || 0), 0
                                  )
                                )}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
                </TabsContent>

                <TabsContent value="shifts" className="space-y-4 pr-4">
                {cashierData.shifts && cashierData.shifts.length > 0 ? (
                  cashierData.shifts.map((shift, index) => (
                    <Card key={shift.shift_id || index}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            Shift #{shift.shift_number}
                          </CardTitle>
                          <Badge variant={shift.shift_status === 'active' ? 'default' : 'secondary'}>
                            {shift.shift_status === 'active' ? 'Active' : 'Completed'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-600">Started</p>
                            <p className="font-semibold">{formatDateTime(shift.started_at)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Ended</p>
                            <p className="font-semibold">
                              {shift.ended_at ? formatDateTime(shift.ended_at) : 'Active'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Duration</p>
                            <p className="font-semibold">
                              {shift.duration_minutes 
                                ? `${Math.floor(shift.duration_minutes / 60)}h ${shift.duration_minutes % 60}m`
                                : 'Active'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Transactions</p>
                            <p className="font-semibold">
                              {shift.statistics?.total_transactions || 0}
                            </p>
                          </div>
                        </div>

                        {shift.statistics && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                            <div>
                              <p className="text-xs text-gray-600">Buy-Ins</p>
                              <p className="font-semibold text-green-600">
                                {formatCurrency(shift.statistics.buy_ins?.amount || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Cashouts</p>
                              <p className="font-semibold text-red-600">
                                {formatCurrency(shift.statistics.cashouts?.amount || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Credits Issued</p>
                              <p className="font-semibold text-blue-600">
                                {formatCurrency(shift.statistics.credits_issued?.amount || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Net Flow</p>
                              <p className={`font-semibold ${
                                (shift.statistics.net_flow || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(shift.statistics.net_flow || 0)}
                              </p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-gray-500">No shifts found</p>
                    </CardContent>
                  </Card>
                )}
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4 pr-4">
                {cashierData.transactions && cashierData.transactions.length > 0 ? (
                  <div className="space-y-2">
                    {cashierData.transactions.map((transaction, index) => (
                      <Card key={transaction.transaction_id || index} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline">
                                {getTransactionTypeLabel(transaction.transaction_type)}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                Shift #{transaction.shift_number}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDateTime(transaction.created_at)}
                              </span>
                            </div>
                            {transaction.player_name && (
                              <p className="font-semibold text-gray-900 mb-1">
                                {transaction.player_name}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm">
                              {transaction.amount > 0 && (
                                <span className={getTransactionColor(transaction.transaction_type)}>
                                  Amount: {formatCurrency(transaction.amount)}
                                </span>
                              )}
                              {transaction.chips_amount > 0 && (
                                <span className="text-gray-600">
                                  Chips: {formatCurrency(transaction.chips_amount)}
                                </span>
                              )}
                              {transaction.payment_mode && (
                                <Badge variant="outline" className="text-xs">
                                  {transaction.payment_mode}
                                </Badge>
                              )}
                            </div>
                            {transaction.notes && (
                              <p className="text-xs text-gray-600 mt-2">{transaction.notes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className={`font-bold text-lg ${
                              getTransactionColor(transaction.transaction_type)
                            }`}>
                              {['buy_in', 'settle_credit', 'deposit_cash', 'redeem_stored', 'add_float'].includes(transaction.transaction_type) ? '+' : '-'}
                              {formatCurrency(transaction.amount || transaction.chips_amount || 0)}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-gray-500">No transactions found</p>
                    </CardContent>
                  </Card>
                )}
                </TabsContent>
              </ScrollArea>
            </div>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default CashierDetailsModal;

