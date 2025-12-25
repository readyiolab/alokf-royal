// ============================================
// FILE: components/cashier/StartSessionModal.jsx
// Modal to start a new session with chip inventory
// ============================================

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlayCircle, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import cashierService from '../../services/cashier.service';

const StartSessionModal = ({ open, onOpenChange, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    owner_float: '',
    chips_100: '',
    chips_500: '',
    chips_5000: '',
    chips_10000: '',
  });

  // Calculate total chip value
  const chipValue =
    (parseInt(form.chips_100) || 0) * 100 +
    (parseInt(form.chips_500) || 0) * 500 +
    (parseInt(form.chips_5000) || 0) * 5000 +
    (parseInt(form.chips_10000) || 0) * 10000;

  const totalChips =
    (parseInt(form.chips_100) || 0) +
    (parseInt(form.chips_500) || 0) +
    (parseInt(form.chips_5000) || 0) +
    (parseInt(form.chips_10000) || 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const floatAmount = parseFloat(form.owner_float);
    if (!floatAmount || floatAmount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a valid opening float amount',
      });
      return;
    }

    setLoading(true);
    try {
      const chipInventory = {
        chips_100: parseInt(form.chips_100) || 0,
        chips_500: parseInt(form.chips_500) || 0,
        chips_5000: parseInt(form.chips_5000) || 0,
        chips_10000: parseInt(form.chips_10000) || 0,
      };

      await cashierService.startSession(floatAmount, chipInventory);

      toast({
        title: 'Session Started',
        description: `Session opened with ${formatCurrency(floatAmount)} float and ${totalChips} chips`,
      });

      setForm({
        owner_float: '',
        chips_100: '',
        chips_500: '',
        chips_5000: '',
        chips_10000: '',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to start session',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({
      owner_float: '',
      chips_100: '',
      chips_500: '',
      chips_5000: '',
      chips_10000: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-black">
            <PlayCircle className="w-5 h-5 text-black" />
            Start New Session
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Opening Float */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Opening Float (Cash) *</Label>
            <Input
              type="number"
              value={form.owner_float}
              onChange={(e) => setForm({ ...form, owner_float: e.target.value })}
              placeholder="e.g. 500000"
              required
            />
            <p className="text-xs text-gray-500">
              Total cash you're starting with today
            </p>
          </div>

          {/* Chip Inventory */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-purple-600" />
              <Label className="text-xs text-gray-500">Chip Inventory (Optional)</Label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">₹100 Chips</Label>
                <Input
                  type="number"
                  value={form.chips_100}
                  onChange={(e) => setForm({ ...form, chips_100: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">₹500 Chips</Label>
                <Input
                  type="number"
                  value={form.chips_500}
                  onChange={(e) => setForm({ ...form, chips_500: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">₹5,000 Chips</Label>
                <Input
                  type="number"
                  value={form.chips_5000}
                  onChange={(e) => setForm({ ...form, chips_5000: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">₹10,000 Chips</Label>
                <Input
                  type="number"
                  value={form.chips_10000}
                  onChange={(e) => setForm({ ...form, chips_10000: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Chip Summary */}
            {totalChips > 0 && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-purple-700">Total Chips:</span>
                  <span className="font-semibold text-purple-800">{totalChips} chips</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-purple-700">Chip Value:</span>
                  <span className="font-bold text-purple-800">{formatCurrency(chipValue)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? 'Starting...' : 'Start Session'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StartSessionModal;

