import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { RotateCcw, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import transactionService from '../../services/transaction.service';
import { useAuth } from '../../hooks/useAuth';

const REVERSAL_REASONS = [
  { value: 'wrong_amount', label: 'Wrong amount entered' },
  { value: 'duplicate_entry', label: 'Duplicate entry' },
  { value: 'upi_failed', label: 'UPI failed' },
  { value: 'wrong_player', label: 'Wrong player selected' },
  { value: 'system_error', label: 'System error' },
  { value: 'other', label: 'Other' },
];

const ReverseTransactionModal = ({ 
  open, 
  onOpenChange, 
  transaction, 
  onReversed 
}) => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [reversing, setReversing] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(Math.abs(amount || 0));
  };

  const getTransactionTypeLabel = (type) => {
    return type?.replace(/_/g, ' ') || 'Transaction';
  };

  const handleReverse = async () => {
    if (!reason) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a reversal reason',
      });
      return;
    }

    setReversing(true);
    try {
      await transactionService.reverseTransaction(token, transaction.transaction_id, {
        reason,
      });
      
      toast({
        title: 'Success',
        description: 'Transaction reversed successfully',
      });
      
      setReason('');
      onOpenChange(false);
      onReversed?.();
    } catch (error) {
      console.error('Error reversing transaction:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to reverse transaction',
      });
    } finally {
      setReversing(false);
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-white" />
            </div>
            Reverse Transaction
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Transaction Info */}
          <div className="text-sm text-gray-700">
            This will create a reversal entry for the{' '}
            <span className="font-semibold capitalize">
              {getTransactionTypeLabel(transaction.transaction_type)}
            </span>{' '}
            of{' '}
            <span className="font-semibold">
              {formatCurrency(transaction.amount)}
            </span>
            . The original transaction will be marked as reversed.
          </div>

          {/* Reversal Reason */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Reversal Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="border-orange-200 focus:border-orange-400">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {REVERSAL_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Important Info */}
          <Alert className="border-orange-300 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="font-semibold mb-1">Important</div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Original transaction will be locked (read-only)</li>
                <li>A negative entry will be created automatically</li>
                <li>Both entries will remain visible for audit</li>
                <li>This action cannot be undone</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={reversing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReverse}
              disabled={reversing || !reason}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {reversing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Reversing...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Confirm Reversal
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReverseTransactionModal;

