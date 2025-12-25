import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePlayerSearch } from '../../hooks/usePlayerSearch';
import transactionService from '../../services/transaction.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle,
  Loader2,
  Info,
  Search,
  Calculator,
  AlertCircle
} from 'lucide-react';

const ReturnChipsForm = ({ onSuccess, onCancel }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [chipBalance, setChipBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showChipBreakdown, setShowChipBreakdown] = useState(false);

  const {
    searchQuery,
    setSearchQuery,
    searching: searchingPlayers,
    error: searchError,
    filteredPlayers,
    loadedAll,
    searchPlayers,
    loadAllPlayers,
    selectPlayer
  } = usePlayerSearch();

  const [formData, setFormData] = useState({
    player_name: '',
    phone_number: '',
    chips_amount: '',
    notes: ''
  });

  const [chipBreakdown, setChipBreakdown] = useState({
    chips_100: 0,
    chips_500: 0,
    chips_5000: 0,
    chips_10000: 0
  });

  const calculateChipTotal = () => {
    return (
      parseInt(chipBreakdown.chips_100 || 0) * 100 +
      parseInt(chipBreakdown.chips_500 || 0) * 500 +
      parseInt(chipBreakdown.chips_5000 || 0) * 5000 +
      parseInt(chipBreakdown.chips_10000 || 0) * 10000
    );
  };

  const chipTotal = calculateChipTotal();
  const targetAmount = parseFloat(formData.chips_amount || 0);
  const isChipBreakdownValid = chipTotal === targetAmount;

  useEffect(() => {
    if (selectedPlayerId && token) {
      fetchChipBalance(selectedPlayerId);
    } else {
      setChipBalance(null);
    }
  }, [selectedPlayerId, token]);

  const fetchChipBalance = async (playerId) => {
    setLoadingBalance(true);
    try {
      const balance = await transactionService.getPlayerChipBalance(token, playerId);
      setChipBalance(balance);
    } catch (err) {
      console.error('Error fetching chip balance:', err);
      setChipBalance(null);
      setError('Failed to fetch chip balance');
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleChipBreakdownChange = (denomination, value) => {
    const numValue = parseInt(value) || 0;
    setChipBreakdown(prev => ({
      ...prev,
      [denomination]: Math.max(0, numValue)
    }));
  };

  const autoFillChips = () => {
    const target = targetAmount;
    if (!target || target <= 0) return;

    let remaining = target;
    const breakdown = {
      chips_100: 0,
      chips_500: 0,
      chips_5000: 0,
      chips_10000: 0,
    };

    breakdown.chips_10000 = Math.floor(remaining / 10000);
    remaining -= breakdown.chips_10000 * 10000;

    breakdown.chips_5000 = Math.floor(remaining / 5000);
    remaining -= breakdown.chips_5000 * 5000;

    breakdown.chips_500 = Math.floor(remaining / 500);
    remaining -= breakdown.chips_500 * 500;

    breakdown.chips_100 = Math.floor(remaining / 100);
    
    setChipBreakdown(breakdown);
  };

  const handlePlayerFocus = () => {
    setShowDropdown(true);
    if (token) {
      loadAllPlayers(token, { reuseExisting: true });
    }
  };

  const handlePlayerInput = (value) => {
    setSearchQuery(value);
    handleChange('player_name', value);
    setSelectedPlayerId(null);
    setChipBalance(null);
    setShowDropdown(true);

    if (!value.trim()) {
      handleChange('phone_number', '');
      if (token) {
        loadAllPlayers(token, { reuseExisting: true });
      }
      return;
    }

    if (token) {
      searchPlayers(token, value);
    }
  };

  const handleSelectPlayer = (player) => {
    selectPlayer(player);
    setSelectedPlayerId(player.player_id);
    
    const displayText = `${player.player_name} (${player.player_code || player.player_id})`;
    setSearchQuery(displayText);
    setFormData(prev => ({
      ...prev,
      player_name: player.player_name,
      phone_number: player.phone_number || '',
      chips_amount: ''
    }));
    setShowDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.player_name.trim()) {
      setError('Player name is required');
      return;
    }

    if (!formData.phone_number || formData.phone_number.length !== 10) {
      setError('Valid 10-digit phone number is required');
      return;
    }

    if (!formData.chips_amount || parseFloat(formData.chips_amount) <= 0) {
      setError('Valid chips amount is required');
      return;
    }

    if (showChipBreakdown && !isChipBreakdownValid) {
      setError(`Chip breakdown (₹${chipTotal}) doesn't match amount (₹${targetAmount})`);
      return;
    }

    const availableChips = chipBalance?.current_chip_balance || 0;
    const requestedChips = parseFloat(formData.chips_amount);

    if (requestedChips > availableChips) {
      setError(`Insufficient chips! Player has ${availableChips} chips available. Maximum return: ${availableChips} chips`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        player_name: formData.player_name.trim(),
        phone_number: formData.phone_number.trim(),
        chips_amount: parseFloat(formData.chips_amount),
        notes: formData.notes.trim() || null
      };

      if (showChipBreakdown && isChipBreakdownValid) {
        payload.chip_breakdown = chipBreakdown;
      }

      await transactionService.createReturnChips(token, payload);

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to record chip return');
    } finally {
      setLoading(false);
    }
  };

  const availableChips = chipBalance?.current_chip_balance || 0;

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="absolute inset-0 bg-green-200 blur-2xl opacity-20 animate-pulse"></div>
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center mb-6 shadow-2xl">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Chips Returned Successfully!</h3>
        <p className="text-gray-600">Transaction has been recorded</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription className="text-sm">
          Use this when chips are returned without cash payout. Chips will be stored for the player's next session.
        </AlertDescription>
      </Alert>

      {chipBalance !== null && (
        <Alert className={availableChips > 0 ? "border-blue-200 bg-blue-50" : "border-orange-200 bg-orange-50"}>
          <Info className={`h-4 w-4 ${availableChips > 0 ? "text-blue-600" : "text-orange-600"}`} />
          <AlertDescription className={availableChips > 0 ? "text-blue-800" : "text-orange-800"}>
            {loadingBalance ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Checking chip balance...
              </span>
            ) : availableChips > 0 ? (
              <>
                Player has <strong>{availableChips} chips</strong> available for return.
              </>
            ) : (
              <>
                <strong>Warning:</strong> Player has <strong>0 chips</strong>. Cannot process return.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="relative space-y-2">
          <Label className="text-gray-700 font-medium">Player Name *</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name or code"
              value={searchQuery}
              onFocus={handlePlayerFocus}
              onChange={(e) => handlePlayerInput(e.target.value)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              className="h-11 pl-9"
            />
            {searchingPlayers && (
              <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin" />
            )}
          </div>

          {(showDropdown || searchError) && (
            <div className="absolute z-20 w-full bg-white border rounded-lg shadow-xl max-h-64 overflow-y-auto">
              {searchError && (
                <div className="px-3 py-2 text-sm text-red-600">{searchError}</div>
              )}

              {!searchingPlayers && !searchError && (!filteredPlayers || filteredPlayers.length === 0) && (
                <div className="px-3 py-2 text-sm text-gray-500">
                  {loadedAll ? 'No players found' : 'Start typing to search'}
                </div>
              )}

              {filteredPlayers && Array.isArray(filteredPlayers) && filteredPlayers.map(player => (
                <button
                  key={player.player_id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectPlayer(player);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{player.player_name}</p>
                      <p className="text-xs text-gray-600">
                        Code: {player.player_code || player.player_id}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700 font-medium">Phone Number *</Label>
          <Input
            type="tel"
            placeholder="9876543210"
            maxLength={10}
            value={formData.phone_number}
            onChange={(e) => handleChange('phone_number', e.target.value.replace(/\D/g, ''))}
            className="h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-700 font-medium">Chips Amount *</Label>
        <Input
          type="number"
          min="1"
          max={availableChips || undefined}
          placeholder="Enter chips to return"
          value={formData.chips_amount}
          onChange={(e) => {
            const value = parseFloat(e.target.value || 0);
            if (availableChips > 0 && value > availableChips) {
              setError(`Maximum allowed: ${availableChips} chips`);
              return;
            }
            setError('');
            handleChange('chips_amount', e.target.value);
          }}
          className="h-11"
        />
        {availableChips > 0 && (
          <p className="text-xs text-gray-500">
            Max: {availableChips} chips available
          </p>
        )}
      </div>

      {/* Chip Breakdown Toggle */}
      <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-purple-600" />
          <span className="font-medium text-gray-900">Specify Chip Breakdown (Chips Received)</span>
        </div>
        <Button
          type="button"
          variant={showChipBreakdown ? "default" : "outline"}
          size="sm"
          onClick={() => setShowChipBreakdown(!showChipBreakdown)}
        >
          {showChipBreakdown ? 'Hide' : 'Show'}
        </Button>
      </div>

      {showChipBreakdown && (
        <Card className="border-purple-200 shadow-lg">
          <CardHeader className="bg-purple-50">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Chips Being Returned</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={autoFillChips}
                disabled={!targetAmount || targetAmount <= 0}
              >
                Auto-Fill
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">₹100 Chips</Label>
                <Input
                  type="number"
                  min="0"
                  value={chipBreakdown.chips_100}
                  onChange={(e) => handleChipBreakdownChange('chips_100', e.target.value)}
                  className="h-11"
                />
                <p className="text-xs text-gray-500">
                  Value: ₹{(chipBreakdown.chips_100 * 100).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">₹500 Chips</Label>
                <Input
                  type="number"
                  min="0"
                  value={chipBreakdown.chips_500}
                  onChange={(e) => handleChipBreakdownChange('chips_500', e.target.value)}
                  className="h-11"
                />
                <p className="text-xs text-gray-500">
                  Value: ₹{(chipBreakdown.chips_500 * 500).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">₹5,000 Chips</Label>
                <Input
                  type="number"
                  min="0"
                  value={chipBreakdown.chips_5000}
                  onChange={(e) => handleChipBreakdownChange('chips_5000', e.target.value)}
                  className="h-11"
                />
                <p className="text-xs text-gray-500">
                  Value: ₹{(chipBreakdown.chips_5000 * 5000).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">₹10,000 Chips</Label>
                <Input
                  type="number"
                  min="0"
                  value={chipBreakdown.chips_10000}
                  onChange={(e) => handleChipBreakdownChange('chips_10000', e.target.value)}
                  className="h-11"
                />
                <p className="text-xs text-gray-500">
                  Value: ₹{(chipBreakdown.chips_10000 * 10000).toLocaleString()}
                </p>
              </div>
            </div>

            <Alert className={isChipBreakdownValid ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
              <AlertCircle className={`h-4 w-4 ${isChipBreakdownValid ? "text-green-600" : "text-orange-600"}`} />
              <AlertDescription className={isChipBreakdownValid ? "text-green-800" : "text-orange-800"}>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total from breakdown:</span>
                  <span className="text-lg font-bold">₹{chipTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span>Target amount:</span>
                  <span className="font-semibold">₹{targetAmount.toLocaleString()}</span>
                </div>
                {!isChipBreakdownValid && targetAmount > 0 && (
                  <p className="mt-2 text-sm font-medium">
                    ⚠️ Difference: ₹{Math.abs(chipTotal - targetAmount).toLocaleString()}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <Label className="text-gray-700 font-medium">Notes (Optional)</Label>
        <Input
          placeholder="Any additional notes..."
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          className="h-11"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={loading || availableChips === 0}
          className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Return Chips
        </Button>

        <Button
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="h-11 px-6"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default ReturnChipsForm;