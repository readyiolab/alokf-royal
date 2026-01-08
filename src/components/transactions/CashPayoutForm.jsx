import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useSession } from "../../hooks/useSession";
import { usePlayerSearch } from "../../hooks/usePlayerSearch";
import transactionService from "../../services/transaction.service";
import cashierService from "../../services/cashier.service";
import playerService from "../../services/player.service";
import ChipInputGrid from "../common/ChipInputGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
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
  Coins,
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
  const [storedBalance, setStoredBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [totalChipsToCashOut, setTotalChipsToCashOut] = useState("");
  const [creditSettleAmount, setCreditSettleAmount] = useState(0);

  // Toggle to include stored balance
  const [includeStoredBalance, setIncludeStoredBalance] = useState(false);
  const [storedBalanceAmount, setStoredBalanceAmount] = useState(0); // Partial stored balance amount

  // Toggle to adjust outstanding credit
  const [adjustOutstandingCredit, setAdjustOutstandingCredit] = useState(false);
  const [outstandingCredit, setOutstandingCredit] = useState(0);
  const [loadingCredit, setLoadingCredit] = useState(false);

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
    chips_1000: 0,
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
      parseInt(chipsReceived.chips_1000 || 0) * 1000 +
      parseInt(chipsReceived.chips_5000 || 0) * 5000 +
      parseInt(chipsReceived.chips_10000 || 0) * 10000
    );
  };

  const chipBreakdownTotal = calculateTotalValue();
  const enteredAmount = totalChipsToCashOut ? parseFloat(totalChipsToCashOut) : 0;
  const totalValue = chipBreakdownTotal > 0 ? chipBreakdownTotal : enteredAmount;

  // Calculate total payout including stored balance if toggle is ON (use partial amount)
  const storedBalanceToUse = includeStoredBalance ? storedBalanceAmount : 0;
  let totalPayoutAmount = totalValue + storedBalanceToUse;

  // Adjust for outstanding credit if toggle is ON
  if (adjustOutstandingCredit && creditSettleAmount > 0) {
    totalPayoutAmount = Math.max(0, totalPayoutAmount - creditSettleAmount);
  }

  const availableFloat = dashboard?.wallets?.primary?.current ?? 0;

  useEffect(() => {
    if (selectedPlayerId !== null && selectedPlayerId !== undefined && token) {
      fetchStoredBalance(selectedPlayerId);
      fetchOutstandingCredit(selectedPlayerId);
    } else {
      setStoredBalance(0);
      setOutstandingCredit(0);
    }
  }, [selectedPlayerId, token]);

  const fetchStoredBalance = async (playerId) => {
    if (!playerId || !token) {
      setStoredBalance(0);
      return;
    }

    setLoadingBalance(true);
    try {
      const result = await transactionService.getPlayerStoredBalance(token, playerId);
      const balance = parseFloat(result?.stored_chips || result?.data?.stored_chips || 0);
      setStoredBalance(balance);
      console.log('✅ Stored balance fetched:', balance);
    } catch (err) {
      console.error("Error fetching stored balance:", err);
      setStoredBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  };

  const fetchOutstandingCredit = async (playerId) => {
    setLoadingCredit(true);
    try {
      const sessionId = dashboard?.session?.session_id;
      const result = await playerService.getPlayerCreditStatus(playerId, sessionId);
      const creditData = result?.data || result;
      const totalOutstanding = parseFloat(creditData?.total_outstanding || 0);
      setOutstandingCredit(totalOutstanding);
    } catch (err) {
      console.error("Error fetching outstanding credit:", err);
      setOutstandingCredit(0);
    } finally {
      setLoadingCredit(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
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
    setTotalChipsToCashOut("");
    setIncludeStoredBalance(false);
    setStoredBalanceAmount(0);
    setAdjustOutstandingCredit(false);
    setFormData(prev => ({
      ...prev,
      player_name: player.player_name,
      phone_number: player.phone_number || "",
    }));
    setOpen(false);

    // Reset CEO permission when player changes
    setCeoPermissionConfirmed(false);

    // Reset error when selecting a new player
    setError("");

    // ✅ Always fetch fresh stored balance when player is selected
    if (token && player.player_id) {
      await fetchStoredBalance(player.player_id);
    }

    // Fetch full player data to check house player status
    try {
      const fullPlayerData = await playerService.getPlayerById(player.player_id);
      const playerInfo = fullPlayerData?.data || fullPlayerData;
      setSelectedPlayerData(playerInfo);

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

    const physicalChipsAmount = chipBreakdownTotal > 0 ? chipBreakdownTotal : enteredAmount;
    if (physicalChipsAmount === 0 || physicalChipsAmount <= 0) {
      setError("Please enter the chips player is bringing to cash out");
      return;
    }

    // Check if house player requires CEO permission
    const isHousePlayer = selectedPlayerData?.is_house_player === 1 || selectedPlayerData?.is_house_player === true;
    if (isHousePlayer && !ceoPermissionConfirmed) {
      setError("CEO permission required for house players");
      setShowCeoPermissionModal(true);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const physicalChipsAmount = chipBreakdownTotal > 0 ? chipBreakdownTotal : enteredAmount;

      // Validate stored balance amount doesn't exceed available
      if (includeStoredBalance && storedBalanceAmount > storedBalance) {
        throw new Error(`Stored balance amount (₹${storedBalanceAmount.toLocaleString("en-IN")}) cannot exceed available stored balance (₹${storedBalance.toLocaleString("en-IN")})`);
      }

      // Calculate total payout amount (before credit adjustment)
      const totalPayoutBeforeCredit = physicalChipsAmount + storedBalanceToUse;

      // Backend will handle credit adjustment, but we pass the pre-adjusted amount
      // The backend will calculate the final net payout based on the toggle

      // Create notes based on whether stored balance is included and credit is adjusted
      let payoutNotes = formData.notes.trim();
      if (!payoutNotes) {
        if (adjustOutstandingCredit && outstandingCredit > 0) {
          payoutNotes = `Cash payout: Physical chips ₹${physicalChipsAmount.toLocaleString("en-IN")}`;
          if (includeStoredBalance && storedBalanceAmount > 0) {
            payoutNotes += ` + Stored ₹${storedBalanceAmount.toLocaleString("en-IN")}`;
          }
          payoutNotes += ` - Credit ₹${Math.min(outstandingCredit, totalPayoutBeforeCredit).toLocaleString("en-IN")} = Net ₹${totalPayoutAmount.toLocaleString("en-IN")}`;
        } else if (includeStoredBalance && storedBalanceAmount > 0) {
          payoutNotes = `Cash payout: Physical chips ₹${physicalChipsAmount.toLocaleString("en-IN")} + Stored ₹${storedBalanceAmount.toLocaleString("en-IN")} = Total ₹${totalPayoutBeforeCredit.toLocaleString("en-IN")}`;
        } else {
          payoutNotes = `Cash payout from physical chips (winnings)`;
        }
      }

      // Create single cash payout transaction
      await transactionService.createCashPayout(token, {
        player_id: selectedPlayerId,
        player_name: formData.player_name.trim(),
        phone_number: formData.phone_number.trim(),
        amount: totalPayoutBeforeCredit, // Total cash to pay before credit adjustment (backend will adjust)
        chips_amount: physicalChipsAmount, // Only physical chips being returned
        chip_breakdown: chipsReceived, // Only physical chips
        notes: payoutNotes,
        include_stored_balance: includeStoredBalance, // Flag for backend
        stored_balance_amount: includeStoredBalance ? storedBalanceAmount : 0, // Partial amount from stored
        adjust_outstanding_credit: adjustOutstandingCredit, // Toggle to adjust outstanding credit
        manual_credit_settlement: adjustOutstandingCredit ? creditSettleAmount : undefined, // Manual credit settlement amount
        ceo_permission_confirmed: isHousePlayer ? ceoPermissionConfirmed : undefined,
      });

      await refreshSession();

      setSuccess(true);
      setTimeout(() => onSuccess(), 1500);
    } catch (err) {
      const errorMsg = err.message || "Failed to process cashout";

      // ✅ Refresh stored balance after error (in case it was partially processed)
      if (selectedPlayerId) {
        fetchStoredBalance(selectedPlayerId);
      }

      if (errorMsg.includes('INSUFFICIENT_CASH') || errorMsg.includes('Need ₹')) {
        const match = errorMsg.match(/Need ₹([\d,]+)/);
        const needed = match ? parseInt(match[1].replace(/,/g, '')) : totalPayoutAmount - availableFloat;

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

      // ✅ Refresh stored balance after adding float (in case it changed)
      if (selectedPlayerId) {
        fetchStoredBalance(selectedPlayerId);
      }

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
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-emerald-600 font-medium">Total Cash Paid</p>
              <p className="text-4xl font-black text-emerald-800">{formatCurrency(totalPayoutAmount)}</p>
              {includeStoredBalance && storedBalanceAmount > 0 && (
                <p className="text-xs text-gray-600 mt-2">
                  Physical: {formatCurrency(totalValue)} + Stored: {formatCurrency(storedBalanceAmount)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="space-y-4">
      {/* Header Section */}
      <div className="space-y-2 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <ArrowRight className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Cash Payout</h2>
            <p className="text-sm text-gray-500">Player withdraws chips for cash</p>
          </div>
        </div>
      </div>

      {/* Player Search */}
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

      {/* Player Stored Balance Info + Toggle */}
      {(selectedPlayerId !== null && selectedPlayerId !== undefined) && (
        <>
          {loadingBalance ? (
            <div className="flex items-center gap-2 text-muted-foreground py-2 px-3 bg-muted/50 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading balance...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Outstanding Credit and Stored Balance in Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Outstanding Credit Display + Toggle */}
                {outstandingCredit > 0 && (
                  <Card className="border-2 border-orange-200 bg-orange-50">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 mb-1">Outstanding Credit</p>
                          <p className="text-xl font-bold text-orange-700">
                            ₹{outstandingCredit.toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="adjust-credit" className="text-xs font-medium text-gray-900 cursor-pointer">
                            Settle
                          </Label>
                          <Switch
                            id="adjust-credit"
                            checked={adjustOutstandingCredit}
                            onCheckedChange={(checked) => {
                              setAdjustOutstandingCredit(checked);
                              if (checked) {
                                setCreditSettleAmount(outstandingCredit);
                              } else {
                                setCreditSettleAmount(0);
                              }
                            }}
                          />
                        </div>
                      </div>

                      {adjustOutstandingCredit && (
                        <div className="space-y-2 mt-2 pt-2 border-t border-orange-200">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-orange-900">
                              Amount to Settle (₹)
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              max={outstandingCredit}
                              value={creditSettleAmount}
                              onChange={(e) => {
                                const val = Math.min(parseFloat(e.target.value) || 0, outstandingCredit);
                                setCreditSettleAmount(val);
                              }}
                              className="h-9 text-sm font-mono border-orange-300 focus:border-orange-500"
                              placeholder="Enter amount"
                            />
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setCreditSettleAmount(outstandingCredit)}
                                className="text-xs h-7 px-2"
                              >
                                Full
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setCreditSettleAmount(Math.floor(outstandingCredit / 2))}
                                className="text-xs h-7 px-2"
                              >
                                Half
                              </Button>
                            </div>
                          </div>
                          <div className="bg-orange-100 rounded p-2 text-xs text-orange-800">
                            ✅ ₹{creditSettleAmount.toLocaleString("en-IN")} will be deducted
                            {creditSettleAmount < outstandingCredit && (
                              <span className="block mt-1 text-orange-600">
                                Remaining: ₹{(outstandingCredit - creditSettleAmount).toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {!adjustOutstandingCredit && (
                        <div className="bg-gray-100 rounded p-2 text-xs text-gray-600 mt-2">
                          ℹ️ Credit unchanged
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Stored Balance Display + Toggle - Always show if player is selected */}
                {selectedPlayerId && (
                  <Card className="border-2 border-blue-200 bg-blue-50">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs text-gray-600">Stored Balance</p>
                            {loadingBalance && (
                              <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                            )}
                          </div>
                          <p className="text-xl font-bold text-blue-700">
                            ₹{storedBalance.toLocaleString("en-IN")}
                          </p>
                          {storedBalance === 0 && !loadingBalance && (
                            <p className="text-xs text-gray-500 mt-1">No balance</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="include-stored" className="text-xs font-medium text-gray-900 cursor-pointer">
                            Include
                          </Label>
                          <Switch
                            id="include-stored"
                            checked={includeStoredBalance}
                            onCheckedChange={(checked) => {
                              setIncludeStoredBalance(checked);
                              if (checked) {
                                setStoredBalanceAmount(storedBalance); // Default to full amount
                              } else {
                                setStoredBalanceAmount(0);
                              }
                            }}
                            disabled={storedBalance <= 0}
                          />
                        </div>
                      </div>

                      {includeStoredBalance && (
                        <div className="space-y-2 mt-2 pt-2 border-t border-blue-200">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-blue-900">
                              Amount to Use from Stored Balance (₹)
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              max={storedBalance}
                              step="100"
                              value={storedBalanceAmount}
                              onChange={(e) => {
                                const val = Math.min(parseFloat(e.target.value) || 0, storedBalance);
                                setStoredBalanceAmount(val);
                              }}
                              className="h-9 text-sm font-mono border-blue-300 focus:border-blue-500"
                              placeholder="Enter amount"
                            />
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setStoredBalanceAmount(storedBalance)}
                                className="text-xs h-7 px-2"
                              >
                                Full
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setStoredBalanceAmount(Math.floor(storedBalance / 2))}
                                className="text-xs h-7 px-2"
                              >
                                Half
                              </Button>
                            </div>
                          </div>
                          <div className="bg-blue-100 rounded p-2 text-xs text-blue-800">
                            ✅ ₹{storedBalanceAmount.toLocaleString("en-IN")} will be added to payout
                            {storedBalanceAmount < storedBalance && (
                              <span className="block mt-1 text-blue-600">
                                Remaining: ₹{(storedBalance - storedBalanceAmount).toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {!includeStoredBalance && storedBalance > 0 && (
                        <div className="bg-gray-100 rounded p-2 text-xs text-gray-600 mt-2">
                          ℹ️ Stored balance not included
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Physical Chips Input - Full Width */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900">
                  Physical Chips Player is Bringing (₹)
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={totalChipsToCashOut}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = parseFloat(value) || 0;
                    setTotalChipsToCashOut(value);
                    if (error) setError("");

                    if (value && numValue > 0) {
                      const breakdown = {
                        chips_10000: Math.floor(numValue / 10000),
                        chips_5000: Math.floor((numValue % 10000) / 5000),
                        chips_1000: Math.floor((numValue % 5000) / 1000),
                        chips_500: Math.floor((numValue % 1000) / 500),
                        chips_100: Math.floor((numValue % 500) / 100),
                      };
                      setChipsReceived(breakdown);
                    } else {
                      setChipsReceived({ chips_100: 0, chips_500: 0, chips_1000: 0, chips_5000: 0, chips_10000: 0 });
                    }
                  }}
                  className="h-12 text-lg"
                  placeholder="Enter chips player is bringing"
                />
                <p className="text-xs text-gray-500">
                  Count the physical chips the player is bringing to cash out (winnings from table)
                </p>
              </div>

              {/* Grid Layout for Chips, Balances, Breakdown, Summary */}
              <div className="grid grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Chip Breakdown */}
                  {((totalChipsToCashOut && parseFloat(totalChipsToCashOut) > 0) || chipBreakdownTotal > 0) && (
                    <Card className="bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200 shadow-md">
                      <CardContent className="pt-4 pb-3">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                          <Coins className="w-4 h-4" />
                          Chip Breakdown
                        </Label>
                        <ChipInputGrid
                          chips={chipsReceived}
                          onChange={(newChips) => {
                            const newTotal =
                              (parseInt(newChips.chips_100) || 0) * 100 +
                              (parseInt(newChips.chips_500) || 0) * 500 +
                              (parseInt(newChips.chips_1000) || 0) * 1000 +
                              (parseInt(newChips.chips_5000) || 0) * 5000 +
                              (parseInt(newChips.chips_10000) || 0) * 10000;

                            setChipsReceived(newChips);
                            if (newTotal !== parseFloat(totalChipsToCashOut || 0)) {
                              setTotalChipsToCashOut(String(newTotal));
                            }
                          }}
                          title="Physical Chips"
                          showTotal={true}
                          totalLabel="Total Physical Chips"
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Available Cash Balances */}
                  {totalPayoutAmount > 0 && (
                    <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
                      <CardContent className="p-3">
                        <p className="text-sm font-semibold text-gray-900 mb-3">Available Cash Balances</p>
                        
                        <div className="space-y-2">
                          {/* Secondary Wallet - Cash in Hand */}
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                <Wallet className="w-4 h-4 text-green-600" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-700">Deposit Cash</p>
                                <p className="text-xs text-gray-500">Cash in Hand</p>
                              </div>
                            </div>
                            <p className="text-base font-bold text-green-600">
                              ₹{(dashboard?.wallets?.secondary?.cash_balance || 0).toLocaleString("en-IN")}
                            </p>
                          </div>
                          
                          {/* Primary Wallet - Opening Float */}
                          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                                <Home className="w-4 h-4 text-orange-600" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-700">Opening Float</p>
                                <p className="text-xs text-gray-500">Primary Wallet</p>
                              </div>
                            </div>
                            <p className="text-base font-bold text-orange-600">
                              ₹{availableFloat.toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Payout Breakdown */}
                  {totalPayoutAmount > 0 && (() => {
                    const cashInHand = dashboard?.wallets?.secondary?.cash_balance || 0;
                    const primaryFloat = availableFloat;
                    
                    const fromCashInHand = Math.min(totalPayoutAmount, cashInHand);
                    const fromPrimaryFloat = Math.max(0, totalPayoutAmount - fromCashInHand);
                    
                    return (
                      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                        <CardContent className="p-3 space-y-2">
                          <p className="text-sm font-semibold text-blue-900 mb-2">Payout Breakdown</p>
                          
                          <div className="flex justify-between items-center p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                            <span className="text-xs font-medium text-gray-700">Cash to give</span>
                            <span className="text-lg font-bold text-emerald-600">
                              ₹{totalPayoutAmount.toLocaleString("en-IN")}
                            </span>
                          </div>
                          
                          {fromCashInHand > 0 && (
                            <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Wallet className="w-3 h-3 text-green-600" />
                                <span className="text-xs text-gray-700">From Deposit Cash</span>
                              </div>
                              <span className="text-xs font-semibold text-green-600">
                                ₹{fromCashInHand.toLocaleString("en-IN")}
                              </span>
                            </div>
                          )}
                          
                          {fromPrimaryFloat > 0 && (
                            <div className="flex justify-between items-center p-2 bg-orange-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Home className="w-3 h-3 text-orange-600" />
                                <span className="text-xs text-gray-700">From Opening Float</span>
                              </div>
                              <span className="text-xs font-semibold text-orange-600">
                                ₹{fromPrimaryFloat.toLocaleString("en-IN")}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })()}

                  {/* Payout Summary */}
                  {totalValue > 0 && (
                    <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                      <CardContent className="p-3 space-y-2">
                        <p className="text-sm font-semibold text-emerald-900">Payout Summary</p>
                        
                        <div className="flex justify-between text-xs pt-2 border-t border-emerald-200">
                          <span className="text-gray-700">Total Chips to CashOut</span>
                          <span className="font-mono font-semibold text-gray-900">
                            ₹{totalValue.toLocaleString("en-IN")}
                          </span>
                        </div>
                        
                        {includeStoredBalance && storedBalanceAmount > 0 && (
                          <div className="flex justify-between text-xs pt-2 border-t border-emerald-200">
                            <span className="text-gray-700">+ Stored balance</span>
                            <span className="font-mono font-semibold text-gray-900">
                              ₹{storedBalanceAmount.toLocaleString("en-IN")}
                            </span>
                          </div>
                        )}
                        
                        {adjustOutstandingCredit && creditSettleAmount > 0 && (
                          <>
                            <div className="flex justify-between text-xs pt-2 border-t border-emerald-200">
                              <span className="text-gray-700">- Credit settlement</span>
                              <span className="font-mono font-semibold text-red-600">
                                -₹{creditSettleAmount.toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs pt-1 text-gray-500">
                              <span>Remaining outstanding credit</span>
                              <span className="font-mono">
                                ₹{(outstandingCredit - creditSettleAmount).toLocaleString("en-IN")}
                              </span>
                            </div>
                          </>
                        )}
                        
                        <div className="flex justify-between text-sm pt-2 border-t-2 border-emerald-300">
                          <span className="font-bold text-emerald-900">Total Cash to Pay</span>
                          <span className="font-mono font-bold text-emerald-700 text-lg">
                            ₹{totalPayoutAmount.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Notes */}
      {(selectedPlayerId !== null && selectedPlayerId !== undefined) && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-900">Note (optional)</Label>
          <Textarea
            placeholder="Add a note..."
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="resize-none"
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

      {/* House Player CEO Permission */}
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
                  : `${selectedPlayerData.player_name} requires CEO permission`
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
              Confirm CEO Permission
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
            !totalChipsToCashOut ||
            (selectedPlayerId === null || selectedPlayerId === undefined) ||
            ((selectedPlayerData?.is_house_player === 1 || selectedPlayerData?.is_house_player === true) && !ceoPermissionConfirmed)
          }
          variant="destructive"
          className="flex-1 font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Process Payout ${totalPayoutAmount > 0 ? `• ${formatCurrency(totalPayoutAmount)}` : ""}`
          )}
        </Button>
      </div>

      {/* CEO Permission Modal */}
      <Dialog open={showCeoPermissionModal} onOpenChange={setShowCeoPermissionModal}>
        <DialogContent className="sm:max-w-md">
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
                    Confirm CEO Permission
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

      {/* Add Float Modal */}
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
              <span>Need <strong>{formatCurrency(neededAmount)}</strong> more float</span>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Float Amount (₹)</Label>
              <Input
                type="number"
                value={floatAmount}
                onChange={(e) => setFloatAmount(e.target.value)}
                min={neededAmount}
                className="font-mono text-lg text-center"
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
                    Add Float
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
};

export default CashPayoutForm;