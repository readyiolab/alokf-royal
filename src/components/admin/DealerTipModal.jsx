// components/admin/DealerTipModal.jsx
// Dealer Tips - Player gives chips as tip to dealer, 50% paid to dealer as cash

import React, { useState, useEffect } from 'react';
import { X, HandCoins, User, Search, Coins, Wallet, Check, Loader2, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
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
  };

  if (!isOpen) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <HandCoins className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Dealer Tip</CardTitle>
              <p className="text-sm text-amber-100 mt-1">50% of chip value paid as cash to dealer</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Dealer Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4" />
              Select Dealer *
            </Label>
            {dealers.length === 0 ? (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertDescription className="text-amber-700">
                  No dealers found. Please add dealers first.
                </AlertDescription>
              </Alert>
            ) : (
              <ScrollArea className="h-[180px]">
                <div className="grid grid-cols-2 gap-3">
                  {dealers.map((dealer) => (
                    <div
                      key={dealer.dealer_id}
                      onClick={() => setSelectedDealer(dealer)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedDealer?.dealer_id === dealer.dealer_id
                          ? 'border-amber-500 bg-amber-50 shadow-md'
                          : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          selectedDealer?.dealer_id === dealer.dealer_id 
                            ? 'bg-gradient-to-br from-amber-500 to-orange-600' 
                            : 'bg-gradient-to-br from-gray-400 to-gray-500'
                        }`}>
                          {dealer.dealer_name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{dealer.dealer_name}</p>
                          <p className="text-xs text-gray-500">{dealer.employee_code}</p>
                        </div>
                        {selectedDealer?.dealer_id === dealer.dealer_id && (
                          <Check className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Chip Breakdown */}
          <Card className="bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200 shadow-md">
            <CardContent className="pt-5 pb-4">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <Coins className="w-4 h-4" />
                Tip Chips Received *
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
                      placeholder="0"
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

          {/* Cash Percentage Selection */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 shadow-md">
            <CardContent className="pt-5 pb-4">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <Wallet className="w-4 h-4" />
                Cash Percentage to Dealer *
              </Label>
              
              <div className="grid grid-cols-5 gap-2 mb-4">
                {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(percentage => (
                  <button
                    key={percentage}
                    type="button"
                    onClick={() => setCashPercentage(percentage)}
                    className={`h-12 rounded-lg border-2 font-bold text-sm transition-all ${
                      cashPercentage === percentage
                        ? 'border-green-500 bg-green-500 text-white shadow-lg'
                        : 'border-green-200 bg-white text-green-700 hover:border-green-400 hover:bg-green-50'
                    }`}
                  >
                    {percentage}%
                  </button>
                ))}
              </div>
              
              <div className="flex items-center justify-center p-3 bg-green-100 rounded-lg">
                <span className="text-sm font-medium text-green-800">
                  Selected: <span className="font-bold">{cashPercentage}%</span> cash to dealer
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Calculation Summary */}
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-md">
            <CardContent className="pt-5 pb-4 space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-amber-200">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-600" />
                  <span className="text-gray-700 font-medium">Total Chip Value</span>
                </div>
                <span className="text-2xl font-black text-gray-900">
                  {formatCurrency(calculateChipValue())}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-600">Chips Returned to Inventory</span>
                <span className="font-semibold text-gray-700">
                  {formatCurrency(calculateChipValue())}
                </span>
              </div>

              <Card className="bg-gradient-to-br from-emerald-100 to-green-100 border-emerald-300">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-emerald-600" />
                    <span className="text-emerald-800 font-bold">Cash Paid to Dealer ({cashPercentage}%)</span>
                  </div>
                  <span className="text-3xl font-black text-emerald-600">
                    {formatCurrency(calculateDealerCash())}
                  </span>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Info Box */}
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-700 text-sm">
              <strong>How it works:</strong> Player gives tip chips to dealer. The full chip value is returned 
              to the inventory. {cashPercentage}% of the chip value is paid to the dealer as cash from the wallet.
            </AlertDescription>
          </Alert>

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

          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-emerald-200 bg-emerald-50">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <AlertDescription className="text-emerald-700">{success}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !selectedDealer || calculateChipValue() <= 0}
              className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <HandCoins className="w-4 h-4 mr-2" />
                  Record Tip {calculateChipValue() > 0 && `• ${formatCurrency(calculateDealerCash())}`}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DealerTipModal;
