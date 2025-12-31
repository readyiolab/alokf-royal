// components/admin/RakebackModal.jsx
// Rakeback - Give chips to player as reward

import React, { useState, useEffect } from 'react';
import { X, Gift, Trash2, Plus, Timer, Trophy, CheckCircle2, AlertCircle, Coins, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { cn } from '@/lib/utils';
import rakebackService from '../../services/rakeback.service';
import { usePlayerSearch } from '../../hooks/usePlayerSearch';
import { toast } from 'sonner';

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

  const [activeTab, setActiveTab] = useState("process");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [rakebackTypes, setRakebackTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [chipBreakdown, setChipBreakdown] = useState({
    chips_100: 0,
    chips_500: 0,
    chips_5000: 0,
    chips_10000: 0
  });
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [playerPlayTime, setPlayerPlayTime] = useState(null);
  
  // Configure Rules states
  const [newRuleHours, setNewRuleHours] = useState('');
  const [newRuleReward, setNewRuleReward] = useState('');

  const getToken = () => localStorage.getItem('auth_token');

  useEffect(() => {
    if (isOpen) {
      fetchRakebackTypes();
      const token = getToken();
      if (token) {
        loadAllPlayers(token, { reuseExisting: true });
      }
      setActiveTab("process");
      setSelectedPlayer(null);
      setSelectedType(null);
      setPlayerPlayTime(null);
    }
  }, [isOpen]);

  const fetchRakebackTypes = async () => {
    try {
      const response = await rakebackService.getRakebackTypes();
      setRakebackTypes(response.data || response || []);
    } catch (err) {
      console.error('Error fetching rakeback types:', err);
      toast.error('Failed to load rakeback types');
    }
  };

  // Get player play time from active seated players
  useEffect(() => {
    const fetchPlayerPlayTime = async () => {
      if (!selectedPlayer || !sessionId) {
        setPlayerPlayTime(null);
        return;
      }

      try {
        const players = await rakebackService.getActiveSeatedPlayers(sessionId);
        const playerData = Array.isArray(players) ? players : (players?.data || []);
        const foundPlayer = playerData.find(p => p.player_id === selectedPlayer.player_id);
        
        if (foundPlayer && foundPlayer.current_elapsed_seconds !== undefined) {
          const totalMinutes = Math.floor(foundPlayer.current_elapsed_seconds / 60);
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          setPlayerPlayTime({ hours, minutes, totalMinutes });
        } else {
          // If not found in active players, set to 0
          setPlayerPlayTime({ hours: 0, minutes: 0, totalMinutes: 0 });
        }
      } catch (err) {
        console.error('Error fetching player play time:', err);
        setPlayerPlayTime({ hours: 0, minutes: 0, totalMinutes: 0 });
      }
    };

    fetchPlayerPlayTime();
  }, [selectedPlayer, sessionId]);

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    const token = getToken();
    if (token && value.trim()) {
      searchPlayers(token, value);
    } else if (token) {
      loadAllPlayers(token, { reuseExisting: true });
    }
  };

  const handleSelectPlayer = (player) => {
    selectPlayer(player);
    setSelectedPlayer(player);
    setSelectedType(null);
  };

  const calculateChipValue = () => {
    return (
      (chipBreakdown.chips_100 || 0) * 100 +
      (chipBreakdown.chips_500 || 0) * 500 +
      (chipBreakdown.chips_5000 || 0) * 5000 +
      (chipBreakdown.chips_10000 || 0) * 10000
    );
  };

  // Auto-calculate chip breakdown when type is selected
  useEffect(() => {
    if (selectedType && selectedType.default_amount > 0) {
      const amount = selectedType.default_amount;
      let remaining = amount;
      const chips_10000 = Math.floor(remaining / 10000);
      remaining -= chips_10000 * 10000;
      const chips_5000 = Math.floor(remaining / 5000);
      remaining -= chips_5000 * 5000;
      const chips_500 = Math.floor(remaining / 500);
      remaining -= chips_500 * 500;
      const chips_100 = Math.floor(remaining / 100);
      setChipBreakdown({ chips_100, chips_500, chips_5000, chips_10000 });
    }
  }, [selectedType]);

  const handleChipChange = (denomination, value) => {
    setChipBreakdown(prev => ({
      ...prev,
      [denomination]: parseInt(value) || 0
    }));
  };

  const handleProcessRakeback = async () => {
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

    setProcessing(true);
    setError('');

    try {
      const response = await rakebackService.processRakeback({
        player_id: selectedPlayer.player_id,
        rakeback_type: selectedType.type_code,
        rakeback_type_label: selectedType.type_label || selectedType.type_code,
        amount: chipValue,
        chip_breakdown: chipBreakdown,
        notes: selectedType.type_label || '',
      });

      toast.success('Rakeback processed successfully');
      onSuccess && onSuccess(response);
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process rakeback');
      toast.error(err.response?.data?.message || 'Failed to process rakeback');
    } finally {
      setProcessing(false);
    }
  };

  const handleAddRule = async () => {
    if (!newRuleHours || !newRuleReward) {
      toast.error('Please enter both hours and reward amount');
      return;
    }

    setProcessing(true);
    try {
      await rakebackService.createRakebackType({
        required_hours: parseFloat(newRuleHours),
        default_amount: parseFloat(newRuleReward),
      });
      toast.success('Rakeback rule added successfully');
      setNewRuleHours('');
      setNewRuleReward('');
      fetchRakebackTypes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add rakeback rule');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteRule = async (typeCode) => {
    if (!confirm('Are you sure you want to delete this rakeback rule?')) {
      return;
    }

    setProcessing(true);
    try {
      await rakebackService.deleteRakebackType(typeCode);
      toast.success('Rakeback rule deleted successfully');
      fetchRakebackTypes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete rakeback rule');
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setSelectedPlayer(null);
    setSelectedType(null);
    setChipBreakdown({ chips_100: 0, chips_500: 0, chips_5000: 0, chips_10000: 0 });
    setError('');
    setPlayerPlayTime(null);
    setSearchQuery('');
    setNewRuleHours('');
    setNewRuleReward('');
    onClose();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Calculate progress for play time
  const targetHours = rakebackTypes.length > 0 
    ? Math.max(...rakebackTypes.map(t => t.required_hours || 0), 8)
    : 8;
  const currentHours = playerPlayTime ? playerPlayTime.hours + (playerPlayTime.minutes / 60) : 0;
  const progressPercent = Math.min(100, (currentHours / targetHours) * 100);
  const hasCompletedTarget = playerPlayTime && currentHours >= targetHours;

  // Find eligible rakeback types
  const eligibleTypes = rakebackTypes.filter(type => {
    if (!playerPlayTime) return false;
    const requiredHours = type.required_hours || 0;
    return currentHours >= requiredHours;
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span>Rake Back</span>
              <span className="text-xs text-muted-foreground font-normal">
                Give chips to player as rakeback reward
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="process">Process Rakeback</TabsTrigger>
            <TabsTrigger value="configure">Configure Rules</TabsTrigger>
          </TabsList>

          {/* Process Rakeback Tab */}
          <TabsContent value="process" className="space-y-4 mt-4">
            {/* Recorded By */}
            <div className="text-sm text-muted-foreground">
              Recorded by: <span className="text-foreground font-medium">Floor Manager</span>
            </div>

            {/* Player Selection */}
            <div className="space-y-2">
              <Label>Input Player Name</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search player..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full"
                />
                {searchQuery && filteredPlayers && filteredPlayers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredPlayers.map((player) => (
                      <button
                        key={player.player_id}
                        onClick={() => handleSelectPlayer(player)}
                        className="w-full px-4 py-2 text-left hover:bg-muted transition-colors flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {player.player_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{player.player_name}</p>
                          {player.player_code && (
                            <p className="text-xs text-muted-foreground">{player.player_code}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedPlayer && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border flex items-center gap-3">
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
              )}
            </div>

            {/* Player Progress Card */}
            {selectedPlayer && playerPlayTime && (
              <div className={cn(
                "p-4 rounded-xl border-2 transition-all",
                hasCompletedTarget 
                  ? "border-emerald-500/50 bg-emerald-500/10" 
                  : "border-amber-500/30 bg-amber-500/5"
              )}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "p-1.5 rounded-full",
                      hasCompletedTarget ? "bg-emerald-500/20" : "bg-amber-500/20"
                    )}>
                      <Timer className={cn(
                        "h-4 w-4",
                        hasCompletedTarget ? "text-emerald-500" : "text-amber-500"
                      )} />
                    </div>
                    <span className="text-sm font-medium text-foreground">Today's Play Time</span>
                  </div>
                  {hasCompletedTarget && (
                    <div className="flex items-center gap-1 text-emerald-500">
                      <Trophy className="h-4 w-4" />
                      <span className="text-xs font-semibold">Eligible!</span>
                    </div>
                  )}
                </div>

                {/* Time Display */}
                <div className="flex items-baseline gap-1 mb-3">
                  <span className={cn(
                    "text-3xl font-bold tabular-nums",
                    hasCompletedTarget ? "text-emerald-500" : "text-foreground"
                  )}>
                    {playerPlayTime.hours}
                  </span>
                  <span className="text-lg text-muted-foreground">hrs</span>
                  <span className={cn(
                    "text-3xl font-bold tabular-nums ml-1",
                    hasCompletedTarget ? "text-emerald-500" : "text-foreground"
                  )}>
                    {playerPlayTime.minutes}
                  </span>
                  <span className="text-lg text-muted-foreground">mins</span>
                  <span className="text-muted-foreground text-sm ml-2">/ {targetHours} hrs target</span>
                </div>

                {/* Progress Bar */}
                <div className="relative">
                  <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-700 ease-out",
                        hasCompletedTarget 
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-400" 
                          : "bg-gradient-to-r from-blue-500 to-cyan-400"
                      )}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Progress Labels */}
                <div className="flex justify-between mt-2 text-xs">
                  <span className="text-muted-foreground">0h</span>
                  <span className={cn(
                    "font-medium",
                    hasCompletedTarget ? "text-emerald-500" : "text-muted-foreground"
                  )}>{targetHours}h</span>
                </div>

                {/* Status Message */}
                <div className={cn(
                  "mt-3 p-2 rounded-lg text-center text-sm",
                  hasCompletedTarget 
                    ? "bg-emerald-500/20 text-emerald-600" 
                    : "bg-muted/50 text-muted-foreground"
                )}>
                  {hasCompletedTarget ? (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{targetHours} hours completed! Eligible for rakeback</span>
                    </div>
                  ) : (
                    <span>{playerPlayTime.hours}h {playerPlayTime.minutes}m played • {Math.floor(targetHours - currentHours)}h {Math.floor((targetHours - currentHours) % 1 * 60)}m remaining</span>
                  )}
                </div>
              </div>
            )}

            {/* Eligible Rakeback Types */}
            {selectedPlayer && playerPlayTime && (
              <div className="space-y-2">
                <Label>Rakeback Reward</Label>
                {eligibleTypes.length > 0 ? (
                  <div className="space-y-2">
                    {eligibleTypes.map((type) => (
                      <div
                        key={type.type_code}
                        onClick={() => setSelectedType(type)}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer",
                          selectedType?.type_code === type.type_code
                            ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20"
                            : "border-border hover:border-emerald-500/50 bg-muted/30"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="rakeback-type"
                            checked={selectedType?.type_code === type.type_code}
                            onChange={() => setSelectedType(type)}
                            className="h-4 w-4 text-emerald-500 accent-emerald-500"
                          />
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <p className="text-sm font-medium text-foreground">
                              {type.required_hours} hrs play time → {formatCurrency(type.default_amount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border border-border bg-muted/30 text-center text-sm text-muted-foreground">
                    No eligible rakeback types. Player must complete more play time.
                  </div>
                )}
              </div>
            )}

            {/* Chip Breakdown */}
            {selectedType && selectedType.default_amount > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-primary" />
                  Chips to be Given
                </Label>
                <div className={cn(
                  "p-5 rounded-xl border-2 transition-all",
                  hasCompletedTarget 
                    ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5" 
                    : "border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5"
                )}>
                  <div className="text-center mb-4">
                    <span className="text-sm text-muted-foreground">Total Rakeback Amount</span>
                    <div className={cn(
                      "text-3xl font-bold",
                      hasCompletedTarget ? "text-emerald-600" : "text-primary"
                    )}>
                      {formatCurrency(calculateChipValue())}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-[hsl(340,82%,52%)]">₹100 chips</Label>
                      <Input
                        type="number"
                        min="0"
                        value={chipBreakdown.chips_100 || ''}
                        onChange={(e) => handleChipChange('chips_100', e.target.value)}
                        className="font-mono text-lg font-bold"
                        placeholder="0"
                      />
                      <span className="text-xs text-muted-foreground">
                        = {formatCurrency(chipBreakdown.chips_100 * 100)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-[hsl(210,100%,56%)]">₹500 chips</Label>
                      <Input
                        type="number"
                        min="0"
                        value={chipBreakdown.chips_500 || ''}
                        onChange={(e) => handleChipChange('chips_500', e.target.value)}
                        className="font-mono text-lg font-bold"
                        placeholder="0"
                      />
                      <span className="text-xs text-muted-foreground">
                        = {formatCurrency(chipBreakdown.chips_500 * 500)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-[hsl(145,63%,42%)]">₹5,000 chips</Label>
                      <Input
                        type="number"
                        min="0"
                        value={chipBreakdown.chips_5000 || ''}
                        onChange={(e) => handleChipChange('chips_5000', e.target.value)}
                        className="font-mono text-lg font-bold"
                        placeholder="0"
                      />
                      <span className="text-xs text-muted-foreground">
                        = {formatCurrency(chipBreakdown.chips_5000 * 5000)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold text-[hsl(280,70%,55%)]">₹10,000 chips</Label>
                      <Input
                        type="number"
                        min="0"
                        value={chipBreakdown.chips_10000 || ''}
                        onChange={(e) => handleChipChange('chips_10000', e.target.value)}
                        className="font-mono text-lg font-bold"
                        placeholder="0"
                      />
                      <span className="text-xs text-muted-foreground">
                        = {formatCurrency(chipBreakdown.chips_10000 * 10000)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleProcessRakeback}
                disabled={!selectedPlayer || !selectedType || processing || calculateChipValue() <= 0}
                className={cn(
                  "flex-1 text-primary-foreground transition-all",
                  hasCompletedTarget 
                    ? "bg-emerald-500 hover:bg-emerald-600" 
                    : "bg-primary hover:bg-primary/90"
                )}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Process Rakeback"
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Configure Rules Tab */}
          <TabsContent value="configure" className="space-y-4 mt-4">
            {/* Current Rules */}
            <div className="space-y-3">
              <Label>Current Rakeback Rules</Label>
              <div className="space-y-2">
                {rakebackTypes.length > 0 ? (
                  rakebackTypes.map((type) => (
                    <div
                      key={type.type_code}
                      className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30"
                    >
                      <span className="text-sm font-medium text-foreground">
                        {type.required_hours} hrs play time → {formatCurrency(type.default_amount)}
                      </span>
                      <Button
                        onClick={() => handleDeleteRule(type.type_code)}
                        disabled={processing}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-lg border border-border bg-muted/30 text-center text-sm text-muted-foreground">
                    No rakeback rules configured. Add a new rule below.
                  </div>
                )}
              </div>
            </div>

            {/* Add New Rule */}
            <div className="space-y-3 pt-4 border-t border-border">
              <Label>Add New Rule</Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">Hours</Label>
                  <Input
                    type="number"
                    placeholder="Hours"
                    value={newRuleHours}
                    onChange={(e) => setNewRuleHours(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Reward ₹</Label>
                  <Input
                    type="number"
                    placeholder="Reward ₹"
                    value={newRuleReward}
                    onChange={(e) => setNewRuleReward(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm opacity-0">Action</Label>
                  <Button
                    onClick={handleAddRule}
                    disabled={!newRuleHours || !newRuleReward || processing}
                    className="w-full"
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Close
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default RakebackModal;
