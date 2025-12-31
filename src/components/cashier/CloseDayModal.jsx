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
  const cashDeposits = dashboard?.totals?.deposits || 0; // Buy-ins + Settlements
  const withdrawals = dashboard?.totals?.withdrawals || 0; // Payouts + Expenses
  const expectedClosingCash = openingFloat + cashDeposits - withdrawals;
  const onlineDeposits = dashboard?.totals?.online_deposits || 0;

  const actualCash = parseFloat(actualCashInHand) || 0;
  const actualOnline = parseFloat(actualOnlineTotal) || 0;
  const tallyDifference = (actualCash + actualOnline) - (expectedClosingCash + onlineDeposits);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleClose = () => {
    setActualCashInHand('');
    setActualOnlineTotal('');
    setNotes('');
    setError('');
    onOpenChange(false);
  };

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
            <button
              onClick={handleClose}
              className="ml-auto p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Withdrawals (Payouts + Expenses)</span>
                <span className="text-sm font-semibold text-red-600">-{formatCurrency(withdrawals)}</span>
              </div>
              
              <div className="pt-3 border-t border-gray-300">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-gray-900">Expected Closing Cash</span>
                  <span className="text-base font-bold text-gray-900">{formatCurrency(expectedClosingCash)}</span>
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

          {/* Enter Actual Closing Amounts */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Enter Actual Closing Amounts</h3>
            
            <div className="space-y-2">
              <Label>Actual Cash in Hand</Label>
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
                {tallyDifference !== 0 && (
                  <span className="ml-2 text-xs font-normal">
                    ({tallyDifference > 0 ? 'Excess' : 'Shortage'} (missing cash))
                  </span>
                )}
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