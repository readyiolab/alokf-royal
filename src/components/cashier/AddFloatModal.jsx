// components/cashier/AddFloatModal.jsx
// Add Float - Cashier can add more chips during session when needed for payouts

import React, { useState } from 'react';
import { X, Plus, Coins, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { cn } from '@/lib/utils';
import cashierService from '../../services/cashier.service';

const AddFloatModal = ({ isOpen, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [chipBreakdown, setChipBreakdown] = useState({
    chips_100: 0,
    chips_500: 0,
    chips_5000: 0,
    chips_10000: 0,
  });

  const handleChipChange = (key, value) => {
    setChipBreakdown(prev => ({
      ...prev,
      [key]: Number(value) || 0,
    }));
  };

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      setError('Enter a valid float amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await cashierService.addCashFloat(
        Number(amount),
        notes,
        chipBreakdown
      );

      onSuccess?.(res.data);
      onClose();

      // reset
      setAmount('');
      setNotes('');
      setChipBreakdown({
        chips_100: 0,
        chips_500: 0,
        chips_5000: 0,
        chips_10000: 0,
      });
    } catch (err) {
      setError(err.message || 'Failed to add float');
    } finally {
      setLoading(false);
    }
  };

  const chipTotal = chipBreakdown.chips_100 * 100 + chipBreakdown.chips_500 * 500 + 
                    chipBreakdown.chips_5000 * 5000 + chipBreakdown.chips_10000 * 10000;
  const chipCount = chipBreakdown.chips_100 + chipBreakdown.chips_500 + 
                    chipBreakdown.chips_5000 + chipBreakdown.chips_10000;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleClose = () => {
    setAmount('');
    setNotes('');
    setError('');
    setChipBreakdown({
      chips_100: 0,
      chips_500: 0,
      chips_5000: 0,
      chips_10000: 0,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            Add Float
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <p className="text-sm text-muted-foreground">Add cash or chips to the session float</p>

          {/* Amount Section */}
          <div className="space-y-2">
            <Label>Cash Amount (₹)</Label>
            <Input
              type="number"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Enter cash amount"
              className="font-mono text-lg"
            />
          </div>

          {/* Chips Section */}
          <div className="p-5 rounded-xl bg-gradient-to-b from-muted/60 to-muted/30 border border-border space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Coins className="h-4 w-4" />
                Chip Breakdown (optional)
              </Label>
              <span className={cn(
                "text-xs font-mono px-2 py-0.5 rounded",
                chipTotal > 0 ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
              )}>
                {chipCount} chips = {formatCurrency(chipTotal)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-[hsl(340,82%,52%)]">₹100 chips</Label>
                <Input
                  type="number"
                  min="0"
                  value={chipBreakdown.chips_100 || ''}
                  onChange={(e) => handleChipChange('chips_100', e.target.value)}
                  className="font-mono text-lg font-bold"
                  placeholder="0"
                />
                <span className="text-xs text-muted-foreground">= {formatCurrency(chipBreakdown.chips_100 * 100)}</span>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-[hsl(210,100%,56%)]">₹500 chips</Label>
                <Input
                  type="number"
                  min="0"
                  value={chipBreakdown.chips_500 || ''}
                  onChange={(e) => handleChipChange('chips_500', e.target.value)}
                  className="font-mono text-lg font-bold"
                  placeholder="0"
                />
                <span className="text-xs text-muted-foreground">= {formatCurrency(chipBreakdown.chips_500 * 500)}</span>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-[hsl(145,63%,42%)]">₹5,000 chips</Label>
                <Input
                  type="number"
                  min="0"
                  value={chipBreakdown.chips_5000 || ''}
                  onChange={(e) => handleChipChange('chips_5000', e.target.value)}
                  className="font-mono text-lg font-bold"
                  placeholder="0"
                />
                <span className="text-xs text-muted-foreground">= {formatCurrency(chipBreakdown.chips_5000 * 5000)}</span>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-[hsl(280,70%,55%)]">₹10,000 chips</Label>
                <Input
                  type="number"
                  min="0"
                  value={chipBreakdown.chips_10000 || ''}
                  onChange={(e) => handleChipChange('chips_10000', e.target.value)}
                  className="font-mono text-lg font-bold"
                  placeholder="0"
                />
                <span className="text-xs text-muted-foreground">= {formatCurrency(chipBreakdown.chips_10000 * 10000)}</span>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Add a note..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              className="flex-1 gradient-gold text-primary-foreground font-semibold"
              onClick={handleSubmit}
              disabled={loading || !amount}
            >
              {loading ? 'Adding...' : 'Add Float'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddFloatModal;
