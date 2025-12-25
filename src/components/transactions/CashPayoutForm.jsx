import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useSession } from "../../hooks/useSession";
import { usePlayerSearch } from "../../hooks/usePlayerSearch";
import transactionService from "../../services/transaction.service";
import cashierService from "../../services/cashier.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Coins, 
  User, 
  ChevronsUpDown, 
  Check, 
  Banknote, 
  CreditCard, 
  ArrowRight,
  Wallet,
  Phone
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

  const handleSelectPlayer = (player) => {
    selectPlayer(player);
    setSelectedPlayerId(player.player_id);
    setSearchQuery(player.player_name);
    setFormData(prev => ({
      ...prev,
      player_name: player.player_name,
      phone_number: player.phone_number || "",
    }));
    setOpen(false);
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
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="space-y-6">
      {/* Available Float Badge */}
      <Card className="bg-gradient-to-r from-slate-50 to-gray-100 border-slate-200">
        <CardContent className="p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-medium text-gray-600">Available Float</span>
          </div>
          <span className="text-2xl font-black text-slate-800">{formatCurrency(availableFloat)}</span>
        </CardContent>
      </Card>

      {/* ✅ Warning if payout exceeds float - but still allow transaction */}
      {netCashPayout > availableFloat && totalValue > 0 && (
        <Alert className="border-orange-300 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Low Float Warning:</strong> This payout (₹{netCashPayout.toLocaleString()}) exceeds available float (₹{availableFloat.toLocaleString()}). 
            <br/>Transaction will proceed, but consider adding ₹{(netCashPayout - availableFloat).toLocaleString()} float soon.
          </AlertDescription>
        </Alert>
      )}

      {/* Player Search with Command */}
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
              {selectedPlayerId && formData.player_name ? (
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
      {selectedPlayerId && loadingBalance && (
        <div className="flex items-center gap-2 text-gray-500 py-3 px-4 bg-gray-50 rounded-lg">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading player info...</span>
        </div>
      )}
      
      {selectedPlayerId && chipBalance && !loadingBalance && (
        <div className="grid grid-cols-2 gap-3">
          
          {outstandingCredit > 0 && (
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CreditCard className="w-4 h-4 text-orange-600" />
                  <p className="text-xs text-orange-600 font-medium">Outstanding Credit</p>
                </div>
                <p className="text-xl font-bold text-orange-800">{formatCurrency(outstandingCredit)}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Chip Breakdown Input */}
      {selectedPlayerId && (
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-md">
          <CardContent className="pt-5 pb-4">
            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <Coins className="w-4 h-4" />
              Chips Received from Player *
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
                    value={chipsReceived[chip.key] || ''}
                    onChange={(e) => handleChipCountChange(chip.key, e.target.value)}
                    className={`text-center text-lg font-bold h-12 border-2 ${chip.colorClass}`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency((parseInt(chipsReceived[chip.key]) || 0) * chip.value)}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Total Display */}
            <div className="mt-5 pt-4 border-t border-slate-200 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Total Chips</span>
              <span className={`text-3xl font-black ${totalValue > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                {formatCurrency(totalValue)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settlement Preview */}
      {totalValue > 0 && selectedPlayerId && (
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-md">
          <CardContent className="pt-5 pb-4 space-y-3">
            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Banknote className="w-4 h-4" />
              Payout Calculation
            </Label>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Chips Returned</span>
                <span className="font-semibold">{formatCurrency(totalValue)}</span>
              </div>
              {creditToSettle > 0 && (
                <div className="flex justify-between text-sm text-orange-600">
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-3 h-3" />
                    Auto-Settle Credit
                  </span>
                  <span className="font-semibold">-{formatCurrency(creditToSettle)}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-emerald-200">
                <span className="font-bold text-gray-800 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Cash to Pay
                </span>
                <span className="text-3xl font-black text-emerald-600">{formatCurrency(netCashPayout)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {selectedPlayerId && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Notes (Optional)</Label>
          <Input
            placeholder="Additional notes..."
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
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
          disabled={loading || totalValue === 0 || !selectedPlayerId}
          className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg disabled:shadow-none"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Process Payout {totalValue > 0 && `• ${formatCurrency(netCashPayout)}`}
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

      {/* Add Float Modal - Only shown when backend explicitly asks for it */}
      <Dialog open={showAddFloatModal} onOpenChange={setShowAddFloatModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-orange-600" />
              Add Cash Float
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Alert className="border-orange-300 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                Backend requires <strong>{formatCurrency(neededAmount)}</strong> more float to process this payout
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Float Amount (₹)</Label>
              <Input
                type="number"
                value={floatAmount}
                onChange={(e) => setFloatAmount(e.target.value)}
                min={neededAmount}
                className="h-12 text-lg font-bold text-center"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleAddCashFloat}
                disabled={addingFloat || !floatAmount || parseFloat(floatAmount) <= 0}
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              >
                {addingFloat ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</>
                ) : (
                  <><Plus className="w-4 h-4 mr-2" />Add {formatCurrency(parseFloat(floatAmount) || 0)}</>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowAddFloatModal(false)} disabled={addingFloat}>
                Cancel
              </Button>
            </div>
            <p className="text-xs text-center text-gray-500">
              After adding float, click "Process Payout" again
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
};

export default CashPayoutForm;