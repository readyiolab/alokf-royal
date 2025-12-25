// components/cashier/DepositChipsModal.jsx
// Deposit Chips - Player deposits chips for future use instead of cashing out

import React, { useState } from 'react';
import { X, Save, Coins, User, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import api from '../../services/api.service';

const DepositChipsModal = ({ isOpen, onClose, onSuccess, player, sessionId }) => {
  const [chipBreakdown, setChipBreakdown] = useState({
    chips_100: 0,
    chips_500: 0,
    chips_5000: 0,
    chips_10000: 0
  });
  const [notes, setNotes] = useState('');
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
    const chipValue = calculateChipValue();
    if (chipValue <= 0) {
      setError('Please enter chips to deposit');
      return;
    }

    if (!player?.player_id) {
      setError('Player not selected');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post(`/players/${player.player_id}/stored-chips/deposit`, {
        session_id: sessionId,
        chip_breakdown: chipBreakdown,
        total_value: chipValue,
        notes
      });

      setSuccess(`${formatCurrency(chipValue)} deposited to ${player.player_name}'s stored balance`);
      
      setTimeout(() => {
        onSuccess && onSuccess(response.data);
        resetForm();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deposit chips');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setChipBreakdown({ chips_100: 0, chips_500: 0, chips_5000: 0, chips_10000: 0 });
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
      <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl rounded-2xl">
        {/* Premium Header */}
        <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Save className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Deposit Chips for Storage</h2>
                <p className="text-white/80 text-sm">Player wants to save chips for future use</p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Player Info */}
          {player && (
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border-2 border-amber-200">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                {player.player_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{player.player_name}</p>
                <p className="text-sm text-gray-500">{player.player_code}</p>
              </div>
            </div>
          )}

          {/* Info Box */}
          <Alert className="bg-blue-50 border-2 border-blue-200 rounded-xl">
            <AlertDescription className="text-blue-700 text-sm">
              <strong>How it works:</strong> Instead of cashing out, player can deposit chips to their 
              stored balance. These chips will be available for buy-in on any future visit. 
              The chips are returned to the cashier inventory.
            </AlertDescription>
          </Alert>

          {/* Chip Breakdown Grid */}
          <div className="space-y-3">
            <Label className="text-sm font-bold text-gray-700">Chips to Deposit</Label>
            <div className="grid grid-cols-4 gap-3">
              {/* ₹10,000 Chips - Purple */}
              <div className="bg-gradient-to-b from-purple-50 to-purple-100 p-3 rounded-xl border-2 border-purple-200">
                <div className="w-8 h-8 bg-purple-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">10K</span>
                </div>
                <Input
                  type="number"
                  min="0"
                  value={chipBreakdown.chips_10000}
                  onChange={(e) => handleChipChange('chips_10000', e.target.value)}
                  className="text-center font-bold text-lg text-purple-700 border-purple-300 rounded-lg h-12"
                />
                <div className="text-xs text-purple-600 mt-2 text-center font-semibold">
                  {formatCurrency(chipBreakdown.chips_10000 * 10000)}
                </div>
              </div>

              {/* ₹5,000 Chips - Blue */}
              <div className="bg-gradient-to-b from-blue-50 to-blue-100 p-3 rounded-xl border-2 border-blue-200">
                <div className="w-8 h-8 bg-blue-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">5K</span>
                </div>
                <Input
                  type="number"
                  min="0"
                  value={chipBreakdown.chips_5000}
                  onChange={(e) => handleChipChange('chips_5000', e.target.value)}
                  className="text-center font-bold text-lg text-blue-700 border-blue-300 rounded-lg h-12"
                />
                <div className="text-xs text-blue-600 mt-2 text-center font-semibold">
                  {formatCurrency(chipBreakdown.chips_5000 * 5000)}
                </div>
              </div>

              {/* ₹500 Chips - Green */}
              <div className="bg-gradient-to-b from-green-50 to-green-100 p-3 rounded-xl border-2 border-green-200">
                <div className="w-8 h-8 bg-green-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">500</span>
                </div>
                <Input
                  type="number"
                  min="0"
                  value={chipBreakdown.chips_500}
                  onChange={(e) => handleChipChange('chips_500', e.target.value)}
                  className="text-center font-bold text-lg text-green-700 border-green-300 rounded-lg h-12"
                />
                <div className="text-xs text-green-600 mt-2 text-center font-semibold">
                  {formatCurrency(chipBreakdown.chips_500 * 500)}
                </div>
              </div>

              {/* ₹100 Chips - Red */}
              <div className="bg-gradient-to-b from-red-50 to-red-100 p-3 rounded-xl border-2 border-red-200">
                <div className="w-8 h-8 bg-red-500 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">100</span>
                </div>
                <Input
                  type="number"
                  min="0"
                  value={chipBreakdown.chips_100}
                  onChange={(e) => handleChipChange('chips_100', e.target.value)}
                  className="text-center font-bold text-lg text-red-700 border-red-300 rounded-lg h-12"
                />
                <div className="text-xs text-red-600 mt-2 text-center font-semibold">
                  {formatCurrency(chipBreakdown.chips_100 * 100)}
                </div>
              </div>
            </div>
          </div>

          {/* Total Value */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-5 rounded-xl border-2 border-amber-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                  <Coins className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-gray-700">Total Deposit Value</span>
              </div>
              <span className="text-3xl font-black text-amber-600">
                {formatCurrency(calculateChipValue())}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-3 ml-13">
              This amount will be added to player's stored balance for future use
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Notes (Optional)</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm resize-none transition-all"
              rows="2"
              placeholder="Any notes..."
            />
          </div>

          {/* Error/Success Messages */}
          {error && (
            <Alert className="bg-red-50 border-2 border-red-200 rounded-xl">
              <AlertDescription className="text-red-700 font-medium">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-2 border-green-200 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <AlertDescription className="text-green-700 font-medium ml-2">{success}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 h-12 rounded-xl border-2 border-gray-200 hover:bg-gray-50 font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || calculateChipValue() <= 0}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-600 hover:via-yellow-600 hover:to-orange-600 text-white font-bold shadow-lg shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Depositing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-5 h-5" />
                  Deposit {formatCurrency(calculateChipValue())}
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepositChipsModal;
