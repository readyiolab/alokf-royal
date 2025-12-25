import { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Check, Coins, CreditCard, TrendingUp, Wallet, User, Search, ChevronsUpDown, CheckCircle } from 'lucide-react';
import creditService from '../../services/credit.service';
import { useAuth } from '../../contexts/AuthContext';
import { usePlayerSearch } from '../../hooks/usePlayerSearch';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';

export const CreditRequestForm = ({ 
  onSuccess, 
  cashierCreditLimit = 50000,
  remainingCreditLimit = 50000,
  totalCreditIssued = 0
}) => {
  const { token } = useAuth();
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerCreditStatus, setPlayerCreditStatus] = useState(null);
  const [loadingCreditStatus, setLoadingCreditStatus] = useState(false);
  const [creditAmount, setCreditAmount] = useState('100000'); // Default: ₹100,000
  const [notes, setNotes] = useState('');
  const [open, setOpen] = useState(false);
  
  // Player search
  const {
    searchQuery,
    setSearchQuery,
    searching: searchingPlayers,
    filteredPlayers,
    searchPlayers,
    loadAllPlayers
  } = usePlayerSearch();
  
  // ✅ NEW: Chip breakdown tracking
  const [chipBreakdown, setChipBreakdown] = useState({
    chips_100: 0,
    chips_500: 0,
    chips_5000: 0,
    chips_10000: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load all players on mount
  useEffect(() => {
    if (token) {
      loadAllPlayers(token, { reuseExisting: true });
    }
  }, [token]);

  // Handle search input
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (!value.trim()) {
      if (token) loadAllPlayers(token, { reuseExisting: true });
    } else if (token) {
      searchPlayers(token, value);
    }
  };

  const handleSelectPlayer = (player) => {
    setSelectedPlayer(player);
    setOpen(false);
    setError(null);
  };

  // ✅ Fetch player credit status when player is selected
  useEffect(() => {
    if (selectedPlayer?.player_id) {
      fetchPlayerCreditStatus(selectedPlayer.player_id);
    } else {
      setPlayerCreditStatus(null);
    }
  }, [selectedPlayer?.player_id]);

  const fetchPlayerCreditStatus = async (playerId) => {
    try {
      setLoadingCreditStatus(true);
      const response = await creditService.getPlayerCreditStatus(playerId);
      setPlayerCreditStatus(response.data || response);
    } catch (err) {
      console.error('Failed to fetch credit status:', err);
      setPlayerCreditStatus(null);
    } finally {
      setLoadingCreditStatus(false);
    }
  };

  const handlePlayerSelect = (player) => {
    setSelectedPlayer(player);
    setError(null);
  };

  const handleAmountChange = (e) => {
    setCreditAmount(e.target.value);
    setError(null);
  };

  // ✅ Handle individual chip input
  const handleChipChange = (denomination, value) => {
    const numValue = parseInt(value) || 0;
    setChipBreakdown(prev => ({
      ...prev,
      [denomination]: numValue
    }));
  };

  // ✅ Calculate total from chip breakdown
  const calculateTotalFromChips = () => {
    return (
      (chipBreakdown.chips_10000 * 10000) +
      (chipBreakdown.chips_5000 * 5000) +
      (chipBreakdown.chips_500 * 500) +
      (chipBreakdown.chips_100 * 100)
    );
  };

  const totalFromChips = calculateTotalFromChips();

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    // Validation
    if (!selectedPlayer) {
      setError('Please select a player');
      return;
    }

    // ✅ NEW: Validate chip breakdown is selected
    if (totalFromChips <= 0) {
      setError('Please select at least some chips for the player');
      return;
    }

    // ✅ NEW: Validate chip total matches amount
    const amount = parseFloat(creditAmount);
    if (totalFromChips !== amount) {
      setError(`Chip total (₹${totalFromChips.toLocaleString('en-IN')}) doesn't match credit amount (₹${amount.toLocaleString('en-IN')}). Please adjust chips.`);
      return;
    }

    // ✅ Allow submission even if exceeds limit - admin will approve
    // If exceeds, it goes to admin queue automatically

    try {
      setLoading(true);
      
      const requestData = {
        player_id: selectedPlayer.player_id,
        player_name: selectedPlayer.player_name,
        phone_number: selectedPlayer.phone_number,
        requested_amount: creditAmount,
        credit_type: 'mixed_chips',
        chip_breakdown: chipBreakdown,
        notes: notes
      };

      const result = await creditService.createCreditRequest(requestData);
      
      // ✅ Better success message
      const chipBreakdownText = `${chipBreakdown.chips_10000}×₹10K, ${chipBreakdown.chips_5000}×₹5K, ${chipBreakdown.chips_500}×₹500, ${chipBreakdown.chips_100}×₹100`;
      setSuccess(`✅ ₹${amount.toLocaleString('en-IN')} mixed chips (${chipBreakdownText}) issued to ${selectedPlayer.player_name}`);
      
      // Reset form
      setSelectedPlayer(null);
      setCreditAmount('100000');
      setNotes('');
      setChipBreakdown({
        chips_100: 0,
        chips_500: 0,
        chips_5000: 0,
        chips_10000: 0
      });

      if (onSuccess) {
        setTimeout(() => onSuccess(result), 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to create credit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full border-0 shadow-2xl rounded-2xl overflow-hidden">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <Coins className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Issue Mixed Chips Credit</h2>
            <p className="text-white/80 text-sm">Give credit to a player in mixed chips</p>
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Player Search - Premium Popover+Command */}
        <div className="space-y-2">
          <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-500" />
            Select Player
          </Label>
          
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between h-14 text-left font-normal border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all rounded-xl"
              >
                {selectedPlayer ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                      {selectedPlayer.player_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{selectedPlayer.player_name}</p>
                      <p className="text-xs text-gray-500">{selectedPlayer.phone_number}</p>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-500 flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Click to search players...
                  </span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput 
                  placeholder="Search by name or phone..." 
                  value={searchQuery}
                  onValueChange={handleSearchChange}
                />
                <CommandList>
                  <CommandEmpty>
                    {searchingPlayers ? (
                      <div className="flex items-center justify-center gap-2 py-6">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                        <span className="text-sm text-gray-500">Searching...</span>
                      </div>
                    ) : (
                      <span className="text-gray-500">No players found</span>
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    <ScrollArea className="h-[280px]">
                      {filteredPlayers.map((player) => (
                        <CommandItem
                          key={player.player_id}
                          value={player.player_id.toString()}
                          onSelect={() => handleSelectPlayer(player)}
                          className="cursor-pointer py-3 px-3 hover:bg-indigo-50"
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {player.player_name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{player.player_name}</p>
                              <p className="text-xs text-gray-500">{player.phone_number}</p>
                            </div>
                            {selectedPlayer?.player_id === player.player_id && (
                              <CheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </ScrollArea>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* ✅ Player Credit Status Display */}
        {selectedPlayer && (
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-gray-200 overflow-hidden">
            {loadingCreditStatus ? (
              <div className="p-4 flex items-center justify-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading credit status...</span>
              </div>
            ) : playerCreditStatus ? (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-bold text-gray-900">
                    Credit Status for {selectedPlayer.player_name}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {/* Credit Limit */}
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-1 mb-1">
                      <Wallet className="w-3 h-3 text-purple-500" />
                      <span className="text-xs text-gray-500">Credit Limit</span>
                    </div>
                    <p className="text-lg font-bold text-purple-700">
                      ₹{(playerCreditStatus.credit_limit || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  
                  {/* Outstanding */}
                  <div className="bg-white rounded-lg p-3 border border-red-200">
                    <div className="flex items-center gap-1 mb-1">
                      <AlertCircle className="w-3 h-3 text-red-500" />
                      <span className="text-xs text-gray-500">Outstanding</span>
                    </div>
                    <p className="text-lg font-bold text-red-600">
                      ₹{(playerCreditStatus.total_outstanding || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                  
                  {/* Available */}
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="flex items-center gap-1 mb-1">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-gray-500">Available</span>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      ₹{(playerCreditStatus.available_credit || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Warning if no credit available */}
                {playerCreditStatus.credit_limit === 0 && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700">
                      No credit limit set for this player. Please set a credit limit first.
                    </p>
                  </div>
                )}
                
                {playerCreditStatus.total_outstanding > 0 && playerCreditStatus.available_credit === 0 && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">
                      Player has reached credit limit. Outstanding: ₹{playerCreditStatus.total_outstanding.toLocaleString('en-IN')}. 
                      Please settle outstanding credit first.
                    </p>
                  </div>
                )}

                {playerCreditStatus.available_credit > 0 && playerCreditStatus.available_credit < parseFloat(creditAmount || 0) && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700">
                      Maximum credit available: ₹{playerCreditStatus.available_credit.toLocaleString('en-IN')}. 
                      Reduce credit amount or settle outstanding first.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-sm text-gray-500">
                Unable to load credit status
              </div>
            )}
          </div>
        )}

        {/* Credit Amount Card */}
        <Card className="border-2 border-indigo-100 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border-b border-indigo-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Mixed Chips Credit</h3>
                <p className="text-xs text-gray-500">Enter amount and select chips</p>
              </div>
            </div>
          </div>
          
          <CardContent className="p-4 space-y-4">
            {/* Amount Input */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                Credit Amount (₹) <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min="1000"
                step="1000"
                value={creditAmount}
                onChange={handleAmountChange}
                className="h-14 text-2xl font-bold text-center border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Default: ₹100,000 mixed chips. Edit to any amount needed.
              </p>
            </div>

            {/* Chip Selection Grid */}
            <div className="space-y-3">
              <p className="text-sm font-bold text-gray-700">Select Chips to Give:</p>
              
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
                    ₹{(chipBreakdown.chips_10000 * 10000).toLocaleString('en-IN')}
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
                    ₹{(chipBreakdown.chips_5000 * 5000).toLocaleString('en-IN')}
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
                    ₹{(chipBreakdown.chips_500 * 500).toLocaleString('en-IN')}
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
                    ₹{(chipBreakdown.chips_100 * 100).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Total Chips Selected */}
              <div className={`p-4 rounded-xl border-2 ${
                totalFromChips === parseFloat(creditAmount)
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                  : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-300'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-700">Total Chips Selected:</span>
                  <span className={`text-2xl font-black ${
                    totalFromChips === parseFloat(creditAmount)
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    ₹{totalFromChips.toLocaleString('en-IN')}
                  </span>
                </div>
                {totalFromChips !== parseFloat(creditAmount) && totalFromChips > 0 && (
                  <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Must match ₹{(parseFloat(creditAmount) || 0).toLocaleString('en-IN')}
                  </p>
                )}
                {totalFromChips === parseFloat(creditAmount) && totalFromChips > 0 && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Chip total matches credit amount
                  </p>
                )}
              </div>
            </div>

            {/* Credit Limit Progress */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-gray-600">Credit Limit Status:</span>
                <span className={`text-xs font-bold ${
                  (parseFloat(creditAmount) || 0) <= remainingCreditLimit 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {(parseFloat(creditAmount) || 0) <= remainingCreditLimit 
                    ? '✅ Within Limit' 
                    : '❌ Exceeds Limit'}
                </span>
              </div>
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full transition-all rounded-full ${
                    (parseFloat(creditAmount) || 0) <= remainingCreditLimit ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{
                    width: `${Math.min(100, ((parseFloat(creditAmount) || 0) / remainingCreditLimit) * 100)}%`
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Remaining: <span className="font-bold text-gray-700">₹{remainingCreditLimit.toLocaleString('en-IN')}</span>
              </p>
            </div>

            {selectedPlayer && (
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                <User className="w-4 h-4 text-indigo-500" />
                <span>Issuing to: <span className="font-semibold text-indigo-700">{selectedPlayer.player_name}</span></span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes Section */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">
            Notes <span className="text-gray-400">(Optional)</span>
          </Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="E.g., Player requested this amount, payment method, etc."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none transition-all"
            rows="3"
          />
        </div>

        {/* Error Message */}
        {error && (
          <Alert className="bg-red-50 border-2 border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <AlertDescription className="text-red-700 font-medium ml-2">{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {success && (
          <Alert className="bg-green-50 border-2 border-green-200 rounded-xl">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <AlertDescription className="text-green-700 font-medium ml-2">{success}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={loading || !selectedPlayer || totalFromChips <= 0 || totalFromChips !== parseFloat(creditAmount)}
          className={`w-full h-14 rounded-xl font-bold text-lg transition-all shadow-lg ${
            loading || !selectedPlayer || totalFromChips <= 0 || totalFromChips !== parseFloat(creditAmount)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : totalFromChips > remainingCreditLimit
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-200'
              : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-purple-200'
          }`}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </div>
          ) : totalFromChips > remainingCreditLimit ? (
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Request Approval - ₹{(totalFromChips - remainingCreditLimit).toLocaleString('en-IN')} Over Limit
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5" />
              Issue ₹{totalFromChips.toLocaleString('en-IN')} Mixed Chips Credit
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CreditRequestForm;