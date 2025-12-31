// components/cashier/DepositChipsModal.jsx
// Deposit Chips - Player deposits chips for future use instead of cashing out

import React, { useState } from 'react';
import { Save, Coins, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Card, CardContent } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
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


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Save className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span>Deposit Chips</span>
              <span className="text-xs text-muted-foreground font-normal">
                Store for next session
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Player Info */}
          {player && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                {player.player_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-foreground">{player.player_name}</p>
                {player.player_code && (
                  <p className="text-xs text-muted-foreground">{player.player_code}</p>
                )}
              </div>
            </div>
          )}

          {/* Chip Breakdown */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              Chips to Deposit
            </Label>
            <Card className="bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200 shadow-md">
              <CardContent className="pt-5 pb-4">
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
          </div>

          {/* Summary */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Deposit Value:</span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(calculateChipValue())}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-900">Notes <span className="text-gray-400">(Optional)</span></Label>
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
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || calculateChipValue() <= 0}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Depositing...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Deposit Chips
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DepositChipsModal;
