import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePlayerSearch } from '../../hooks/usePlayerSearch';
import transactionService from '../../services/transaction.service';
import ChipInputGrid from '../common/ChipInputGrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Loader2,
  Info,
  Search,
  Coins,
  AlertCircle,
  Package,
  Banknote,
  Wallet,
  Save
} from 'lucide-react';

/**
 * ✅ DEPOSIT FORM - Two Options:
 * 1. Deposit Chips - Player returns chips to store for next session
 * 2. Deposit Cash - Player deposits cash which goes to secondary wallet
 */
const DepositChipsForm = ({ onSuccess, onCancel }) => {
  const { token } = useAuth();
  const [depositType, setDepositType] = useState('chips'); // 'chips' or 'cash'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [chipBalance, setChipBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

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
    notes: '',
    cash_amount: ''
  });

  // ✅ Chips received from player (counts, not amounts)
  const [chipsReceived, setChipsReceived] = useState({
    chips_100: 0,
    chips_500: 0,
    chips_1000: 0,
    chips_5000: 0,
    chips_10000: 0
  });

  // ✅ Calculate total value from chip counts
  const calculateTotalValue = () => {
    return (
      parseInt(chipsReceived.chips_100 || 0) * 100 +
      parseInt(chipsReceived.chips_500 || 0) * 500 +
      parseInt(chipsReceived.chips_1000 || 0) * 1000 +
      parseInt(chipsReceived.chips_5000 || 0) * 5000 +
      parseInt(chipsReceived.chips_10000 || 0) * 10000
    );
  };

  const totalValue = calculateTotalValue();
  const totalChipCount = 
    parseInt(chipsReceived.chips_100 || 0) +
    parseInt(chipsReceived.chips_500 || 0) +
    parseInt(chipsReceived.chips_1000 || 0) +
    parseInt(chipsReceived.chips_5000 || 0) +
    parseInt(chipsReceived.chips_10000 || 0);

  const cashAmount = parseFloat(formData.cash_amount) || 0;

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
    } finally {
      setLoadingBalance(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleChipCountChange = (denomination, value) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    setChipsReceived(prev => ({
      ...prev,
      [denomination]: numValue
    }));
    setError('');
  };

  const handlePlayerFocus = () => {
    setShowDropdown(true);
    if (token) {
      loadAllPlayers(token, { reuseExisting: true });
    }
  };

  const handlePlayerInput = (value) => {
    setSearchQuery(value);
    setFormData(prev => ({ ...prev, player_name: value }));
    setSelectedPlayerId(null);
    setShowDropdown(true);

    if (!value.trim()) {
      setFormData(prev => ({ ...prev, phone_number: '' }));
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
    }));
    setShowDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.player_name.trim()) {
      setError('Player name is required');
      return;
    }

    if (!formData.phone_number.trim() || formData.phone_number.length !== 10) {
      setError('Valid 10-digit phone number is required');
      return;
    }

    if (depositType === 'chips') {
      if (totalValue === 0 || totalChipCount === 0) {
        setError('Please enter the chips being deposited');
        return;
      }
    } else {
      if (cashAmount <= 0) {
        setError('Please enter a valid cash amount');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      if (depositType === 'chips') {
        const payload = {
          player_id: selectedPlayerId,
          player_name: formData.player_name.trim(),
          phone_number: formData.phone_number.trim(),
          chips_amount: totalValue,
          chip_breakdown: chipsReceived,
          notes: formData.notes.trim() || null,
        };

        const result = await transactionService.depositChips(token, payload);
        setSuccessMessage(`${formatCurrency(totalValue)} chips deposited. Stored balance: ${formatCurrency(result.total_stored_chips)}`);
      } else {
        // Deposit Cash
        const payload = {
          player_id: selectedPlayerId,
          player_name: formData.player_name.trim(),
          phone_number: formData.phone_number.trim(),
          amount: cashAmount,
          notes: formData.notes.trim() || `Cash deposit by ${formData.player_name}`,
        };

        const result = await transactionService.depositCash(token, payload);
        setSuccessMessage(`${formatCurrency(cashAmount)} cash deposited. Added to secondary wallet.`);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err.message || `Failed to deposit ${depositType}`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="absolute inset-0 bg-green-200 blur-2xl opacity-20 animate-pulse"></div>
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center mb-6 shadow-2xl">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {depositType === 'chips' ? 'Chips Deposited!' : 'Cash Deposited!'}
        </h3>
        <p className="text-gray-600">{successMessage}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Section */}
      <div className="space-y-2 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
            <Save className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Deposit Chips</h2>
            <p className="text-sm text-gray-500">Store for next session</p>
          </div>
        </div>
      </div>

      {/* ✅ Deposit Type Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          type="button"
          onClick={() => setDepositType('chips')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all ${
            depositType === 'chips'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-transparent text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Coins className="w-5 h-5" />
          Deposit Chips
        </button>
        <button
          type="button"
          onClick={() => setDepositType('cash')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all ${
            depositType === 'cash'
              ? 'bg-green-600 text-white shadow-lg'
              : 'bg-transparent text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Banknote className="w-5 h-5" />
          Deposit Cash
        </button>
      </div>

     
      {/* Player Balance Information */}
      {(selectedPlayerId !== null && selectedPlayerId !== undefined) && loadingBalance && (
        <div className="flex items-center gap-2 text-muted-foreground py-3 px-4 bg-muted/50 rounded-lg">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading player info...</span>
        </div>
      )}
      
      {(selectedPlayerId !== null && selectedPlayerId !== undefined) && chipBalance && !loadingBalance && (
        <div className="space-y-4">
          {/* Player Name Header */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
            <p className="text-lg font-bold text-gray-900 mb-1">{formData.player_name}</p>
            <p className="text-xs text-gray-600">Player Balance Information</p>
          </div>

          {/* Primary and Secondary Balance Cards */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {/* Primary Balance - Current Chips (Playable) */}
            <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-semibold text-gray-700">Primary Balance</span>
                  </div>
                  <Badge className="bg-emerald-600 text-white text-xs">Playable</Badge>
                </div>
                <p className="text-3xl font-black text-emerald-700 mb-1">
                  ₹{parseFloat(chipBalance?.current_chip_balance || 0).toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-gray-600">Current chips in hand</p>
              </CardContent>
            </Card>

            {/* Secondary Balance - Stored Chips */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-700">Secondary Balance</span>
                  </div>
                  <Badge className="bg-blue-600 text-white text-xs">Stored</Badge>
                </div>
                <p className="text-3xl font-black text-blue-700 mb-1">
                  ₹{parseFloat(chipBalance?.stored_chips || 0).toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-gray-600">Available for chip issuance</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Player Search */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-900">Player</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 relative">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              id="player_name"
              placeholder="Search by name or player code"
              value={searchQuery}
              onFocus={handlePlayerFocus}
              onChange={(e) => handlePlayerInput(e.target.value)}
              onBlur={() => {
                setTimeout(() => setShowDropdown(false), 200);
              }}
              className="h-11 pl-9"
            />
            {searchingPlayers && (
              <Loader2 className="absolute right-3 top-3 w-4 h-4 text-gray-500 animate-spin" />
            )}
          </div>

          {(showDropdown || searchError) && (
            <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-72 overflow-y-auto">
              {searchError && (
                <div className="px-3 py-2 text-sm text-red-600 border-b border-gray-200">
                  {searchError}
                </div>
              )}

              {!searchingPlayers &&
                !searchError &&
                (!filteredPlayers || filteredPlayers.length === 0) && (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    {loadedAll
                      ? "No players available"
                      : "Start typing to search players"}
                  </div>
                )}

              {filteredPlayers &&
                Array.isArray(filteredPlayers) &&
                filteredPlayers.map((player) => (
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
                        <p className="font-medium text-gray-900">
                          {player.player_name}
                        </p>
                        <p className="text-xs text-gray-600">
                          Code: {player.player_code || player.player_id}
                        </p>
                      </div>
                      {player.stored_chips > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          Stored: {formatCurrency(player.stored_chips)}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
            </div>
          )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number" className="text-sm font-medium text-gray-900">
              Phone Number *
            </Label>
            <Input
              id="phone_number"
              type="tel"
              placeholder="9876543210"
              maxLength={10}
              value={formData.phone_number}
              onChange={(e) =>
                setFormData(prev => ({
                  ...prev,
                  phone_number: e.target.value.replace(/\D/g, "")
                }))
              }
              readOnly={selectedPlayerId !== null && selectedPlayerId !== undefined}
              className={`h-11 ${selectedPlayerId !== null && selectedPlayerId !== undefined ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            />
            {selectedPlayerId !== null && selectedPlayerId !== undefined && (
              <p className="text-xs text-gray-500">Phone number is auto-filled from selected player</p>
            )}
          </div>
        </div>
      </div>

      {/* ✅ DEPOSIT CHIPS SECTION - Using ChipInputGrid like Buy-In */}
      {depositType === 'chips' && (
        <div className="space-y-4">
          <ChipInputGrid
            chips={chipsReceived}
            onChange={setChipsReceived}
            title="Chips Being Deposited"
            showTotal={true}
            totalLabel="Total Deposit Value"
          />
        </div>
      )}

      {/* ✅ DEPOSIT CASH SECTION */}
      {depositType === 'cash' && (
        <Card className="border-green-200 shadow-lg">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Banknote className="w-5 h-5 text-green-600" />
              <span className="text-black">Cash Deposit</span>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Player deposits cash - goes to secondary wallet
            </p>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 bg-white">
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">
                Cash Amount (₹) *
              </Label>
              <Input
                type="number"
                min="100"
                step="100"
                value={formData.cash_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, cash_amount: e.target.value }))}
                className="h-14 text-center text-2xl font-bold"
                placeholder="Enter amount"
              />
            </div>

            {cashAmount > 0 && (
              <Alert className="border-green-200 bg-green-50">
                <Wallet className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Amount to Deposit:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(cashAmount)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    This cash will be added to secondary wallet immediately.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-medium text-gray-900">
          Note (optional)
        </Label>
        <Input
          id="notes"
          placeholder="Add a note..."
          value={formData.notes}
          onChange={(e) =>
            setFormData(prev => ({ ...prev, notes: e.target.value }))
          }
          className="h-11"
        />
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Submit Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            loading ||
            !selectedPlayerId ||
            (depositType === 'chips' ? (totalValue === 0 || totalChipCount === 0) : cashAmount <= 0)
          }
          className={`flex-1 disabled:bg-gray-400 disabled:cursor-not-allowed ${
            depositType === 'chips' 
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            depositType === 'chips' 
              ? `Deposit Chips ${totalValue > 0 ? `• ${formatCurrency(totalValue)}` : ''}`
              : `Deposit Cash ${cashAmount > 0 ? `• ${formatCurrency(cashAmount)}` : ''}`
          )}
        </Button>
      </div>
    </form>
  );
};

export default DepositChipsForm;