// components/cashier/TopUpFloatModal.jsx
// Mid-Day Top Up - Add Float or Chips

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Wallet, Coins } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import cashierService from '../../services/cashier.service';
import { useSession } from '../../contexts/Sessioncontext'; // ✅ FIXED: Using context version
import { useToast } from '@/hooks/use-toast';

const TopUpFloatModal = ({ open, onOpenChange, onSuccess }) => {
  const { toast } = useToast();
  const { dashboard, refresh: refreshDashboard } = useSession();
  const [activeTab, setActiveTab] = useState('float');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Float tab state
  const [floatAmount, setFloatAmount] = useState('');
  const [floatNotes, setFloatNotes] = useState('');

  // Chips tab state
  const [chipBreakdown, setChipBreakdown] = useState({
    chips_100: '',
    chips_500: '',
    chips_5000: '',
    chips_10000: '',
  });
  const [chipNotes, setChipNotes] = useState('');

  const openingFloat = dashboard?.wallets?.primary?.opening || 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const chipTotal = 
    (parseInt(chipBreakdown.chips_100) || 0) * 100 +
    (parseInt(chipBreakdown.chips_500) || 0) * 500 +
    (parseInt(chipBreakdown.chips_5000) || 0) * 5000 +
    (parseInt(chipBreakdown.chips_10000) || 0) * 10000;

  const chipCount =
    (parseInt(chipBreakdown.chips_100) || 0) +
    (parseInt(chipBreakdown.chips_500) || 0) +
    (parseInt(chipBreakdown.chips_5000) || 0) +
    (parseInt(chipBreakdown.chips_10000) || 0);

  const handleFloatQuickAdd = (amount) => {
    const current = parseFloat(floatAmount) || 0;
    setFloatAmount((current + amount).toString());
  };

  const handleChipChange = (key, value) => {
    const numValue = parseInt(value) || 0;
    setChipBreakdown(prev => ({
      ...prev,
      [key]: numValue >= 0 ? numValue.toString() : '',
    }));
  };

  const handleFloatSubmit = async () => {
    if (!floatAmount || parseFloat(floatAmount) <= 0) {
      setError('Enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await cashierService.addCashFloat(
        parseFloat(floatAmount),
        floatNotes,
        {
          chips_100: 0,
          chips_500: 0,
          chips_5000: 0,
          chips_10000: 0,
        }
      );

      toast({
        title: 'Success',
        description: `₹${parseFloat(floatAmount).toLocaleString('en-IN')} float added successfully`,
      });

      handleClose();
      if (onSuccess) onSuccess();
      refreshDashboard();
    } catch (err) {
      setError(err.message || 'Failed to add float');
    } finally {
      setLoading(false);
    }
  };

  const handleChipSubmit = async () => {
    if (chipTotal <= 0) {
      setError('Enter chip breakdown');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await cashierService.addCashFloat(
        chipTotal,
        chipNotes,
        {
          chips_100: parseInt(chipBreakdown.chips_100) || 0,
          chips_500: parseInt(chipBreakdown.chips_500) || 0,
          chips_5000: parseInt(chipBreakdown.chips_5000) || 0,
          chips_10000: parseInt(chipBreakdown.chips_10000) || 0,
        }
      );

      toast({
        title: 'Success',
        description: `Chips worth ₹${chipTotal.toLocaleString('en-IN')} added successfully`,
      });

      handleClose();
      if (onSuccess) onSuccess();
      refreshDashboard();
    } catch (err) {
      setError(err.message || 'Failed to add chips');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFloatAmount('');
    setFloatNotes('');
    setChipBreakdown({
      chips_100: '',
      chips_500: '',
      chips_5000: '',
      chips_10000: '',
    });
    setChipNotes('');
    setError('');
    setActiveTab('float');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">Mid-Day Top Up</div>
              <div className="text-sm font-normal text-gray-500">
                Add more cash float or chips to today's session.
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="float" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Add Float
            </TabsTrigger>
            <TabsTrigger value="chips" className="flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Add Chips
            </TabsTrigger>
          </TabsList>

          {/* Add Float Tab */}
          <TabsContent value="float" className="space-y-4 mt-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Current Opening Float</span>
              <span className="text-lg font-bold text-gray-900">{formatCurrency(openingFloat)}</span>
            </div>

            <div className="space-y-2">
              <Label>Amount to Add</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <Input
                  type="number"
                  min="0"
                  value={floatAmount}
                  onChange={(e) => setFloatAmount(e.target.value)}
                  placeholder="0"
                  className="pl-8 text-lg font-bold h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Quick Add</Label>
              <div className="grid grid-cols-4 gap-2">
                <Button type="button" variant="outline" onClick={() => handleFloatQuickAdd(10000)} className="h-10">+₹10K</Button>
                <Button type="button" variant="outline" onClick={() => handleFloatQuickAdd(25000)} className="h-10">+₹25K</Button>
                <Button type="button" variant="outline" onClick={() => handleFloatQuickAdd(50000)} className="h-10">+₹50K</Button>
                <Button type="button" variant="outline" onClick={() => handleFloatQuickAdd(100000)} className="h-10">+₹100K</Button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleFloatSubmit}
                disabled={loading || !floatAmount || parseFloat(floatAmount) <= 0}
              >
                {loading ? 'Adding...' : `Add ₹${parseFloat(floatAmount || 0).toLocaleString('en-IN')} Float`}
              </Button>
            </div>
          </TabsContent>

          {/* Add Chips Tab */}
          <TabsContent value="chips" className="space-y-4 mt-4">
            <div className="p-5 rounded-xl bg-gradient-to-b from-gray-50 to-gray-100 border border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  Chip Breakdown
                </Label>
                <span className="text-xs font-mono px-2 py-1 bg-white rounded border">
                  {chipCount} chips = {formatCurrency(chipTotal)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-red-600">₹100 chips</Label>
                  <Input type="number" min="0" value={chipBreakdown.chips_100} onChange={(e) => handleChipChange('chips_100', e.target.value)} className="font-mono text-lg font-bold" placeholder="0" />
                  <span className="text-xs text-gray-500">= {formatCurrency((parseInt(chipBreakdown.chips_100) || 0) * 100)}</span>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-green-600">₹500 chips</Label>
                  <Input type="number" min="0" value={chipBreakdown.chips_500} onChange={(e) => handleChipChange('chips_500', e.target.value)} className="font-mono text-lg font-bold" placeholder="0" />
                  <span className="text-xs text-gray-500">= {formatCurrency((parseInt(chipBreakdown.chips_500) || 0) * 500)}</span>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-blue-600">₹5,000 chips</Label>
                  <Input type="number" min="0" value={chipBreakdown.chips_5000} onChange={(e) => handleChipChange('chips_5000', e.target.value)} className="font-mono text-lg font-bold" placeholder="0" />
                  <span className="text-xs text-gray-500">= {formatCurrency((parseInt(chipBreakdown.chips_5000) || 0) * 5000)}</span>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-purple-600">₹10,000 chips</Label>
                  <Input type="number" min="0" value={chipBreakdown.chips_10000} onChange={(e) => handleChipChange('chips_10000', e.target.value)} className="font-mono text-lg font-bold" placeholder="0" />
                  <span className="text-xs text-gray-500">= {formatCurrency((parseInt(chipBreakdown.chips_10000) || 0) * 10000)}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleChipSubmit}
                disabled={loading || chipTotal <= 0}
              >
                {loading ? 'Adding...' : `Add ₹${chipTotal.toLocaleString('en-IN')} Chips`}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TopUpFloatModal;