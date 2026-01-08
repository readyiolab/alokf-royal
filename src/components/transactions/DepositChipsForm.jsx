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
    cash_amount: '',
    payment_type: 'cash', // 'cash' or 'online'
    payment_mode: '', // 'cash', 'online_sbi', 'online_hdfc', 'online_other'
    screenshot: null // File object for screenshot
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
        // Validate payment mode
        if (!formData.payment_type) {
          throw new Error('Please select payment mode (Cash or Online)');
        }

        // Validate bank selection for Online
        if (formData.payment_type === 'online' && !formData.payment_mode) {
          throw new Error('Please select a bank for online deposit');
        }

        // Validate screenshot for Online
        if (formData.payment_type === 'online' && !formData.screenshot) {
          throw new Error('Screenshot is required for online deposits');
        }

        // Prepare payload
        const payload = {
          player_id: selectedPlayerId,
          player_name: formData.player_name.trim(),
          phone_number: formData.phone_number.trim(),
          amount: cashAmount,
          payment_type: formData.payment_type,
          payment_mode: formData.payment_mode || 'cash',
          notes: formData.notes.trim() || `Cash deposit by ${formData.player_name}`,
        };

        // Use FormData if screenshot is present
        let result;
        if (formData.screenshot) {
          const formDataToSend = new FormData();
          Object.keys(payload).forEach(key => {
            formDataToSend.append(key, payload[key]);
          });
          formDataToSend.append('screenshot', formData.screenshot);
          result = await transactionService.depositCash(token, formDataToSend, true); // true for FormData
        } else {
          result = await transactionService.depositCash(token, payload);
        }

        const walletType = formData.payment_type === 'cash' 
          ? 'Cash in Hand' 
          : `Online Money (${formData.payment_mode.replace('online_', '').toUpperCase()})`;
        setSuccessMessage(`${formatCurrency(cashAmount)} cash deposited. Added to Secondary Wallet → ${walletType}. Store Balance increased.`);
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header Section */}
      <div className="space-y-2 pb-3 border-b border-gray-200">
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
      
      

      {/* Player Search */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 relative">
            <Label className="text-sm font-medium text-gray-900">Player *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
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
                <Loader2 className="absolute right-3 top-3.5 w-4 h-4 text-gray-500 animate-spin" />
              )}
            </div>

            {(showDropdown || searchError) && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-72 overflow-y-auto">
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
        <Card className="border-2 border-green-200 bg-white shadow-md">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Banknote className="w-5 h-5 text-green-600" />
              <span className="text-gray-900">Cash Deposit</span>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Player deposits cash - goes to Secondary Wallet (increases Store Balance)
            </p>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Cash Amount */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">
                Cash Amount (₹) *
              </Label>
              <Input
                type="number"
                min="100"
                step="100"
                value={formData.cash_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, cash_amount: e.target.value }))}
                className="h-12 text-center text-xl font-bold border-2 border-green-200 focus:border-green-500"
                placeholder="Enter amount"
              />
            </div>

            {/* Payment Mode Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">
                Payment Mode *
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      payment_type: 'cash',
                      payment_mode: 'cash',
                      screenshot: null
                    }));
                  }}
                  className={`h-12 rounded-lg border-2 font-semibold transition-all ${
                    formData.payment_type === 'cash'
                      ? 'bg-green-600 text-white border-green-600 shadow-md'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
                  }`}
                >
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      payment_type: 'online',
                      payment_mode: '',
                      screenshot: null
                    }));
                  }}
                  className={`h-12 rounded-lg border-2 font-semibold transition-all ${
                    formData.payment_type === 'online'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  Online
                </button>
              </div>
            </div>

            {/* Bank Selection (Only for Online) */}
            {formData.payment_type === 'online' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900">
                  Select Bank *
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {['SBI', 'HDFC', 'Other'].map((bank) => {
                    const bankCode = bank.toLowerCase() === 'other' ? 'other' : bank.toLowerCase();
                    const paymentMode = `online_${bankCode}`;
                    return (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, payment_mode: paymentMode }));
                        }}
                        className={`h-11 rounded-lg border-2 font-semibold text-sm transition-all ${
                          formData.payment_mode === paymentMode
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {bank}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Screenshot Upload (Mandatory for Online) */}
            {formData.payment_type === 'online' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900">
                  Screenshot * <span className="text-red-500">(Required for Online)</span>
                </Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData(prev => ({ ...prev, screenshot: file }));
                    }
                  }}
                  className="h-11"
                />
                {formData.screenshot && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {formData.screenshot.name}
                  </p>
                )}
              </div>
            )}

            {/* Info Alert */}
            {cashAmount > 0 && (
              <Alert className={`${formData.payment_type === 'cash' ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}`}>
                <Wallet className={`h-4 w-4 ${formData.payment_type === 'cash' ? 'text-green-600' : 'text-blue-600'}`} />
                <AlertDescription className={formData.payment_type === 'cash' ? 'text-green-800' : 'text-blue-800'}>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Amount to Deposit:</span>
                    <span className={`text-xl font-bold ${formData.payment_type === 'cash' ? 'text-green-600' : 'text-blue-600'}`}>
                      {formatCurrency(cashAmount)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {formData.payment_type === 'cash' 
                      ? 'Will be added to Secondary Wallet → Cash in Hand. Increases Store Balance.'
                      : `Will be added to Secondary Wallet → Online Money (${formData.payment_mode?.replace('online_', '').toUpperCase() || 'Bank'}). Increases Store Balance.`
                    }
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
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 h-11 border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            loading ||
            !selectedPlayerId ||
            (depositType === 'chips' 
              ? (totalValue === 0 || totalChipCount === 0) 
              : cashAmount <= 0 || 
                !formData.payment_type || 
                (formData.payment_type === 'online' && (!formData.payment_mode || !formData.screenshot))
            )
          }
          className={`flex-1 h-11 disabled:bg-gray-400 disabled:cursor-not-allowed ${
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