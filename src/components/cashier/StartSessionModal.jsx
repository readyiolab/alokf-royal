// ============================================
// FILE: components/cashier/StartSessionModal.jsx
// Modal to start a new session with cashier selection, float and chip inventory
// ============================================

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUp, Coins, User, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import cashierService from '../../services/cashier.service';
import apiService from '../../services/api.service';

const StartSessionModal = ({ open, onOpenChange, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cashiers, setCashiers] = useState([]);
  const [form, setForm] = useState({
    cashier_id: '',
    owner_float: '',
    chips_100: '0',
    chips_500: '0',
    chips_1000: '0',
    chips_5000: '0',
    chips_10000: '0',
  });

  // Fetch cashiers on mount
  useEffect(() => {
    if (open) {
      fetchCashiers();
    }
  }, [open]);

  const fetchCashiers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await apiService.get('/cashier/cashiers', token);
      const cashierList = response?.data || response || [];
      setCashiers(cashierList.filter(c => c.is_active !== 0));
    } catch (error) {
      console.error('Error fetching cashiers:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load cashiers',
      });
    }
  };

  // Calculate total chip value
  const chipValue =
    (parseInt(form.chips_100) || 0) * 100 +
    (parseInt(form.chips_500) || 0) * 500 +
    (parseInt(form.chips_1000) || 0) * 1000 +
    (parseInt(form.chips_5000) || 0) * 5000 +
    (parseInt(form.chips_10000) || 0) * 10000;

  const totalChips =
    (parseInt(form.chips_100) || 0) +
    (parseInt(form.chips_500) || 0) +
    (parseInt(form.chips_1000) || 0) +
    (parseInt(form.chips_5000) || 0) +
    (parseInt(form.chips_10000) || 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleChipChange = (denomination, value) => {
    const numValue = parseInt(value) || 0;
    setForm({ ...form, [denomination]: Math.max(0, numValue).toString() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.cashier_id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a cashier',
      });
      return;
    }

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
        chips_1000: parseInt(form.chips_1000) || 0,
        chips_5000: parseInt(form.chips_5000) || 0,
        chips_10000: parseInt(form.chips_10000) || 0,
      };

      const result = await cashierService.startSession(floatAmount, chipInventory, form.cashier_id);

      setForm({
        cashier_id: '',
        owner_float: '',
        chips_100: '0',
        chips_500: '0',
        chips_1000: '0',
        chips_5000: '0',
        chips_10000: '0',
      });

      // Check if session was already active
      if (result?.data?.already_active || result?.already_active) {
        toast({
          title: 'Session Already Active',
          description: result?.data?.message || result?.message || 'A session is already running for today',
        });
      } else if (result?.data?.reopened || result?.reopened) {
        toast({
          title: 'Session Reopened',
          description: result?.data?.message || result?.message || 'Session reopened successfully',
        });
      } else {
        toast({
          title: 'Session Started',
          description: result?.data?.message || result?.message || `Session started with ${formatCurrency(floatAmount)} float and ${totalChips} chips`,
        });
      }
      
      // Close modal first
      onOpenChange(false);
      
      // Wait a moment for backend to process shift creation, then refresh
      setTimeout(() => {
        onSuccess();
      }, 1000);
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
      cashier_id: '',
      owner_float: '',
      chips_100: '0',
      chips_500: '0',
      chips_5000: '0',
      chips_10000: '0',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-5xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ArrowUp className="h-5 w-5 text-primary" />
            </div>
            Start Day
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="text-sm text-muted-foreground">Start a new day by selecting a cashier, entering opening float, and chip inventory.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Cashier and Float */}
            <div className="space-y-5">
              {/* Select Cashier */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Select Cashier
                </Label>
                <Select
                  value={form.cashier_id}
                  onValueChange={(value) => setForm({ ...form, cashier_id: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select cashier to start day" />
                  </SelectTrigger>
                  <SelectContent>
                    {cashiers.map((cashier) => (
                      <SelectItem key={cashier.cashier_id} value={cashier.cashier_id?.toString()}>
                        {cashier.full_name || cashier.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {cashiers.length} cashiers available • This cashier will be recorded as opening the day.
                </p>
              </div>

              {/* Opening Float */}
              <div className="space-y-2">
                <Label>Opening Float (₹)</Label>
                <Input
                  type="number"
                  value={form.owner_float}
                  onChange={(e) => setForm({ ...form, owner_float: e.target.value })}
                  placeholder="Enter opening cash float."
                  className="font-mono text-lg"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter the cash float given by CEO to start the day.
                </p>
              </div>
            </div>

            {/* Right Column - Opening Chips */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-muted-foreground" />
                Opening Chips
              </Label>

              <div className="p-5 rounded-xl bg-gradient-to-b from-muted/60 to-muted/30 border border-border space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Chips Inventory</p>
                  <span className={cn(
                    "text-xs font-mono px-2 py-0.5 rounded",
                    chipValue > 0 ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                  )}>
                    {totalChips} chips = {formatCurrency(chipValue)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-[hsl(340,82%,52%)]">₹100 chips</Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.chips_100 || ''}
                      onChange={(e) => handleChipChange('chips_100', e.target.value)}
                      className="font-mono text-lg font-bold"
                      placeholder="0"
                    />
                    <span className="text-xs text-muted-foreground">= {formatCurrency((parseInt(form.chips_100) || 0) * 100)}</span>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-[hsl(210,100%,56%)]">₹500 chips</Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.chips_500 || ''}
                      onChange={(e) => handleChipChange('chips_500', e.target.value)}
                      className="font-mono text-lg font-bold"
                      placeholder="0"
                    />
                    <span className="text-xs text-muted-foreground">= {formatCurrency((parseInt(form.chips_500) || 0) * 500)}</span>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-[hsl(45,93%,47%)]">₹1,000 chips</Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.chips_1000 || ''}
                      onChange={(e) => handleChipChange('chips_1000', e.target.value)}
                      className="font-mono text-lg font-bold"
                      placeholder="0"
                    />
                    <span className="text-xs text-muted-foreground">= {formatCurrency((parseInt(form.chips_1000) || 0) * 1000)}</span>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-[hsl(145,63%,42%)]">₹5,000 chips</Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.chips_5000 || ''}
                      onChange={(e) => handleChipChange('chips_5000', e.target.value)}
                      className="font-mono text-lg font-bold"
                      placeholder="0"
                    />
                    <span className="text-xs text-muted-foreground">= {formatCurrency((parseInt(form.chips_5000) || 0) * 5000)}</span>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-[hsl(280,70%,55%)]">₹10,000 chips</Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.chips_10000 || ''}
                      onChange={(e) => handleChipChange('chips_10000', e.target.value)}
                      className="font-mono text-lg font-bold"
                      placeholder="0"
                    />
                    <span className="text-xs text-muted-foreground">= {formatCurrency((parseInt(form.chips_10000) || 0) * 10000)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-border">
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
              disabled={loading || !form.cashier_id || !form.owner_float}
              className="flex-1 gradient-gold text-primary-foreground font-semibold"
            >
              {loading ? 'Starting...' : 'Start Day'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StartSessionModal;
