import { useState, useEffect } from 'react';
import { AlertCircle, Loader2, CheckCircle, Search, User, ChevronsUpDown, Check, Wallet, CreditCard, Banknote, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePlayerSearch } from '../../hooks/usePlayerSearch';
import transactionService from '../../services/transaction.service';
import creditService from '../../services/credit.service';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';

export const SettleCreditForm = ({ creditData = null, onSuccess = null }) => {
  const { token } = useAuth();
  
  const [formData, setFormData] = useState({
    player_id: creditData?.player_id || '',
    player_name: creditData?.player_name || '',
    settlement_amount: '',
    settlement_method: 'cash',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(creditData || null);
  const [outstandingCredit, setOutstandingCredit] = useState(0);
  const [loadingCredit, setLoadingCredit] = useState(false);

  const {
    searchQuery,
    setSearchQuery,
    searching: searchingPlayers,
    filteredPlayers,
    searchPlayers,
    loadAllPlayers,
    selectPlayer
  } = usePlayerSearch();

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

  // Initialize with creditData if provided
  useEffect(() => {
    if (creditData) {
      setSelectedPlayer(creditData);
      setFormData(prev => ({
        ...prev,
        player_id: creditData.player_id,
        player_name: creditData.player_name
      }));
      setOutstandingCredit(parseFloat(creditData.credit_outstanding || creditData.outstanding_credit || 0));
    }
  }, [creditData]);

  // Fetch outstanding credit when player is selected
  const fetchOutstandingCredit = async (playerId) => {
    setLoadingCredit(true);
    try {
      const result = await creditService.getPlayerCreditStatus(playerId);
      const totalOutstanding = parseFloat(result.total_outstanding || 0);
      setOutstandingCredit(totalOutstanding);
    } catch (err) {
      console.error('Error fetching credit:', err);
      setOutstandingCredit(0);
    } finally {
      setLoadingCredit(false);
    }
  };

  const settlementAmount = parseFloat(formData.settlement_amount) || 0;
  const remainingAmount = outstandingCredit - settlementAmount;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSelectPlayer = (player) => {
    selectPlayer(player);
    setSelectedPlayer(player);
    setFormData(prev => ({
      ...prev,
      player_id: player.player_id,
      player_name: player.player_name
    }));
    setOpen(false);
    fetchOutstandingCredit(player.player_id);
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.player_id) {
      setError('Please select a player');
      return;
    }

    if (!formData.settlement_amount || settlementAmount <= 0) {
      setError('Please enter a valid settlement amount');
      return;
    }

    if (settlementAmount > outstandingCredit) {
      setError(`Settlement amount cannot exceed outstanding amount (₹${outstandingCredit.toFixed(2)})`);
      return;
    }

    if (!token) {
      setError('Authentication required. Please login.');
      return;
    }

    try {
      setLoading(true);

      // Call transaction service to settle credit
      const result = await transactionService.settleCredit(token, {
        player_id: formData.player_id,
        settle_amount: settlementAmount,
        payment_mode: formData.settlement_method,
        notes: formData.notes || `Credit settlement for ${formData.player_name}`
      });

      setSuccess(result.message || `✅ Credit settled successfully! Remaining balance: ₹${result.remaining_credit?.toFixed(2) || 0}`);

      // Update outstanding credit
      setOutstandingCredit(result.remaining_credit || 0);

      // Reset form
      setFormData(prev => ({
        ...prev,
        settlement_amount: '',
        notes: ''
      }));

      if (onSuccess) {
        setTimeout(() => onSuccess({
          playerId: formData.player_id,
          playerName: formData.player_name,
          settledAmount: settlementAmount,
          remainingAmount: result.remaining_credit,
          fullySettled: result.fully_settled
        }), 1500);
      }
    } catch (err) {
      console.error('Settlement error:', err);
      setError(err.message || 'Failed to settle credit');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
      {/* Header Section */}
      <div className="space-y-2 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <Banknote className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Settle Cash</h2>
            <p className="text-sm text-gray-500">Pay credit with cash</p>
          </div>
        </div>
      </div>

      {/* Player Search with Command */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-900">Player</Label>
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-12 text-left font-normal border-orange-300 hover:bg-gray-50"
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
                                {parseFloat(player.outstanding_credit || 0) > 0 && (
                                  <span className="text-sm font-bold text-orange-600 flex-shrink-0">
                                    {formatCurrency(player.outstanding_credit)}
                                  </span>
                                )}
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

      {/* Player Credit Info */}
      {selectedPlayer && (
        <Card className={`border-2 ${outstandingCredit > 0 ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200' : 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'}`}>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                  {selectedPlayer.player_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">{selectedPlayer.player_name}</p>
                  <p className="text-sm text-gray-600">{selectedPlayer.player_code || `ID: ${selectedPlayer.player_id}`}</p>
                </div>
              </div>
              <div className="text-right">
                {loadingCredit ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                ) : (
                  <>
                    <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                      <CreditCard className="w-3 h-3" />
                      Outstanding Credit
                    </p>
                    <p className={`text-3xl font-black ${outstandingCredit > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                      {formatCurrency(outstandingCredit)}
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Credit Warning */}
      {selectedPlayer && outstandingCredit === 0 && !loadingCredit && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
          <AlertDescription className="text-emerald-700 font-medium">
            This player has no outstanding credit.
          </AlertDescription>
        </Alert>
      )}

      {/* Settlement Amount Section - Only show if there's credit */}
      {outstandingCredit > 0 && (
        <>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-900">Settlement Amount (₹)</Label>
            <Input
              name="settlement_amount"
              type="number"
              min="0"
              step="100"
              value={formData.settlement_amount}
              onChange={handleChange}
              placeholder="Enter settlement amount"
              className="h-12 text-lg"
            />
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Max: {formatCurrency(outstandingCredit)}</span>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => setFormData(prev => ({ ...prev, settlement_amount: outstandingCredit.toString() }))}
                className="text-emerald-600 hover:text-emerald-700 font-semibold p-0 h-auto"
              >
                Settle Full Amount
              </Button>
            </div>
          </div>

          {/* Settlement Preview */}
          {settlementAmount > 0 && (
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold text-gray-900">Settlement Breakdown</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Outstanding Credit</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(outstandingCredit)}</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-600">
                  <span className="flex items-center gap-1">
                    <Banknote className="w-3 h-3" />
                    Settlement Amount
                  </span>
                  <span className="font-semibold">-{formatCurrency(settlementAmount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-bold text-gray-800">Remaining Balance</span>
                  <span className={`text-lg font-bold ${remainingAmount > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                    {formatCurrency(remainingAmount)}
                  </span>
                </div>
                {remainingAmount === 0 && (
                  <Alert className="border-emerald-300 bg-emerald-100 mt-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <AlertDescription className="text-emerald-700 font-semibold">
                      Credit will be fully settled!
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Settlement Method Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-900">Settlement Method</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'cash', label: 'Cash', icon: Banknote },
                { value: 'online_sbi', label: 'SBI Online', icon: Building2 },
                { value: 'online_hdfc', label: 'HDFC Online', icon: Building2 },
                { value: 'online_icici', label: 'ICICI Online', icon: Building2 },
                { value: 'online_other', label: 'Other Online', icon: CreditCard }
              ].map((method) => {
                const Icon = method.icon;
                return (
                  <label 
                    key={method.value} 
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.settlement_method === method.value 
                        ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                        : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="settlement_method"
                      value={method.value}
                      checked={formData.settlement_method === method.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <Icon className={`w-4 h-4 ${formData.settlement_method === method.value ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${formData.settlement_method === method.value ? 'text-emerald-700' : 'text-gray-600'}`}>
                      {method.label}
                    </span>
                    {formData.settlement_method === method.value && (
                      <Check className="w-4 h-4 text-emerald-600 ml-auto" />
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-900">
              Note (optional)
            </Label>
            <Input
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add a note..."
              className="h-11"
            />
          </div>
        </>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {success && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      {outstandingCredit > 0 && (
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                settlement_amount: '',
                notes: ''
              }));
              setError(null);
              setSuccess(null);
            }}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !token || settlementAmount <= 0}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Settle Cash ${settlementAmount > 0 ? `• ${formatCurrency(settlementAmount)}` : ''}`
            )}
          </Button>
        </div>
      )}
    </form>
  );
};

export default SettleCreditForm;