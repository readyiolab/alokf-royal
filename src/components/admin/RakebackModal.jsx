// components/admin/RakebackModal.jsx
// Rakeback - Give chips to player as reward

import React, { useState, useEffect } from 'react';
import { X, Gift, Coins, User, Search, CheckCircle, ChevronsUpDown, Check, Loader2, Clock, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { ScrollArea } from '../ui/scroll-area';
import rakebackService from '../../services/rakeback.service';
import { usePlayerSearch } from '../../hooks/usePlayerSearch';
import api from '../../services/api.service';

const RakebackModal = ({ isOpen, onClose, onSuccess, sessionId }) => {

  const {
    searchQuery,
    setSearchQuery,
    searching: searchingPlayers,
    filteredPlayers,
    loadAllPlayers,
    searchPlayers,
    selectPlayer
  } = usePlayerSearch();


  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [rakebackTypes, setRakebackTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [amount, setAmount] = useState('');
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
  const [currentHours, setCurrentHours] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [open, setOpen] = useState(false);

  // Helper to get token
  const getToken = () => localStorage.getItem('auth_token');

useEffect(() => {
  if (isOpen) {
    fetchRakebackTypes();
    const token = getToken();
    if (token) {
      loadAllPlayers(token, { reuseExisting: true }); // ✅ Use hook's method
    }
  }
}, [isOpen]);

const fetchRakebackTypes = async () => {
    try {
      const response = await rakebackService.getRakebackTypes();
      setRakebackTypes(response.data || response || [
        { type_code: '8hrs_week', type_label: 'Completed 8hrs in a week', default_amount: 3500 },
        { type_code: '7hrs_week', type_label: 'Completed 7hrs in a week', default_amount: 5000 },
        { type_code: 'custom', type_label: 'Custom Amount', default_amount: 0 },
        { type_code: 'other', type_label: 'Other', default_amount: 0 }
      ]);
    } catch (err) {
      console.error('Error fetching rakeback types:', err);
    }
  };

 const handleSearchChange = (value) => {
    setSearchQuery(value);
    const token = getToken();
    if (token && value.trim()) {
      searchPlayers(token, value);
    } else if (token) {
      loadAllPlayers(token, { reuseExisting: true });
    }
  };

  // ✅ Handle player selection
  const handleSelectPlayer = (player) => {
    selectPlayer(player);
    setSelectedPlayer(player);
    setOpen(false);
  };


  

  const calculateChipValue = () => {
    return (
      (chipBreakdown.chips_100 || 0) * 100 +
      (chipBreakdown.chips_500 || 0) * 500 +
      (chipBreakdown.chips_5000 || 0) * 5000 +
      (chipBreakdown.chips_10000 || 0) * 10000
    );
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    if (type.default_amount > 0) {
      setAmount(type.default_amount.toString());
      setCustomAmount('');
      setCurrentHours('');
    } else {
      // For "Others" type, reset amount
      setAmount('');
    }
  };

  const handleChipChange = (denomination, value) => {
    setChipBreakdown(prev => ({
      ...prev,
      [denomination]: parseInt(value) || 0
    }));
  };

  const handleSubmit = async () => {
    if (!selectedPlayer) {
      setError('Please select a player');
      return;
    }

    if (!selectedType) {
      setError('Please select a rakeback type');
      return;
    }

    const chipValue = calculateChipValue();
    if (chipValue <= 0) {
      setError('Please enter chips to give');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Build notes with hours info for "Others" type
      let finalNotes = notes;
      if (selectedType.type_code === 'other' && currentHours) {
        finalNotes = `Hours played: ${currentHours}${notes ? ` | ${notes}` : ''}`;
      }

      const response = await rakebackService.processRakeback({
        player_id: selectedPlayer.player_id,
        rakeback_type: selectedType.type_code,
        rakeback_type_label: selectedType.type_code === 'other' && currentHours 
          ? `Custom (${currentHours} hrs)` 
          : selectedType.type_label,
        amount: chipValue,
        chip_breakdown: chipBreakdown,
        notes: finalNotes,
        current_hours: currentHours || null
      });

      setSuccess(response.message || 'Rakeback processed successfully');
      
      setTimeout(() => {
        onSuccess && onSuccess(response);
        resetForm();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process rakeback');
    } finally {
      setLoading(false);
    }
  };

const resetForm = () => {
  setSelectedPlayer(null);
  setSelectedType(null);
  setAmount('');
  setChipBreakdown({ chips_100: 0, chips_500: 0, chips_5000: 0, chips_10000: 0 });
  setNotes('');
  setSearchQuery(''); // ✅ Changed from setSearchTerm
  setError('');
  setSuccess('');
  setCurrentHours('');
  setCustomAmount('');
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
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Rake Back</CardTitle>
              <p className="text-sm text-emerald-100 mt-1">Give chips to player as reward</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Player Selection with Command */}
          {/* Player Selection with Command */}
<div className="space-y-3">
  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
    <User className="w-4 h-4" />
    Select Player *
  </Label>
  
  <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between h-14 text-left font-normal bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300"
      >
        {selectedPlayer ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold">
              {selectedPlayer.player_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{selectedPlayer.player_name}</p>
              <p className="text-xs text-gray-500">{selectedPlayer.player_code}</p>
            </div>
          </div>
        ) : (
          <span className="text-gray-400 flex items-center gap-2">
            <Search className="w-4 h-4" />
            Click to search player...
          </span>
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-[400px] p-0" align="start">
      <Command shouldFilter={false}>
        <CommandInput 
          placeholder="Search by name, code, or phone..." 
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
                    <p className="text-sm text-gray-500">No player found</p>
                  </div>
                </CommandEmpty>
              )}
              
              {filteredPlayers?.length > 0 && (
                <CommandGroup heading="Select Player">
                  <ScrollArea className="h-[280px]">
                    {filteredPlayers.map((player) => (
                      <CommandItem
                        key={player.player_id}
                        value={player.player_name}
                        onSelect={() => handleSelectPlayer(player)}
                        className="cursor-pointer py-3 px-3 hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                            {player.player_name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{player.player_name}</p>
                            <p className="text-xs text-gray-500">
                              {player.player_code} • {player.phone_number || 'No phone'}
                            </p>
                          </div>
                          {selectedPlayer?.player_id === player.player_id && (
                            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </ScrollArea>
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</div>

          {/* Rakeback Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Select Rakeback Type *
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {rakebackTypes.map((type) => (
                <div
                  key={type.type_code}
                  onClick={() => handleTypeSelect(type)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedType?.type_code === type.type_code
                      ? 'border-emerald-500 bg-emerald-50 shadow-md'
                      : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-semibold text-gray-900">{type.type_label}</p>
                  {type.default_amount > 0 && (
                    <p className="text-xl font-black text-emerald-600 mt-1">
                      {formatCurrency(type.default_amount)}
                    </p>
                  )}
                  {selectedType?.type_code === type.type_code && (
                    <Check className="w-5 h-5 text-emerald-600 mt-2" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Others - Custom Hours and Amount */}
          {selectedType?.type_code === 'other' && (
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <CardContent className="pt-5 pb-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Current Hours
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={currentHours}
                      onChange={(e) => setCurrentHours(e.target.value)}
                      className="h-12 text-lg font-bold text-center border-2 border-amber-200 focus:border-amber-400 bg-white"
                      placeholder="e.g., 6"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Amount (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setAmount(e.target.value);
                      }}
                      className="h-12 text-lg font-bold text-center border-2 border-amber-200 focus:border-amber-400 bg-white"
                      placeholder="Enter amount"
                    />
                  </div>
                </div>
                {currentHours && customAmount && (
                  <Alert className="border-amber-300 bg-amber-100">
                    <AlertDescription className="text-amber-800 font-medium">
                      Giving <strong>{formatCurrency(parseFloat(customAmount) || 0)}</strong> rakeback for <strong>{currentHours} hours</strong> played
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Chip Breakdown */}
          {selectedType && (
            <Card className="bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200 shadow-md">
              <CardContent className="pt-5 pb-4">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                  <Coins className="w-4 h-4" />
                  Chips to Give *
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
                
                {/* Total Display */}
                <div className="mt-5 pt-4 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Total Value</span>
                  <span className={`text-3xl font-black ${calculateChipValue() > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {formatCurrency(calculateChipValue())}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

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
              disabled={loading || !selectedPlayer || !selectedType || calculateChipValue() <= 0}
              className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  Give Rakeback {calculateChipValue() > 0 && `• ${formatCurrency(calculateChipValue())}`}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RakebackModal;
