import { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Coins, CreditCard, TrendingUp, Wallet, User, Search, ChevronsUpDown, CheckCircle, Plus, Edit2, X } from 'lucide-react';
import creditService from '../../services/credit.service';
import playerService from '../../services/player.service';
import { useAuth } from '../../contexts/AuthContext';
import { usePlayerSearch } from '../../hooks/usePlayerSearch';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export const CreditRequestForm = ({ 
  onSuccess, 
  cashierCreditLimit = 50000,
  remainingCreditLimit = 50000,
  totalCreditIssued = 0
}) => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerCreditStatus, setPlayerCreditStatus] = useState(null);
  const [loadingCreditStatus, setLoadingCreditStatus] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [open, setOpen] = useState(false);
  
  // ✅ NEW: Add player form state
  const [showAddPlayerForm, setShowAddPlayerForm] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPhone, setNewPlayerPhone] = useState('');
  const [creatingPlayer, setCreatingPlayer] = useState(false);
  
  // ✅ NEW: Edit credit limit state
  const [editingCreditLimit, setEditingCreditLimit] = useState(false);
  const [creditLimitInput, setCreditLimitInput] = useState('');
  const [savingCreditLimit, setSavingCreditLimit] = useState(false);
  
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
    chips_1000: 0,
    chips_5000: 0,
    chips_10000: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [phoneError, setPhoneError] = useState(null); // ✅ Phone number specific error

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
    setShowAddPlayerForm(false);
    setNewPlayerName('');
    setNewPlayerPhone('');
  };
  
  // ✅ NEW: Handle creating new player
  const handleCreatePlayer = async () => {
    if (!newPlayerName.trim()) {
      setError('Player name is required');
      return;
    }
    
    // Clear previous errors
    setError(null);
    setPhoneError(null);
    
    // Validate phone number if provided
    if (newPlayerPhone.trim() && (newPlayerPhone.trim().length < 10 || newPlayerPhone.trim().length > 10)) {
      setPhoneError('Phone number must be exactly 10 digits');
      return;
    }
    
    setCreatingPlayer(true);
    
    try {
      const newPlayer = await playerService.createPlayer({
        player_name: newPlayerName.trim(),
        phone_number: newPlayerPhone.trim() || null,
        credit_limit: creditLimitInput ? parseFloat(creditLimitInput) : 0
      });
      
      // Select the newly created player
      const playerData = newPlayer.data || newPlayer;
      setSelectedPlayer({
        player_id: playerData.player_id,
        player_name: playerData.player_name,
        player_code: playerData.player_code,
        phone_number: playerData.phone_number
      });
      
      // Fetch credit status for new player
      await fetchPlayerCreditStatus(playerData.player_id);
      
      // Reset form
      setShowAddPlayerForm(false);
      setNewPlayerName('');
      setNewPlayerPhone('');
      setCreditLimitInput('');
      setPhoneError(null);
      
      toast({
        title: 'Success',
        description: `Player ${playerData.player_name} created successfully (${playerData.player_code})`
      });
    } catch (err) {
      const errorMessage = err.message || 'Failed to create player';
      // Check if error is related to phone number
      if (errorMessage.toLowerCase().includes('phone') || errorMessage.toLowerCase().includes('number')) {
        setPhoneError(errorMessage);
      } else {
        setError(errorMessage);
      }
    } finally {
      setCreatingPlayer(false);
    }
  };
  
  // ✅ NEW: Handle updating credit limit
  const handleUpdateCreditLimit = async () => {
    if (!selectedPlayer || !selectedPlayer.player_id) {
      setError('Please select a player first');
      return;
    }
    
    const limit = parseFloat(creditLimitInput);
    if (isNaN(limit) || limit < 0) {
      setError('Please enter a valid credit limit');
      return;
    }
    
    setSavingCreditLimit(true);
    setError(null);
    
    try {
      await playerService.setPlayerCreditLimit(selectedPlayer.player_id, limit);
      
      // Refresh credit status
      await fetchPlayerCreditStatus(selectedPlayer.player_id);
      
      setEditingCreditLimit(false);
      setCreditLimitInput('');
      
      toast({
        title: 'Success',
        description: `Credit limit updated to ${formatCurrency(limit)}`
      });
    } catch (err) {
      setError(err.message || 'Failed to update credit limit');
    } finally {
      setSavingCreditLimit(false);
    }
  };

  // ✅ Fetch player credit status when player is selected
  useEffect(() => {
    if (selectedPlayer && (selectedPlayer.player_id !== null && selectedPlayer.player_id !== undefined)) {
      fetchPlayerCreditStatus(selectedPlayer.player_id);
    } else {
      setPlayerCreditStatus(null);
    }
  }, [selectedPlayer]);

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
      (chipBreakdown.chips_1000 * 1000) +
      (chipBreakdown.chips_500 * 500) +
      (chipBreakdown.chips_100 * 100)
    );
  };

  const totalFromChips = calculateTotalFromChips();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

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
      const chipBreakdownText = `${chipBreakdown.chips_10000}×₹10K, ${chipBreakdown.chips_5000}×₹5K, ${chipBreakdown.chips_1000}×₹1K, ${chipBreakdown.chips_500}×₹500, ${chipBreakdown.chips_100}×₹100`;
      setSuccess(`✅ ₹${amount.toLocaleString('en-IN')} mixed chips (${chipBreakdownText}) issued to ${selectedPlayer.player_name}`);
      
      // Reset form
      setSelectedPlayer(null);
      setCreditAmount('');
      setNotes('');
      setChipBreakdown({
        chips_100: 0,
        chips_500: 0,
        chips_1000: 0,
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
    <div className="space-y-4">
      {/* Error - Display at top, always visible (but not for phone errors) */}
      {error && !phoneError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 sticky top-0 z-10">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success - Display at top, always visible */}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200 sticky top-0 z-10">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Player Search */}
      <div className="space-y-2">
        <Label>Input Player Name</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-14 text-left font-normal"
            >
              {selectedPlayer ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                    {selectedPlayer.player_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{selectedPlayer.player_name}</p>
                    {selectedPlayer.player_code && (
                      <p className="text-xs text-muted-foreground">{selectedPlayer.player_code}</p>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-muted-foreground flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search player...
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
                {searchingPlayers ? (
                  <div className="flex items-center justify-center gap-2 py-6">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Searching...</span>
                  </div>
                ) : (
                  <>
                    {filteredPlayers?.length === 0 && searchQuery && (
                      <CommandEmpty>
                        <div className="flex flex-col items-center gap-2 py-4">
                          <p className="text-sm text-muted-foreground">No player found</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowAddPlayerForm(true);
                              setNewPlayerName(searchQuery);
                              setOpen(false);
                            }}
                            className="mt-2"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add New Player
                          </Button>
                        </div>
                      </CommandEmpty>
                    )}
                    {filteredPlayers?.length > 0 && (
                      <CommandGroup>
                        <ScrollArea className="h-[280px]">
                          {filteredPlayers.map((player) => (
                            <CommandItem
                            key={`player-${player.player_id}`}
                              value={player.player_id.toString()}
                              onSelect={() => handleSelectPlayer(player)}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center gap-3 w-full">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold flex-shrink-0">
                                  {player.player_name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground truncate">{player.player_name}</p>
                                  {player.player_code && (
                                    <p className="text-xs text-muted-foreground">{player.player_code}</p>
                                  )}
                                </div>
                                {selectedPlayer && selectedPlayer.player_id === player.player_id && (
                                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
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

      {/* ✅ NEW: Add Player Form */}
      {showAddPlayerForm && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Add New Player</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddPlayerForm(false);
                  setNewPlayerName('');
                  setNewPlayerPhone('');
                  setCreditLimitInput('');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label>Player Name *</Label>
              <Input
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Enter player name"
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Phone Number (Optional)</Label>
              <Input
                type="tel"
                value={newPlayerPhone}
                onChange={(e) => {
                  setNewPlayerPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                  setPhoneError(null); // Clear error when user types
                }}
                placeholder="Enter 10-digit phone number"
                className={cn("h-11", phoneError && "border-red-500 focus:border-red-500 focus:ring-red-500")}
                maxLength={10}
              />
              {phoneError && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {phoneError}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Credit Limit (Optional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <Input
                  type="number"
                  min="0"
                  value={creditLimitInput}
                  onChange={(e) => setCreditLimitInput(e.target.value)}
                  placeholder="Enter credit limit"
                  className="pl-8 h-11"
                />
              </div>
            </div>
            
            <Button
              onClick={handleCreatePlayer}
              disabled={creatingPlayer || !newPlayerName.trim()}
              className="w-full"
            >
              {creatingPlayer ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Player
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Player Credit Status */}
      {selectedPlayer && (
        <Card className="bg-muted/50 border border-border">
          <CardContent className="p-4">
            {loadingCreditStatus ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading credit status...</span>
              </div>
            ) : playerCreditStatus ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    Credit Status
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-card rounded-lg p-3 border border-border relative">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <Wallet className="w-3 h-3 text-purple-500" />
                        <span className="text-xs text-muted-foreground">Credit Limit</span>
                      </div>
                      {!editingCreditLimit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            setEditingCreditLimit(true);
                            setCreditLimitInput((playerCreditStatus.credit_limit || 0).toString());
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    {editingCreditLimit ? (
                      <div className="space-y-2">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₹</span>
                          <Input
                            type="number"
                            min="0"
                            value={creditLimitInput}
                            onChange={(e) => setCreditLimitInput(e.target.value)}
                            className="pl-6 h-8 text-sm font-bold"
                            autoFocus
                          />
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-6 text-xs flex-1"
                            onClick={handleUpdateCreditLimit}
                            disabled={savingCreditLimit}
                          >
                            {savingCreditLimit ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs flex-1"
                            onClick={() => {
                              setEditingCreditLimit(false);
                              setCreditLimitInput('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-lg font-bold text-purple-700">
                        {formatCurrency(playerCreditStatus.credit_limit || 0)}
                      </p>
                    )}
                  </div>
                  
                  <div className="bg-card rounded-lg p-3 border border-red-200">
                    <div className="flex items-center gap-1 mb-1">
                      <AlertCircle className="w-3 h-3 text-red-500" />
                      <span className="text-xs text-muted-foreground">Outstanding</span>
                    </div>
                    <p className="text-lg font-bold text-red-600">
                      {formatCurrency(playerCreditStatus.total_outstanding || 0)}
                    </p>
                  </div>
                  
                  <div className="bg-card rounded-lg p-3 border border-green-200">
                    <div className="flex items-center gap-1 mb-1">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-muted-foreground">Available</span>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(playerCreditStatus.available_credit || 0)}
                    </p>
                  </div>
                </div>

                {playerCreditStatus.credit_limit === 0 && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700">
                      No credit limit set for this player. Please set a credit limit first.
                    </p>
                  </div>
                )}
                
                {playerCreditStatus.total_outstanding > 0 && playerCreditStatus.available_credit === 0 && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">
                      Player has reached credit limit. Outstanding: {formatCurrency(playerCreditStatus.total_outstanding)}. 
                      Please settle outstanding credit first.
                    </p>
                  </div>
                )}

                {playerCreditStatus.available_credit > 0 && playerCreditStatus.available_credit < parseFloat(creditAmount || 0) && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700">
                      Maximum credit available: {formatCurrency(playerCreditStatus.available_credit)}. 
                      Reduce credit amount or settle outstanding first.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Unable to load credit status
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Credit Amount */}
      <div className="space-y-2">
        <Label>Credit Amount</Label>
        <Input
          type="number"
          min="1000"
          step="1000"
          value={creditAmount}
          onChange={handleAmountChange}
          className="h-14 text-2xl font-bold text-center"
          placeholder="100000"
        />
      </div>

      {/* Chip Breakdown */}
      <Card className="bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200 shadow-md">
        <CardContent className="pt-5 pb-4">
          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <Coins className="h-4 w-4" />
            Chips to be Given
          </Label>
          
          <div className="grid grid-cols-5 gap-3">
            {[
              { key: 'chips_100', value: 100, colorClass: 'text-red-600 border-red-200 focus:border-red-400 bg-red-50', label: '₹100' },
              { key: 'chips_500', value: 500, colorClass: 'text-green-600 border-green-200 focus:border-green-400 bg-green-50', label: '₹500' },
              { key: 'chips_1000', value: 1000, colorClass: 'text-orange-600 border-orange-200 focus:border-orange-400 bg-orange-50', label: '₹1K' },
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

      {/* Summary */}
      {totalFromChips > 0 && (
        <div className={cn(
          "p-4 rounded-lg border-2",
          totalFromChips === parseFloat(creditAmount)
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        )}>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total Chips Selected:</span>
            <span className={cn(
              "text-lg font-bold",
              totalFromChips === parseFloat(creditAmount) ? 'text-green-600' : 'text-red-600'
            )}>
              {formatCurrency(totalFromChips)}
            </span>
          </div>
          {totalFromChips !== parseFloat(creditAmount) && (
            <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Must match {formatCurrency(parseFloat(creditAmount) || 0)}
            </p>
          )}
          {totalFromChips === parseFloat(creditAmount) && (
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Chip total matches credit amount
            </p>
          )}
        </div>
      )}

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

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <Button
          onClick={handleSubmit}
          disabled={loading || !selectedPlayer || totalFromChips <= 0 || totalFromChips !== parseFloat(creditAmount)}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Coins className="w-4 h-4 mr-2" />
              Issue Credit
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CreditRequestForm;