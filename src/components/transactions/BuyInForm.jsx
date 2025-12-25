import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePlayerSearch } from '../../hooks/usePlayerSearch';
import transactionService from '../../services/transaction.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList,
  CommandSeparator
} from '@/components/ui/command';
import { 
  CheckCircle, 
  Loader2, 
  Search, 
  AlertCircle, 
  Wallet, 
  User, 
  UserPlus, 
  Phone, 
  ChevronsUpDown,
  Check,
  Coins,
  Sparkles,
  Banknote
} from 'lucide-react';

const BuyInForm = ({ onSuccess, onCancel }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [storedBalance, setStoredBalance] = useState(0);
  const [cashDeposits, setCashDeposits] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [useStoredBalance, setUseStoredBalance] = useState(false);
  const [isNewPlayer, setIsNewPlayer] = useState(false);
  
  const {
    searchQuery,
    setSearchQuery,
    searching: searchingPlayers,
    filteredPlayers,
    loadAllPlayers,
    searchPlayers,
    selectPlayer
  } = usePlayerSearch();

  const [formData, setFormData] = useState({
    player_name: '',
    phone_number: '',
    payment_mode: 'cash',
    notes: '',
    chips_100: '',
    chips_500: '',
    chips_5000: '',
    chips_10000: ''
  });

  // Load players on mount
  useEffect(() => {
    if (token) {
      loadAllPlayers(token, { reuseExisting: true });
    }
  }, [token]);

  // Fetch stored balance when player is selected
  useEffect(() => {
    if (selectedPlayerId && token) {
      fetchStoredBalance(selectedPlayerId);
      fetchCashDeposits(selectedPlayerId);
    } else {
      setStoredBalance(0);
      setCashDeposits(0);
      setUseStoredBalance(false);
    }
  }, [selectedPlayerId, token]);

  const fetchStoredBalance = async (playerId) => {
    setLoadingBalance(true);
    try {
      const result = await transactionService.getPlayerStoredBalance(token, playerId);
      setStoredBalance(parseFloat(result.stored_chips || 0));
    } catch (err) {
      console.error('Error fetching stored balance:', err);
      setStoredBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  };

  const fetchCashDeposits = async (playerId) => {
    try {
      // This would need to be implemented in the backend
      const result = await transactionService.getPlayerCashDeposits(token, playerId);
      setCashDeposits(parseFloat(result.cash_deposits || 0));
    } catch (err) {
      console.error('Error fetching cash deposits:', err);
      setCashDeposits(0);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Calculate total from manual chip inputs
  const calculateTotalFromChips = () => {
    return (
      (parseInt(formData.chips_100) || 0) * 100 +
      (parseInt(formData.chips_500) || 0) * 500 +
      (parseInt(formData.chips_5000) || 0) * 5000 +
      (parseInt(formData.chips_10000) || 0) * 10000
    );
  };

  // Get chip breakdown object for API
  const getChipBreakdown = () => ({
    chips_100: parseInt(formData.chips_100) || 0,
    chips_500: parseInt(formData.chips_500) || 0,
    chips_5000: parseInt(formData.chips_5000) || 0,
    chips_10000: parseInt(formData.chips_10000) || 0
  });

  const totalAmount = calculateTotalFromChips();

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSelectPlayer = (player) => {
    selectPlayer(player);
    setSelectedPlayerId(player.player_id);
    setFormData(prev => ({
      ...prev,
      player_name: player.player_name,
      phone_number: player.phone_number || ''
    }));
    setSearchQuery(player.player_name);
    setOpen(false);
    setIsNewPlayer(false);
  };

  const handleAddNewPlayer = () => {
    setIsNewPlayer(true);
    setSelectedPlayerId(null);
    setOpen(false);
    // Pre-fill the name from search query
    setFormData(prev => ({
      ...prev,
      player_name: searchQuery,
      phone_number: ''
    }));
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (token && value.trim()) {
      searchPlayers(token, value);
    } else if (token) {
      loadAllPlayers(token, { reuseExisting: true });
    }
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

    if (useStoredBalance) {
      if (totalAmount <= 0) {
        setError('Enter chips to redeem from stored balance');
        return;
      }
      if (totalAmount > storedBalance) {
        setError(`Insufficient stored balance. Available: ${formatCurrency(storedBalance)}`);
        return;
      }
    } else {
      if (totalAmount <= 0) {
        setError('Enter at least one chip denomination');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      if (useStoredBalance) {
        await transactionService.redeemStoredChips(token, {
          player_id: selectedPlayerId,
          player_name: formData.player_name.trim(),
          phone_number: formData.phone_number.trim(),
          amount: totalAmount,
          chip_breakdown: getChipBreakdown(),
          notes: formData.notes.trim() || 'Redeemed from stored balance'
        });
      } else {
        await transactionService.createBuyIn(token, {
          player_name: formData.player_name.trim(),
          phone_number: formData.phone_number.trim(),
          amount: totalAmount,
          chips_amount: totalAmount,
          payment_mode: formData.payment_mode,
          chip_breakdown: getChipBreakdown(),
          notes: formData.notes.trim() || null
        });
      }

      setSuccess(true);
      setTimeout(() => onSuccess(), 1500);
    } catch (err) {
      setError(err.message || 'Failed to process transaction');
    } finally {
      setLoading(false);
    }
  };

  // Success Screen
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-400 blur-3xl opacity-20 animate-pulse"></div>
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-6 shadow-2xl">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
        <p className="text-gray-500 mb-6">Buy-In Transaction Recorded</p>
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-0 shadow-xl w-full max-w-sm">
          <CardContent className="p-6 text-center">
            <p className="text-lg font-bold text-gray-800">{formData.player_name}</p>
            <p className="text-4xl font-black text-emerald-600 mt-3">
              {formatCurrency(totalAmount)}
            </p>
            <Badge className="mt-3" variant="secondary">
              {useStoredBalance ? 'Redeemed from stored' : formData.payment_mode.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step 1: Select Player */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-black flex items-center gap-2">
          <User className="w-4 h-4" />
          Select Player *
        </Label>
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-14 text-left font-normal  hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300"
            >
              {selectedPlayerId && formData.player_name ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black text-sm font-bold">
                    {formData.player_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{formData.player_name}</p>
                    {formData.phone_number && (
                      <p className="text-xs text-white">{formData.phone_number}</p>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-gray-400 flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Click to search or select a player...
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput 
                placeholder="Search players by name or code..." 
                value={searchQuery}
                onValueChange={handleSearchChange}
              />
              <CommandList>
                {searchingPlayers ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Searching...</span>
                  </div>
                ) : (
                  <>
                    {filteredPlayers?.length === 0 && searchQuery && (
                      <CommandEmpty>
                        <div className="flex flex-col items-center py-6">
                          <User className="w-12 h-12 text-gray-300 mb-3" />
                          <p className="text-sm text-gray-500 mb-4">No player found with "{searchQuery}"</p>
                          <Button
                            type="button"
                            onClick={handleAddNewPlayer}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add as New Player
                          </Button>
                        </div>
                      </CommandEmpty>
                    )}
                    
                    {filteredPlayers?.length > 0 && (
                      <CommandGroup heading="Select a Player">
                        <ScrollArea className="h-[280px]">
                          {filteredPlayers.map((player) => (
                            <CommandItem
                              key={player.player_id}
                              value={player.player_name}
                              onSelect={() => handleSelectPlayer(player)}
                              className="cursor-pointer py-3 px-3 hover:bg-gray-100"
                            >
                              <div className="flex items-center gap-3 w-full">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black font-bold flex-shrink-0">
                                  {player.player_name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-white truncate">
                                    {player.player_name}
                                  </p>
                                  <p className="text-xs text-white">
                                    {player.player_code} • {player.phone_number || 'No phone'}
                                  </p>
                                </div>
                                {selectedPlayerId === player.player_id && (
                                  <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    )}
                    
                    {/* Add New Player Option - Always visible */}
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={handleAddNewPlayer}
                        className="cursor-pointer py-3 text-blue-600 hover:bg-blue-50"
                      >
                        <UserPlus className="w-5 h-5 mr-2" />
                        <span className="font-medium">Add New Player</span>
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* New Player Form (shown when adding new player) */}
      {isNewPlayer && !selectedPlayerId && (
        <Card className="border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <UserPlus className="w-5 h-5" />
              <span className="font-semibold">New Player Details</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-black">Player Name *</Label>
                <Input
                  placeholder="Enter player name"
                  value={formData.player_name}
                  onChange={(e) => handleChange('player_name', e.target.value)}
                  className="h-11 "
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-black">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <Input
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={formData.phone_number}
                    onChange={(e) => handleChange('phone_number', e.target.value.replace(/\D/g, ''))}
                    className="h-11 pl-10 "
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phone Number (for existing player if empty) */}
      {selectedPlayerId && !formData.phone_number && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-black flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Phone Number *
          </Label>
          <Input
            type="tel"
            placeholder="9876543210"
            maxLength={10}
            value={formData.phone_number}
            onChange={(e) => handleChange('phone_number', e.target.value.replace(/\D/g, ''))}
            className="h-11"
          />
        </div>
      )}

      {/* Stored Balance & Cash Deposits Alert */}
      {selectedPlayerId && loadingBalance && (
        <div className="flex items-center gap-2 text-gray-500 py-3 px-4 bg-gray-50 rounded-lg">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Checking stored balance...</span>
        </div>
      )}
      
      {selectedPlayerId && !loadingBalance && (storedBalance > 0 || cashDeposits > 0) && (
        <div className="space-y-3">
          {/* Stored Chips Balance */}
          {storedBalance > 0 && (
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 overflow-hidden shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-amber-700 font-medium">Stored Chips Available</p>
                      <p className="text-2xl font-black text-amber-900">{formatCurrency(storedBalance)}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant={useStoredBalance ? "default" : "outline"}
                    onClick={() => setUseStoredBalance(!useStoredBalance)}
                    className={useStoredBalance 
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-0 shadow-lg" 
                      : "border-amber-300 text-amber-700 hover:bg-amber-100"
                    }
                  >
                    {useStoredBalance ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Using Stored
                      </>
                    ) : (
                      'Use Stored Chips'
                    )}
                  </Button>
                </div>
                {useStoredBalance && (
                  <p className="text-xs text-amber-600 mt-3 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Chips will be deducted from stored balance - no payment needed!
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Cash Deposits Balance */}
          {cashDeposits > 0 && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 overflow-hidden shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
                    <Banknote className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Cash Deposits Available</p>
                    <p className="text-2xl font-black text-blue-900">{formatCurrency(cashDeposits)}</p>
                    <p className="text-xs text-blue-600">Available in Secondary Wallet</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Payment Mode - Only for cash buy-in */}
      {!useStoredBalance && (selectedPlayerId || isNewPlayer) && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-black">Payment Mode *</Label>
          <Select value={formData.payment_mode} onValueChange={(v) => handleChange('payment_mode', v)}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">💵 Cash</SelectItem>
              <SelectItem value="online_sbi">🏦 SBI Online</SelectItem>
              <SelectItem value="online_hdfc">🏦 HDFC Online</SelectItem>
              <SelectItem value="online_icici">🏦 ICICI Online</SelectItem>
              <SelectItem value="online_other">🌐 Other Online</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Chip Inputs */}
      {(selectedPlayerId || isNewPlayer) && (
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-md">
          <CardContent className="pt-5 pb-4">
            <Label className="text-sm font-semibold text-black flex items-center gap-2 mb-4">
              <Coins className="w-4 h-4" />
              Chips to Give *
            </Label>
            
            <div className="grid grid-cols-4 gap-3">
              {[
                { key: 'chips_100', value: 100, colorClass: 'text-red-600 border-red-200 focus:border-red-400', label: '₹100' },
                { key: 'chips_500', value: 500, colorClass: 'text-green-600 border-green-200 focus:border-green-400', label: '₹500' },
                { key: 'chips_5000', value: 5000, colorClass: 'text-blue-600 border-blue-200 focus:border-blue-400', label: '₹5K' },
                { key: 'chips_10000', value: 10000, colorClass: 'text-purple-600 border-purple-200 focus:border-purple-400', label: '₹10K' }
              ].map(chip => (
                <div key={chip.key} className="text-center">
                  <div className={`text-xs font-bold mb-2 ${chip.colorClass.split(' ')[0]}`}>
                    {chip.label}
                  </div>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData[chip.key]}
                    onChange={(e) => handleChange(chip.key, e.target.value)}
                    className={`text-center text-lg font-bold h-12  border-2 ${chip.colorClass}`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency((parseInt(formData[chip.key]) || 0) * chip.value)}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Total Display */}
            <div className="mt-5 pt-4 border-t border-slate-200 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Total Amount</span>
              <span className={`text-3xl font-black ${totalAmount > 0 ? 'text-black' : 'text-gray-400'}`}>
                {formatCurrency(totalAmount)}
              </span>
            </div>
            
            {useStoredBalance && totalAmount > 0 && storedBalance > 0 && (
              <div className="flex justify-between items-center mt-2 text-sm">
                <span className="text-amber-600">Remaining stored balance</span>
                <span className={`font-semibold ${storedBalance - totalAmount >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                  {formatCurrency(storedBalance - totalAmount)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {(selectedPlayerId || isNewPlayer) && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-black">Notes (Optional)</Label>
          <Input
            placeholder="Any additional notes..."
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="h-11"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={loading || totalAmount <= 0 || (!selectedPlayerId && !isNewPlayer)}
          className={`flex-1 h-12 text-base font-semibold transition-all shadow-lg disabled:shadow-none ${
            useStoredBalance 
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' 
              : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
          }`}
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {useStoredBalance 
            ? `Redeem ${formatCurrency(totalAmount)}` 
            : `Buy-In ${formatCurrency(totalAmount)}`
          }
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          disabled={loading}
          className="h-12 px-6"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default BuyInForm;