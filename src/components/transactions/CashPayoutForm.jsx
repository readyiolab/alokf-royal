import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useSession } from "../../hooks/useSession";
import { usePlayerSearch } from "../../hooks/usePlayerSearch";
import transactionService from "../../services/transaction.service";
import cashierService from "../../services/cashier.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList,
  CommandSeparator
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  CheckCircle, 
  Loader2, 
  Search, 
  AlertCircle, 
  Plus, 
  
  User, 
  ChevronsUpDown, 
  Check, 
  
  ArrowRight,
  Wallet,
  
  ShieldAlert,
  Home
} from "lucide-react";

export const CashPayoutForm = ({ onSuccess, onCancel }) => {
  const { token } = useAuth();
  const { dashboard, refreshSession } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [chipBalance, setChipBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  
  // Add Cash Float Modal
  const [showAddFloatModal, setShowAddFloatModal] = useState(false);
  const [floatAmount, setFloatAmount] = useState("");
  const [addingFloat, setAddingFloat] = useState(false);
  const [neededAmount, setNeededAmount] = useState(0);

  const {
    searchQuery,
    setSearchQuery,
    searching: searchingPlayers,
    filteredPlayers,
    searchPlayers,
    loadAllPlayers,
    selectPlayer,
  } = usePlayerSearch();

  const [formData, setFormData] = useState({
    player_name: "",
    phone_number: "",
    notes: "",
  });

  const [chipsReceived, setChipsReceived] = useState({
    chips_100: 0,
    chips_500: 0,
    chips_5000: 0,
    chips_10000: 0,
  });

  // House player states
  const [selectedPlayerData, setSelectedPlayerData] = useState(null);
  const [ceoPermissionConfirmed, setCeoPermissionConfirmed] = useState(false);
  const [showCeoPermissionModal, setShowCeoPermissionModal] = useState(false);

  // Load players on mount
  useEffect(() => {
    if (token) {
      loadAllPlayers(token, { reuseExisting: true });
    }
  }, [token]);

  const calculateTotalValue = () => {
    return (
      parseInt(chipsReceived.chips_100 || 0) * 100 +
      parseInt(chipsReceived.chips_500 || 0) * 500 +
      parseInt(chipsReceived.chips_5000 || 0) * 5000 +
      parseInt(chipsReceived.chips_10000 || 0) * 10000
    );
  };

  const totalValue = calculateTotalValue();
  const outstandingCredit = parseFloat(chipBalance?.outstanding_credit || 0);
  const creditToSettle = Math.min(totalValue, outstandingCredit);
  const netCashPayout = Math.max(0, totalValue - outstandingCredit);
  const availableFloat = dashboard?.wallets?.total?.available ?? 0;

  useEffect(() => {
    if ((selectedPlayerId !== null && selectedPlayerId !== undefined) && token) {
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
      console.error("Error fetching chip balance:", err);
      setChipBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleChipCountChange = (denomination, value) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    setChipsReceived(prev => ({ ...prev, [denomination]: numValue }));
    setError("");
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (token && value.trim()) {
      searchPlayers(token, value);
    } else if (token) {
      loadAllPlayers(token, { reuseExisting: true });
    }
  };

  const handleSelectPlayer = async (player) => {
    selectPlayer(player);
    setSelectedPlayerId(player.player_id);
    setSelectedPlayerData(player);
    setSearchQuery(player.player_name);
    setFormData(prev => ({
      ...prev,
      player_name: player.player_name,
      phone_number: player.phone_number || "",
    }));
    setOpen(false);
    
    // Reset CEO permission when player changes
    setCeoPermissionConfirmed(false);
    
    // Fetch full player data to check house player status
    try {
      const fullPlayerData = await playerService.getPlayerById(player.player_id);
      const playerInfo = fullPlayerData?.data || fullPlayerData;
      setSelectedPlayerData(playerInfo);
      
      // If house player, show permission modal
      if (playerInfo?.is_house_player === 1 || playerInfo?.is_house_player === true) {
        setShowCeoPermissionModal(true);
      }
    } catch (err) {
      console.error("Error fetching player data:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.player_name.trim()) {
      setError("Player name is required");
      return;
    }

    if (!formData.phone_number.trim() || formData.phone_number.length !== 10) {
      setError("Valid 10-digit phone number is required");
      return;
    }

    if (totalValue === 0) {
      setError("Please enter the chips received from player");
      return;
    }

    // Check if house player requires CEO permission
    const isHousePlayer = selectedPlayerData?.is_house_player === 1 || selectedPlayerData?.is_house_player === true;
    if (isHousePlayer && !ceoPermissionConfirmed) {
      setError("CEO permission required for house players");
      setShowCeoPermissionModal(true);
      return;
    }

    // ✅ REMOVED: Float check - let backend handle it
    // The backend will create the transaction regardless of float
    // Float is just cashier's working capital tracking

    setLoading(true);
    setError("");

    try {
      await transactionService.createCashPayout(token, {
        player_id: selectedPlayerId,
        player_name: formData.player_name.trim(),
        phone_number: formData.phone_number.trim(),
        amount: totalValue,
        chips_amount: totalValue,
        chip_breakdown: chipsReceived,
        notes: formData.notes.trim() || null,
        ceo_permission_confirmed: isHousePlayer ? ceoPermissionConfirmed : undefined,
      });

      // Refresh session to update wallet balances
      await refreshSession();
      
      setSuccess(true);
      setTimeout(() => onSuccess(), 1500);
    } catch (err) {
      const errorMsg = err.message || "Failed to process cashout";
      
      // ✅ Check if it's insufficient float error from backend
      if (errorMsg.includes('INSUFFICIENT_CASH') || errorMsg.includes('Need ₹')) {
        // Parse the amount needed from error message
        const match = errorMsg.match(/Need ₹([\d,]+)/);
        const needed = match ? parseInt(match[1].replace(/,/g, '')) : netCashPayout - availableFloat;
        
        setNeededAmount(needed);
        setFloatAmount(String(needed));
        setShowAddFloatModal(true);
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddCashFloat = async () => {
    if (!floatAmount || parseFloat(floatAmount) <= 0) return;

    setAddingFloat(true);
    try {
      await cashierService.addCashFloat(parseFloat(floatAmount), 'Added for cash payout', null);
      await refreshSession();
      setShowAddFloatModal(false);
      setFloatAmount("");
      setNeededAmount(0);
      setError("");
      
      // Show success message
      setError("");
      alert(`✅ Float added successfully! Now click "Process Payout" again.`);
    } catch (err) {
      setError(err.message || "Failed to add cash float");
    } finally {
      setAddingFloat(false);
    }
  };

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
        <p className="text-gray-500 mb-6">Cash Out Processed</p>
        <div className="space-y-4 w-full max-w-sm">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-blue-600 font-medium">Chips Returned</p>
              <p className="text-2xl font-bold text-blue-800">{formatCurrency(totalValue)}</p>
            </CardContent>
          </Card>
          {creditToSettle > 0 && (
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-orange-600 font-medium">Credit Auto-Settled</p>
                <p className="text-2xl font-bold text-orange-800">{formatCurrency(creditToSettle)}</p>
              </CardContent>
            </Card>
          )}
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-emerald-600 font-medium">Cash Paid</p>
              <p className="text-4xl font-black text-emerald-800">{formatCurrency(netCashPayout)}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="space-y-5">
      {/* Available Float Badge */}
      <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-success" />
            <span className="text-sm text-muted-foreground">Deposit Cash</span>
          </div>
          <span className="font-mono font-bold text-xl text-success">
            ₹{availableFloat.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* ✅ Warning if payout exceeds float - but still allow transaction */}
      {netCashPayout > availableFloat && totalValue > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 text-warning text-sm border border-warning/20">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Low Float Warning: This payout (₹{netCashPayout.toLocaleString()}) exceeds available float (₹{availableFloat.toLocaleString()}). Transaction will proceed, but consider adding ₹{(netCashPayout - availableFloat).toLocaleString()} float soon.</span>
        </div>
      )}

      {/* Player Search with Command */}
      <div className="space-y-2">
        <Label>Player</Label>
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-14 text-left font-normal bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300"
            >
              {(selectedPlayerId !== null && selectedPlayerId !== undefined) && formData.player_name ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white text-sm font-bold">
                    {formData.player_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{formData.player_name}</p>
                    {formData.phone_number && (
                      <p className="text-xs text-gray-500">{formData.phone_number}</p>
                    )}
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
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                                  {player.player_name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 truncate">{player.player_name}</p>
                                  <p className="text-xs text-gray-500">
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
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Player Balance Info */}
      {(selectedPlayerId !== null && selectedPlayerId !== undefined) && loadingBalance && (
        <div className="flex items-center gap-2 text-muted-foreground py-3 px-4 bg-muted/50 rounded-lg">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading player info...</span>
        </div>
      )}
      
      {(selectedPlayerId !== null && selectedPlayerId !== undefined) && chipBalance && !loadingBalance && (
        <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
          <p className="text-base font-semibold text-foreground">{formData.player_name}</p>
          <div className="grid gap-4 grid-cols-2">
            <div>
              <span className="text-sm text-muted-foreground block mb-1">Credit</span>
              <p className={cn(
                "font-mono font-bold text-xl",
                outstandingCredit > 0 ? "text-destructive" : "text-[hsl(142,71%,35%)]"
              )}>
                ₹{outstandingCredit.toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground block mb-1">Stored Balance</span>
              <p className="font-mono font-bold text-xl text-[hsl(142,71%,35%)]">
                ₹0
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chip Breakdown Input */}
      {(selectedPlayerId !== null && selectedPlayerId !== undefined) && (
        <div className="p-5 rounded-xl bg-gradient-to-b from-muted/60 to-muted/30 border border-border space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Chips Received</p>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-success/20 text-success">
              {Object.values(chipsReceived).reduce((sum, val) => sum + (parseInt(val) || 0), 0)} chips = ₹{totalValue.toLocaleString("en-IN")}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-[hsl(340,82%,52%)]">₹100 chips</Label>
              <Input
                type="number"
                min="0"
                value={chipsReceived.chips_100 || ''}
                onChange={(e) => handleChipCountChange('chips_100', e.target.value)}
                className="font-mono text-lg font-bold border-border focus-visible:ring-ring"
                placeholder="0"
              />
              <span className="text-xs text-muted-foreground">= ₹{((parseInt(chipsReceived.chips_100) || 0) * 100).toLocaleString("en-IN")}</span>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-[hsl(210,100%,56%)]">₹500 chips</Label>
              <Input
                type="number"
                min="0"
                value={chipsReceived.chips_500 || ''}
                onChange={(e) => handleChipCountChange('chips_500', e.target.value)}
                className="font-mono text-lg font-bold border-border focus-visible:ring-ring"
                placeholder="0"
              />
              <span className="text-xs text-muted-foreground">= ₹{((parseInt(chipsReceived.chips_500) || 0) * 500).toLocaleString("en-IN")}</span>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-[hsl(145,63%,42%)]">₹5,000 chips</Label>
              <Input
                type="number"
                min="0"
                value={chipsReceived.chips_5000 || ''}
                onChange={(e) => handleChipCountChange('chips_5000', e.target.value)}
                className="font-mono text-lg font-bold border-border focus-visible:ring-ring"
                placeholder="0"
              />
              <span className="text-xs text-muted-foreground">= ₹{((parseInt(chipsReceived.chips_5000) || 0) * 5000).toLocaleString("en-IN")}</span>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-[hsl(280,70%,55%)]">₹10,000 chips</Label>
              <Input
                type="number"
                min="0"
                value={chipsReceived.chips_10000 || ''}
                onChange={(e) => handleChipCountChange('chips_10000', e.target.value)}
                className="font-mono text-lg font-bold border-border focus-visible:ring-ring"
                placeholder="0"
              />
              <span className="text-xs text-muted-foreground">= ₹{((parseInt(chipsReceived.chips_10000) || 0) * 10000).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      )}

      {/* Settlement Preview */}
      {totalValue > 0 && (selectedPlayerId !== null && selectedPlayerId !== undefined) && (
        <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
          <p className="text-sm font-medium text-foreground">Payout Breakdown</p>
          
          {/* Credit settlement first */}
          {creditToSettle > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Credit to settle</span>
              <span className="font-mono font-semibold text-destructive">
                -₹{creditToSettle.toLocaleString("en-IN")}
              </span>
            </div>
          )}
          
          {/* Cash to give (after credit) */}
          <div className="flex justify-between text-sm pt-2 border-t border-border">
            <span className="text-muted-foreground">Cash to give</span>
            <span className="font-mono font-semibold text-success">
              ₹{netCashPayout.toLocaleString("en-IN")}
            </span>
          </div>
          
          {/* Credit after payout */}
          {outstandingCredit > 0 && (
            <div className="flex justify-between text-sm pt-2 border-t border-border">
              <span className="text-muted-foreground">Credit after</span>
              <span className="font-mono font-semibold text-foreground">
                ₹{Math.max(0, outstandingCredit - totalValue).toLocaleString("en-IN")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {(selectedPlayerId !== null && selectedPlayerId !== undefined)     && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Note (optional)</Label>
          <Textarea
            placeholder="Add a note..."
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="resize-none border-border focus-visible:ring-ring"
            rows={2}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* House Player CEO Permission Warning */}
      {selectedPlayerData && (selectedPlayerData.is_house_player === 1 || selectedPlayerData.is_house_player === true) && (
        <div className={cn(
          "p-4 rounded-lg border-2 space-y-3",
          ceoPermissionConfirmed 
            ? "bg-success/10 border-success/50" 
            : "bg-[hsl(280,70%,50%)]/10 border-[hsl(280,70%,50%)]/50"
        )}>
          <div className="flex items-start gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              ceoPermissionConfirmed ? "bg-success/20" : "bg-[hsl(280,70%,50%)]/20"
            )}>
              {ceoPermissionConfirmed ? (
                <Check className="h-5 w-5 text-success" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-[hsl(280,70%,50%)]" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-[hsl(280,70%,50%)] text-white text-[10px] px-2 gap-1">
                  <Home className="h-3 w-3" />
                  HOUSE PLAYER
                </Badge>
              </div>
              <p className={cn(
                "font-semibold",
                ceoPermissionConfirmed ? "text-success" : "text-foreground"
              )}>
                {ceoPermissionConfirmed 
                  ? "CEO Permission Granted" 
                  : `${selectedPlayerData.player_name} requires CEO permission for cashout`
                }
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {ceoPermissionConfirmed 
                  ? "You may proceed with the payout." 
                  : "Please confirm you have received verbal/written approval from CEO before proceeding."
                }
              </p>
            </div>
          </div>
          
          {!ceoPermissionConfirmed && (
            <Button
              type="button"
              onClick={() => setShowCeoPermissionModal(true)}
              className="w-full bg-[hsl(280,70%,50%)] hover:bg-[hsl(280,70%,45%)] text-white font-semibold"
            >
              <ShieldAlert className="h-4 w-4 mr-2" />
              Confirm CEO Permission Received
            </Button>
          )}
        </div>
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
            totalValue === 0 || 
            (selectedPlayerId === null || selectedPlayerId === undefined) ||
            ((selectedPlayerData?.is_house_player === 1 || selectedPlayerData?.is_house_player === true) && !ceoPermissionConfirmed)
          }
          variant="destructive"
          className={cn(
            "flex-1 font-semibold",
            ((selectedPlayerData?.is_house_player === 1 || selectedPlayerData?.is_house_player === true) && !ceoPermissionConfirmed) && "opacity-50"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (selectedPlayerData?.is_house_player === 1 || selectedPlayerData?.is_house_player === true) && !ceoPermissionConfirmed ? (
            "CEO Permission Required"
          ) : (
            `Process Payout ${totalValue > 0 ? `• ${formatCurrency(netCashPayout)}` : ""}`
          )}
        </Button>
      </div>

      {/* CEO Permission Modal */}
      <Dialog open={showCeoPermissionModal} onOpenChange={setShowCeoPermissionModal}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[hsl(280,70%,50%)]/10">
                <ShieldAlert className="h-5 w-5 text-[hsl(280,70%,50%)]" />
              </div>
              CEO Permission Required
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedPlayerData && (
              <>
                <div className="border-2 border-[hsl(280,70%,50%)]/50 bg-[hsl(280,70%,50%)]/10 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-[hsl(280,70%,50%)] flex items-center justify-center text-white font-bold">
                      {selectedPlayerData.player_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{selectedPlayerData.player_name}</p>
                      <Badge className="bg-[hsl(280,70%,50%)] text-white mt-1 text-[10px] px-2 gap-1">
                        <Home className="h-3 w-3" />
                        HOUSE PLAYER
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-foreground font-medium mb-2">
                    This player requires CEO permission for cashout.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Please confirm you have received verbal/written approval from CEO before proceeding.
                  </p>
                </div>
                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      setCeoPermissionConfirmed(true);
                      setShowCeoPermissionModal(false);
                      setError("");
                    }}
                    className="w-full bg-[hsl(280,70%,50%)] hover:bg-[hsl(280,70%,45%)] text-white h-12 font-semibold"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Confirm CEO Permission Received
                  </Button>
                  <Button
                    onClick={() => setShowCeoPermissionModal(false)}
                    variant="outline"
                    className="w-full h-12"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Float Modal - Only shown when backend explicitly asks for it */}
      <Dialog open={showAddFloatModal} onOpenChange={setShowAddFloatModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-orange-600" />
              Add Cash Float
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 text-warning text-sm border border-warning/20">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>Backend requires <strong>{formatCurrency(neededAmount)}</strong> more float to process this payout</span>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Float Amount (₹)</Label>
              <Input
                type="number"
                value={floatAmount}
                onChange={(e) => setFloatAmount(e.target.value)}
                min={neededAmount}
                className="font-mono text-lg text-center border-border focus-visible:ring-ring"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowAddFloatModal(false)} disabled={addingFloat} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleAddCashFloat}
                disabled={addingFloat || !floatAmount || parseFloat(floatAmount) <= 0}
                className="flex-1 bg-warning hover:bg-warning/90 text-white font-semibold"
              >
                {addingFloat ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add {formatCurrency(parseFloat(floatAmount) || 0)}
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              After adding float, click "Process Payout" again
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
};

export default CashPayoutForm;