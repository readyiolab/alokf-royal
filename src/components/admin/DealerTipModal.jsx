// components/admin/DealerTipModal.jsx
// Dealer Tips - Player gives chips as tip to dealer, 50% paid to dealer as cash

import React, { useState, useEffect } from 'react';
import { HandCoins, Coins, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import dealerService from '../../services/dealer.service';

const DealerTipModal = ({ isOpen, onClose, onSuccess, sessionId }) => {
  const [dealers, setDealers] = useState([]);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [chipBreakdown, setChipBreakdown] = useState({
    chips_100: 0,
    chips_500: 0,
    chips_5000: 0,
    chips_10000: 0
  });
  const [cashPercentage, setCashPercentage] = useState(50);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchDealers();
    }
  }, [isOpen]);

  const fetchDealers = async () => {
    try {
      const response = await dealerService.getAllDealers();
      setDealers(response.data || []);
    } catch (err) {
      console.error('Error fetching dealers:', err);
    }
  };

  const calculateChipValue = () => {
    return (
      (chipBreakdown.chips_100 || 0) * 100 +
      (chipBreakdown.chips_500 || 0) * 500 +
      (chipBreakdown.chips_5000 || 0) * 5000 +
      (chipBreakdown.chips_10000 || 0) * 10000
    );
  };

  const calculateDealerCash = () => {
    return calculateChipValue() * (cashPercentage / 100);
  };

  const handleChipChange = (denomination, value) => {
    setChipBreakdown(prev => ({
      ...prev,
      [denomination]: parseInt(value) || 0
    }));
  };

  const handleSubmit = async () => {
    if (!selectedDealer) {
      setError('Please select a dealer');
      return;
    }

    const chipValue = calculateChipValue();
    if (chipValue <= 0) {
      setError('Please enter tip chips');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await dealerService.recordDealerTip({
        dealer_id: selectedDealer.dealer_id,
        chip_breakdown: chipBreakdown,
        chip_amount: chipValue,
        cash_percentage: cashPercentage,
        notes
      });

      setSuccess(`Tip recorded! ${formatCurrency(calculateDealerCash())} cash paid to ${selectedDealer.dealer_name}`);
      
      setTimeout(() => {
        onSuccess && onSuccess(response);
        resetForm();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record tip');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDealer(null);
    setChipBreakdown({ chips_100: 0, chips_500: 0, chips_5000: 0, chips_10000: 0 });
    setCashPercentage(50);
    setNotes('');
    setError('');
    setSuccess('');
    setDealerSearchQuery('');
    setDealerOpen(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const [dealerSearchQuery, setDealerSearchQuery] = useState('');
  const [dealerOpen, setDealerOpen] = useState(false);

  const filteredDealers = dealers.filter(dealer =>
    dealer.dealer_name?.toLowerCase().includes(dealerSearchQuery.toLowerCase()) ||
    dealer.employee_code?.toLowerCase().includes(dealerSearchQuery.toLowerCase())
  );

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
              <HandCoins className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span>Dealer Tips</span>
              <span className="text-xs text-muted-foreground font-normal">
                Record dealer tips
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Dealer Selection */}
          <div className="space-y-2">
            <Label>Select Dealer</Label>
            <Popover open={dealerOpen} onOpenChange={setDealerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={dealerOpen}
                  className="w-full justify-between h-14 text-left font-normal"
                >
                  {selectedDealer ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                        {selectedDealer.dealer_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{selectedDealer.dealer_name}</p>
                        {selectedDealer.employee_code && (
                          <p className="text-xs text-muted-foreground">{selectedDealer.employee_code}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Search dealer...</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder="Search dealer..." 
                    value={dealerSearchQuery}
                    onValueChange={setDealerSearchQuery}
                  />
                  <CommandList>
                    {filteredDealers.length === 0 ? (
                      <CommandEmpty>No dealers found.</CommandEmpty>
                    ) : (
                      <CommandGroup>
                        <ScrollArea className="h-[280px]">
                          {filteredDealers.map((dealer) => (
                            <CommandItem
                              key={dealer.dealer_id}
                              value={dealer.dealer_id.toString()}
                              onSelect={() => {
                                setSelectedDealer(dealer);
                                setDealerOpen(false);
                              }}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center gap-3 w-full">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold flex-shrink-0">
                                  {dealer.dealer_name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground truncate">{dealer.dealer_name}</p>
                                  {dealer.employee_code && (
                                    <p className="text-xs text-muted-foreground">{dealer.employee_code}</p>
                                  )}
                                </div>
                                {selectedDealer?.dealer_id === dealer.dealer_id && (
                                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedDealer && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                  {selectedDealer.dealer_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-foreground">{selectedDealer.dealer_name}</p>
                  {selectedDealer.employee_code && (
                    <p className="text-xs text-muted-foreground">{selectedDealer.employee_code}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Chip Breakdown */}
          <Card className="bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200 shadow-md">
            <CardContent className="pt-5 pb-4">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <Coins className="w-4 h-4" />
                Chips Received *
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
            </CardContent>
          </Card>

          {/* Cash Percentage Selection - Only 50% */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-900">Cash Percentage to Dealer</Label>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setCashPercentage(50)}
                className="h-16 w-32 rounded-lg border-2 border-green-500 bg-green-500 text-white font-bold text-lg shadow-lg cursor-default"
                disabled
              >
                50%
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center">Fixed at 50%</p>
          </div>

          {/* Summary Section */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Chips returned:</span>
              <span className="text-lg font-bold text-green-600">
                +{formatCurrency(calculateChipValue())}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Cash to dealer ({cashPercentage}%):</span>
              <span className="text-lg font-bold text-red-600">
                -{formatCurrency(calculateDealerCash())}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Notes (Optional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes..."
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
              disabled={loading || !selectedDealer || calculateChipValue() <= 0}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Record Tip"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DealerTipModal;
