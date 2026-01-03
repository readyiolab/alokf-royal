// components/admin/PlayerExpenseModal.jsx
// Player Expense - Player uses chips for food, drinks, tips, etc.

import React, { useState } from 'react';
import { UtensilsCrossed, Coffee, Heart, MoreHorizontal, Coins,Check, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import expenseService from '../../services/expense.service';

const EXPENSE_CATEGORIES = [
  { value: 'food', label: 'Food', icon: UtensilsCrossed, color: 'from-orange-500 to-amber-500', bgColor: 'bg-orange-50 border-orange-200' },
  { value: 'drinks', label: 'Drinks', icon: Coffee, color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-50 border-blue-200' },
  { value: 'tips', label: 'Tips', icon: Heart, color: 'from-pink-500 to-rose-500', bgColor: 'bg-pink-50 border-pink-200' },
  { value: 'miscellaneous', label: 'Miscellaneous', icon: MoreHorizontal, color: 'from-gray-500 to-slate-500', bgColor: 'bg-gray-50 border-gray-200' }
];

const PlayerExpenseModal = ({ isOpen, onClose, onSuccess, sessionId }) => {
  const [category, setCategory] = useState('');
  const [chipBreakdown, setChipBreakdown] = useState({
    chips_100: 0,
    chips_500: 0,
    chips_5000: 0,
    chips_10000: 0
  });
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const calculateChipValue = () => {
    return (
      (chipBreakdown.chips_100 || 0) * 100 +
      (chipBreakdown.chips_500 || 0) * 500 +
      (chipBreakdown.chips_5000 || 0) * 5000 +
      (chipBreakdown.chips_10000 || 0) * 10000
    );
  };

  const handleChipChange = (denomination, value) => {
    setChipBreakdown(prev => ({
      ...prev,
      [denomination]: parseInt(value) || 0
    }));
  };

  const handleSubmit = async () => {
    if (!category) {
      setError('Please select an expense category');
      return;
    }

    const chipValue = calculateChipValue();
    if (chipValue <= 0) {
      setError('Please enter chips returned');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await expenseService.recordPlayerExpense({
        session_id: sessionId,
        expense_category: category,
        chip_breakdown: chipBreakdown,
        chip_amount: chipValue,
        notes: description
      });

      setSuccess('Player expense recorded successfully');
      
      setTimeout(() => {
        onSuccess && onSuccess(response);
        resetForm();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record expense');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCategory('');
    setChipBreakdown({ chips_100: 0, chips_500: 0, chips_5000: 0, chips_10000: 0 });
    setDescription('');
    setError('');
    setSuccess('');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span>Player Expense</span>
              <span className="text-xs text-muted-foreground font-normal">
                Record player expense
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-900">Expense Category</Label>
            <div className="grid grid-cols-2 gap-3">
              {EXPENSE_CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = category === cat.value;
                return (
                  <div
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                      isSelected
                        ? `${cat.bgColor} shadow-md`
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected ? `bg-gradient-to-br ${cat.color} text-white` : 'bg-gray-100 text-gray-500'
                    }`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className={`font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                      {cat.label}
                    </span>
                    {isSelected && <Check className="w-5 h-5 text-rose-600 ml-auto" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chip Breakdown */}
          <Card className="bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200 shadow-md">
            <CardContent className="pt-5 pb-4">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <Coins className="w-4 h-4" />
                Chips Returned by Player *
              </Label>
              
              <div className="grid grid-cols-4 gap-3">
                {[
                  { key: 'chips_100', value: 100, colorClass: 'text-red-600 border-red-200 focus:border-red-400 bg-red-50', label: '₹100' },
                  { key: 'chips_500', value: 500, colorClass: 'text-green-600 border-green-200 focus:border-green-400 bg-green-50', label: '₹500' },
                  { key: 'chips_5000', value: 5000, colorClass: 'text-blue-600 border-blue-200 focus:border-blue-400 bg-blue-50', label: '₹5K' },
                  { key: 'chips_10000', value: 10000, colorClass: 'text-purple-600 border-purple-200 focus:border-purple-400 bg-purple-50', label: '₹10K' }
                ].map(chip => (
                  <div key={chip.key} className="text-center">
                    <div className={`text-xs font-bold mb-2 ${chip.colorClass.split(' ')[0]}`}>
                      {chip.label}
                    </div>
                    <Input
                      type="number"
                      min="0"
                      placeholder=""
                      value={chipBreakdown[chip.key] || ''}
                      onChange={(e) => handleChipChange(chip.key, e.target.value)}
                      className={`text-center text-lg font-bold h-12 border-2 ${chip.colorClass}`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formatCurrency((parseInt(chipBreakdown[chip.key]) || 0) * chip.value)}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Total Display */}
              <div className="mt-5 pt-4 border-t border-slate-200 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Total Expense</span>
                <span className={`text-3xl font-black ${calculateChipValue() > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                  {formatCurrency(calculateChipValue())}
                </span>
              </div>
              
              <p className="text-xs text-gray-500 mt-2 text-center">
                These chips will be returned to the cashier inventory
              </p>
            </CardContent>
          </Card>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-900">Description (Optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Player ordered dinner, Soft drinks..."
              className="h-11"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-700 text-sm">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !category || calculateChipValue() <= 0}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Record Expense"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerExpenseModal;
