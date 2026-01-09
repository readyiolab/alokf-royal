// components/cashier/CloseDayModal.jsx
// Close Day - Cash Tally Modal

import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import cashierService from '../../services/cashier.service';
import { useSession } from '../../contexts/Sessioncontext'; // ✅ FIXED: Using context version
import { useToast } from '@/hooks/use-toast';

const CloseDayModal = ({ open, onOpenChange, onSuccess }) => {
  const { toast } = useToast();
  const { session, dashboard, refresh: refreshDashboard } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Cash Tally State
  const [actualCashInHand, setActualCashInHand] = useState('');
  const [actualOnlineTotal, setActualOnlineTotal] = useState('');
  const [notes, setNotes] = useState('');

  // Calculate expected values from dashboard
  const openingFloat = dashboard?.wallets?.primary?.opening || 0;
  
  // ✅ FIXED: Use actual cash balance from session (cash buy-ins only)
  // This is more accurate than calculating from totals
  const currentCashBalance = dashboard?.wallets?.secondary?.cash_balance || 0;
  
  // ✅ FIXED: Cash deposits = Current cash balance + Cash withdrawals - Opening float
  // This gives us the actual cash deposits (buy-ins + cash settlements)
  const payouts = dashboard?.totals?.withdrawals || 0;
  const dealerTips = dashboard?.totals?.dealer_tips || 0;
  const clubExpenses = dashboard?.totals?.club_expenses || 0;
  const withdrawals = payouts + dealerTips + clubExpenses; // All cash withdrawals
  
  // Calculate cash deposits: Current Cash = Opening + Deposits - Withdrawals
  // So: Deposits = Current Cash - Opening + Withdrawals
  const cashDeposits = currentCashBalance - openingFloat + withdrawals;
  
  // Expected Closing Cash = Primary Wallet Current + Cash in Hand (Secondary)
  // This is what should actually be in hand (based on current wallet balances)
  const primaryWalletCurrent = dashboard?.wallets?.primary?.current || 0;
  const secondaryCashBalance = dashboard?.wallets?.secondary?.cash_balance || 0;
  const expectedClosingCash = primaryWalletCurrent + secondaryCashBalance;
  
  // Also calculate from tally for display purposes
  const expectedClosingCashFromTally = openingFloat + cashDeposits - withdrawals;
  
  const onlineDeposits = dashboard?.totals?.online_deposits || 0;

  // Calculate Profit and Loss
  // Total Revenue = Cash Deposits + Online Deposits
  const totalRevenue = cashDeposits + onlineDeposits;
  // Total Expenses = Payouts + Dealer Tips + Club Expenses
  const totalExpenses = withdrawals;
  // Net Profit/Loss = Total Revenue - Total Expenses
  const netProfitLoss = totalRevenue - totalExpenses;

  const actualCash = parseFloat(actualCashInHand) || 0;
  const actualOnline = parseFloat(actualOnlineTotal) || 0;
  
  // Tally Difference = (Actual Cash + Actual Online) - (Expected Cash + Expected Online)
  // Expected Cash = Primary Wallet Current + Cash in Hand
  // Expected Online = Total Online Deposits
  // Round to 2 decimal places to avoid floating point issues
  const totalActual = Math.round((actualCash + actualOnline) * 100) / 100;
  const totalExpected = Math.round((expectedClosingCash + onlineDeposits) * 100) / 100;
  const tallyDifference = Math.round((totalActual - totalExpected) * 100) / 100;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleClose = () => {
    // Reset all fields when closing
    setActualCashInHand('');
    setActualOnlineTotal('');
    setNotes('');
    setError('');
    onOpenChange(false);
  };

  // Auto-fill values when modal opens (after reset)
  useEffect(() => {
    if (open && dashboard) {
      // Actual Cash in Hand = Primary wallet current + Secondary wallet cash_balance (NOT including online)
      const primaryWallet = dashboard?.wallets?.primary?.current || 0;
      const secondaryCashBalance = dashboard?.wallets?.secondary?.cash_balance || 0;
      const calculatedCashInHand = primaryWallet + secondaryCashBalance;
      const totalOnlineDeposits = dashboard?.totals?.online_deposits || 0;
      
      // Auto-fill with calculated values when modal opens
      setActualCashInHand(calculatedCashInHand > 0 ? calculatedCashInHand.toString() : '');
      setActualOnlineTotal(totalOnlineDeposits > 0 ? totalOnlineDeposits.toString() : '');
    }
  }, [open, dashboard]);

  const handleSubmit = async () => {
    if (!actualCashInHand || parseFloat(actualCashInHand) < 0) {
      setError('Enter actual cash in hand');
      return;
    }

    if (!actualOnlineTotal || parseFloat(actualOnlineTotal) < 0) {
      setError('Enter actual online total');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Close the session - backend will use calculated values
      await cashierService.closeSession();

      toast({
        title: 'Success',
        description: 'Day closed successfully',
      });

      handleClose();
      if (onSuccess) onSuccess();
      refreshDashboard();
    } catch (err) {
      setError(err.message || 'Failed to close day');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">Cash Tally</div>
              <div className="text-sm font-normal text-gray-500">
                Review and confirm closing amounts
              </div>
            </div>
           
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Cash Tally Logic */}
          <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700 font-medium">
              Opening Float + Cash Deposits - Withdrawals (Payouts + Expenses) = Expected Closing Cash
            </p>
          </div>

          {/* Cash Tally Breakdown */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900">Cash Tally Breakdown</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Opening Float</span>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(openingFloat)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Cash Deposits (Buy-ins + Settlements)</span>
                <span className="text-sm font-semibold text-green-600">+{formatCurrency(cashDeposits)}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Payouts</span>
                  <span className="text-sm font-semibold text-red-600">-{formatCurrency(payouts)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Dealer Tips (Cash)</span>
                  <span className="text-sm font-semibold text-red-600">-{formatCurrency(dealerTips)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Club Expenses</span>
                  <span className="text-sm font-semibold text-red-600">-{formatCurrency(clubExpenses)}</span>
                </div>
                <div className="pt-2 border-t border-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-900">Total Cash Taken Out</span>
                    <span className="text-sm font-bold text-red-600">-{formatCurrency(withdrawals)}</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-300">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-gray-900">Expected Closing Cash</span>
                  <span className="text-base font-bold text-gray-900">
                    {formatCurrency(expectedClosingCash)}
                    <span className="text-xs font-normal text-gray-500 ml-2">
                      (Primary {formatCurrency(primaryWalletCurrent)} + Cash in Hand {formatCurrency(secondaryCashBalance)})
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Online Summary */}
          <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900">Online Summary</h3>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Total Online Deposits</span>
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(onlineDeposits)}</span>
            </div>
          </div>

          {/* Profit and Loss */}
          <div className="space-y-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
            <h3 className="font-semibold text-gray-900">Profit and Loss</h3>
            
            <div className="space-y-2">
              {/* Revenue Section */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-gray-600 uppercase">Revenue</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Cash Deposits</span>
                  <span className="text-sm font-semibold text-green-600">+{formatCurrency(cashDeposits)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Online Deposits</span>
                  <span className="text-sm font-semibold text-green-600">+{formatCurrency(onlineDeposits)}</span>
                </div>
                <div className="pt-2 border-t border-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-900">Total Revenue</span>
                    <span className="text-sm font-bold text-green-700">{formatCurrency(totalRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* Expenses Section */}
              <div className="space-y-1.5 pt-2">
                <p className="text-xs font-semibold text-gray-600 uppercase">Expenses</p>
                {dealerTips > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Dealer Tips</span>
                    <span className="text-sm font-semibold text-red-600">-{formatCurrency(dealerTips)}</span>
                  </div>
                )}
                {clubExpenses > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Club Expenses</span>
                    <span className="text-sm font-semibold text-red-600">-{formatCurrency(clubExpenses)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-900">Total Expenses</span>
                    <span className="text-sm font-bold text-red-700">-{formatCurrency(totalExpenses)}</span>
                  </div>
                </div>
              </div>

              {/* Net Profit/Loss */}
              <div className={`pt-3 border-t-2 ${netProfitLoss >= 0 ? 'border-green-300' : 'border-red-300'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-gray-900">Net Profit / Loss</span>
                  <span className={`text-xl font-bold ${
                    netProfitLoss >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {netProfitLoss >= 0 ? '+' : ''}{formatCurrency(netProfitLoss)}
                  </span>
                </div>
                {netProfitLoss !== 0 && (
                  <p className={`text-xs mt-1 ${netProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {netProfitLoss >= 0 ? 'Profit' : 'Loss'} for today's session
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Enter Actual Closing Amounts */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Enter Actual Closing Amounts</h3>
            
            <div className="space-y-2">
              <Label>Actual Cash in Hand</Label>
              <p className="text-xs text-gray-500 mb-1">
                Primary Wallet ({formatCurrency(dashboard?.wallets?.primary?.current || 0)}) + Cash in Hand ({formatCurrency(dashboard?.wallets?.secondary?.cash_balance || 0)}) = {formatCurrency((dashboard?.wallets?.primary?.current || 0) + (dashboard?.wallets?.secondary?.cash_balance || 0))}
              </p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={actualCashInHand}
                  onChange={(e) => setActualCashInHand(e.target.value)}
                  placeholder="0"
                  className="pl-8 text-lg font-semibold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Actual Online Total</Label>
              <p className="text-xs text-gray-500 mb-1">
                Total Online Deposits: {formatCurrency(onlineDeposits)}
              </p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={actualOnlineTotal}
                  onChange={(e) => setActualOnlineTotal(e.target.value)}
                  placeholder="0"
                  className="pl-8 text-lg font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Tally Difference */}
          <div className={`p-4 rounded-lg border-2 ${
            tallyDifference === 0 
              ? 'bg-green-50 border-green-200' 
              : tallyDifference > 0 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-900">Tally Difference</span>
              <span className={`text-lg font-bold ${
                tallyDifference === 0 
                  ? 'text-green-700' 
                  : tallyDifference > 0 
                    ? 'text-blue-700' 
                    : 'text-red-700'
              }`}>
                {formatCurrency(tallyDifference)}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Add notes for discrepancies or special circumstances..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" className="flex-1" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleSubmit}
              disabled={loading || !actualCashInHand || !actualOnlineTotal}
            >
              {loading ? 'Closing...' : 'Close Day'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CloseDayModal;