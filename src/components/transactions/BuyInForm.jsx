import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePlayerSearch } from '../../hooks/usePlayerSearch';
import { useSession } from '../../contexts/Sessioncontext';
import transactionService from '../../services/transaction.service';
import promotionService from '../../services/promotion.service';
import cashierService from '../../services/cashier.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
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
  Gift,
  CreditCard,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react';

const BuyInForm = ({ onSuccess, onCancel }) => {
  const { token } = useAuth();
  const { dashboard } = useSession();
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
  const [activePromotion, setActivePromotion] = useState(null);
  const [bonusAmount, setBonusAmount] = useState(0);
  const [bonusMessage, setBonusMessage] = useState('');
  const [checkingPromotion, setCheckingPromotion] = useState(false);
  const [applyBonus, setApplyBonus] = useState(false); // User choice: apply bonus or not
  const [availablePromotion, setAvailablePromotion] = useState(null); // Available promotion (not yet applied)
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState(null);
  const [screenshotPublicId, setScreenshotPublicId] = useState(null);
  const [chipWarning, setChipWarning] = useState('');
  
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
    amount: '',
    notes: '',
    chips_100: '',
    chips_500: '',
    chips_1000: '',
    chips_5000: '',
    chips_10000: ''
  });

  // Load players on mount
  useEffect(() => {
    if (token) {
      console.log('🔍 Loading players with token:', token ? 'YES' : 'NO');
      loadAllPlayers(token, { reuseExisting: true });
    }
  }, [token]);

  // Check for available promotions when amount changes (DO NOT auto-apply)
  useEffect(() => {
    const checkPromotions = async () => {
      const depositAmount = parseFloat(formData.amount) || 0;
      
      // Check promotions as soon as amount is entered (even without player selected for new players)
      if (!depositAmount || depositAmount <= 0 || !token) {
        setAvailablePromotion(null);
        setActivePromotion(null);
        setBonusAmount(0);
        setBonusMessage('');
        setApplyBonus(false);
        return;
      }

      setCheckingPromotion(true);
      try {
        // Check promotions - pass playerId only if selected, otherwise null (for new players)
        const response = await promotionService.getActivePromotionsForDeposit(
          token,
          depositAmount,
          selectedPlayerId || null
        );

        if (response.success && response.data && response.data.length > 0) {
          // Store available promotion but DON'T auto-apply
          const promotion = response.data[0];
          setAvailablePromotion(promotion);
          // Only apply if user has selected "With Bonus"
          if (applyBonus) {
            setActivePromotion(promotion);
            // Ensure bonusAmount is a number
            setBonusAmount(parseFloat(promotion.bonus_amount) || 0);
          } else {
            setActivePromotion(null);
            setBonusAmount(0);
          }
          setBonusMessage('');
        } else {
          setAvailablePromotion(null);
          setActivePromotion(null);
          setBonusAmount(0);
          setBonusMessage('');
          setApplyBonus(false);
        }
      } catch (error) {
        console.error('Error checking promotions:', error);
        // Check if it's a restriction message
        const errorMessage = error.message || '';
        if (errorMessage && (errorMessage.includes('already taken') || errorMessage.includes('limit reached'))) {
          setBonusMessage(errorMessage);
          setAvailablePromotion(null);
          setActivePromotion(null);
          setBonusAmount(0);
          setApplyBonus(false);
        } else {
          // Silent fail - no promotion available is not an error
          setAvailablePromotion(null);
          setActivePromotion(null);
          setBonusAmount(0);
          setBonusMessage('');
          setApplyBonus(false);
        }
      } finally {
        setCheckingPromotion(false);
      }
    };

    // Debounce the check - reduced to 300ms for faster response
    const timeoutId = setTimeout(() => {
      checkPromotions();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [formData.amount, selectedPlayerId, token, applyBonus]);

  // When applyBonus changes, update active promotion and recalculate chips
  useEffect(() => {
    if (applyBonus && availablePromotion) {
      setActivePromotion(availablePromotion);
      // Ensure bonusAmount is a number
      setBonusAmount(parseFloat(availablePromotion.bonus_amount) || 0);
    } else {
      setActivePromotion(null);
      setBonusAmount(0);
    }
    
    // Recalculate chip breakdown when bonus selection changes
    const depositAmount = parseFloat(formData.amount) || 0;
    if (depositAmount > 0) {
      // If bonus is applied, calculate for total chips (deposit + bonus)
      // Otherwise, calculate for deposit amount only
      const totalForChips = applyBonus && availablePromotion 
        ? depositAmount + (parseFloat(availablePromotion.bonus_amount) || 0)
        : depositAmount;
      const chipBreakdown = calculateChipBreakdownFromAmount(totalForChips);
      setFormData(prev => ({ ...prev, ...chipBreakdown }));
    }
  }, [applyBonus, availablePromotion]);

  // Calculate chip breakdown when amount changes
  useEffect(() => {
    const depositAmount = parseFloat(formData.amount) || 0;
    if (depositAmount > 0) {
      // If bonus is applied, calculate for total chips (deposit + bonus)
      // Otherwise, calculate for deposit amount only
      const totalForChips = applyBonus && activePromotion 
        ? depositAmount + bonusAmount
        : depositAmount;
      const chipBreakdown = calculateChipBreakdownFromAmount(totalForChips);
      setFormData(prev => ({ ...prev, ...chipBreakdown }));
    }
  }, [formData.amount, applyBonus, activePromotion, bonusAmount]);

  // Check chip inventory availability when chip breakdown changes (including manual entry)
  useEffect(() => {
    if (!dashboard?.chip_inventory?.current_in_hand) {
      setChipWarning('');
      return;
    }

    // Get current chip values from form (including manual entries)
    const needed = {
      chips_100: parseInt(formData.chips_100) || 0,
      chips_500: parseInt(formData.chips_500) || 0,
      chips_1000: parseInt(formData.chips_1000) || 0,
      chips_5000: parseInt(formData.chips_5000) || 0,
      chips_10000: parseInt(formData.chips_10000) || 0,
    };

    const current = dashboard.chip_inventory.current_in_hand;
    const insufficient = [];
    
    if (needed.chips_100 > (current.chips_100 || 0)) {
      insufficient.push(`Add ₹100 chips (need ${needed.chips_100}, have ${current.chips_100 || 0})`);
    }
    if (needed.chips_500 > (current.chips_500 || 0)) {
      insufficient.push(`Add ₹500 chips (need ${needed.chips_500}, have ${current.chips_500 || 0})`);
    }
    if (needed.chips_1000 > (current.chips_1000 || 0)) {
      insufficient.push(`Add ₹1K chips (need ${needed.chips_1000}, have ${current.chips_1000 || 0})`);
    }
    if (needed.chips_5000 > (current.chips_5000 || 0)) {
      insufficient.push(`Add ₹5K chips (need ${needed.chips_5000}, have ${current.chips_5000 || 0})`);
    }
    if (needed.chips_10000 > (current.chips_10000 || 0)) {
      insufficient.push(`Add ₹10K chips (need ${needed.chips_10000}, have ${current.chips_10000 || 0})`);
    }

    if (insufficient.length > 0) {
      setChipWarning(insufficient.join('. ') + '. Use Top Up Float to add chips.');
    } else {
      setChipWarning('');
    }
  }, [formData.chips_100, formData.chips_500, formData.chips_1000, formData.chips_5000, formData.chips_10000, dashboard]);

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

  // Calculate total chips (deposit + bonus only if user selected "With Bonus")
  const calculateTotalChips = () => {
    const depositAmount = parseFloat(formData.amount) || 0;
    // Only add bonus if user explicitly selected "With Bonus"
    if (applyBonus && activePromotion) {
      const bonus = parseFloat(bonusAmount) || 0;
      return depositAmount + bonus;
    }
    return depositAmount;
  };

  // Calculate total from manual chip inputs
  const calculateTotalFromChips = () => {
    return (
      (parseInt(formData.chips_100) || 0) * 100 +
      (parseInt(formData.chips_500) || 0) * 500 +
      (parseInt(formData.chips_1000) || 0) * 1000 +
      (parseInt(formData.chips_5000) || 0) * 5000 +
      (parseInt(formData.chips_10000) || 0) * 10000
    );
  };

  // Get chip breakdown object for API
  const getChipBreakdown = () => {
    // Always use chip inputs from form (they are auto-calculated when amount is entered)
    return {
      chips_100: parseInt(formData.chips_100) || 0,
      chips_500: parseInt(formData.chips_500) || 0,
      chips_1000: parseInt(formData.chips_1000) || 0,
      chips_5000: parseInt(formData.chips_5000) || 0,
      chips_10000: parseInt(formData.chips_10000) || 0
    };
  };

  // Auto-calculate chip breakdown when amount changes
  // IMPORTANT: amount is in RUPEES, not chip count
  const calculateChipBreakdownFromAmount = (amount) => {
    const totalValue = parseFloat(amount) || 0;
    if (totalValue <= 0) {
      return { chips_100: '', chips_500: '', chips_1000: '', chips_5000: '', chips_10000: '' };
    }
    
    // Calculate how many chips of each denomination needed to make up the total value
    let remaining = totalValue;
    
    const chips10000 = Math.floor(remaining / 10000);
    remaining = remaining % 10000;
    
    const chips5000 = Math.floor(remaining / 5000);
    remaining = remaining % 5000;
    
    const chips1000 = Math.floor(remaining / 1000);
    remaining = remaining % 1000;
    
    const chips500 = Math.floor(remaining / 500);
    remaining = remaining % 500;
    
    const chips100 = Math.floor(remaining / 100);
    
    return {
      chips_100: chips100 > 0 ? chips100.toString() : '',
      chips_500: chips500 > 0 ? chips500.toString() : '',
      chips_1000: chips1000 > 0 ? chips1000.toString() : '',
      chips_5000: chips5000 > 0 ? chips5000.toString() : '',
      chips_10000: chips10000 > 0 ? chips10000.toString() : ''
    };
  };

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // When amount changes, useEffect will handle promotion check and chip breakdown
      // Don't auto-calculate here - let the promotion useEffect handle it
      if (field === 'amount' && value) {
        // Clear previous promotion when amount changes
        setActivePromotion(null);
        setBonusAmount(0);
        setBonusMessage('');
        // useEffect will check promotions and calculate chips automatically
      }
      
      // When payment mode changes to cash, clear screenshot
      if (field === 'payment_mode' && value === 'cash') {
        handleRemoveScreenshot();
      }
      
      // When chip inputs change manually, don't auto-update amount
      // User controls chips manually when bonus is involved
      if (['chips_100', 'chips_500', 'chips_1000', 'chips_5000', 'chips_10000'].includes(field)) {
        // Don't update amount - let user manually manage
        return updated;
      }
      
      return updated;
    });
    setError('');
  };

  const handleScreenshotSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setScreenshot(file);
    setError('');

    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setScreenshotPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload to backend
    await uploadScreenshot(file);
  };

  const uploadScreenshot = async (file) => {
    setUploadingScreenshot(true);
    try {
      const formData = new FormData();
      formData.append('screenshot', file);

      // Get API base URL (same pattern as api.service.js)
      const API_BASE_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:5000/api'
        : 'https://royalflush.red/api';

      const response = await fetch(`${API_BASE_URL}/transactions/upload-screenshot`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to upload screenshot');
      }

      const result = await response.json();
      if (result.success) {
        setScreenshotUrl(result.data.url);
        setScreenshotPublicId(result.data.public_id);
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Screenshot upload error:', error);
      setError(error.message || 'Failed to upload screenshot');
      setScreenshot(null);
      setScreenshotPreview(null);
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const handleRemoveScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
    setScreenshotUrl(null);
    setScreenshotPublicId(null);
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

    const depositAmount = parseFloat(formData.amount) || 0;
    const totalChips = calculateTotalChips();

    if (useStoredBalance) {
      const chipTotal = calculateTotalFromChips();
      if (chipTotal <= 0) {
        setError('Enter chip breakdown to redeem from stored balance');
        return;
      }
      if (chipTotal > storedBalance) {
        setError(`Insufficient stored balance. Available: ${formatCurrency(storedBalance)}`);
        return;
      }
    } else {
      if (depositAmount <= 0 && calculateTotalFromChips() <= 0) {
        setError('Enter deposit amount or chip breakdown');
        return;
      }
      
      // Validate screenshot for online payments (MANDATORY)
      if (formData.payment_mode !== 'cash' && !screenshotUrl) {
        setError('Payment screenshot is required for online payments');
        return;
      }
    }

    // Check chip inventory before submission
    if (chipWarning) {
      setError('Insufficient chips in inventory. Please add chips using Top Up Float before processing this buy-in.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const chipBreakdown = getChipBreakdown();
      let finalAmount;
      let finalChips;
      
      if (useStoredBalance) {
        // When using stored balance, use chip breakdown total as amount
        const chipTotal = calculateTotalFromChips();
        finalAmount = chipTotal;
        finalChips = chipTotal;
      } else {
        finalAmount = depositAmount;
        // Total chips = deposit + bonus (only if user selected "With Bonus")
        finalChips = applyBonus && activePromotion ? depositAmount + bonusAmount : depositAmount;
      }

      // Validate chip breakdown matches the total chips amount (including bonus)
      const chipTotal = calculateTotalFromChips();
      if (useStoredBalance) {
        if (chipTotal !== finalAmount) {
          setError(`Chip breakdown (${formatCurrency(chipTotal)}) must match stored balance amount (${formatCurrency(finalAmount)})`);
          setLoading(false);
          return;
        }
        
        await transactionService.redeemStoredChips(token, {
          player_id: selectedPlayerId,
          player_name: formData.player_name.trim(),
          phone_number: formData.phone_number.trim(),
          amount: finalAmount,
          chip_breakdown: chipBreakdown,
          notes: formData.notes.trim() || 'Redeemed from stored balance'
        });
      } else {
        // Validate chip breakdown
        // If bonus is applied, chip breakdown should match total chips (deposit + bonus)
        // Otherwise, it should match deposit amount only
        const expectedAmount = applyBonus && activePromotion ? finalChips : depositAmount;
        if (Math.abs(chipTotal - expectedAmount) > 0.01) {
          if (applyBonus && activePromotion) {
            setError(`Chip breakdown (${formatCurrency(chipTotal)}) must match total chips (${formatCurrency(finalChips)} = Deposit ${formatCurrency(depositAmount)} + Bonus ${formatCurrency(bonusAmount)})`);
          } else {
            setError(`Chip breakdown (${formatCurrency(chipTotal)}) must match deposit amount (${formatCurrency(depositAmount)})`);
          }
          setLoading(false);
          return;
        }
        
        // Create buy-in transaction
        // When bonus is applied, chip_breakdown includes bonus chips
        // When no bonus, chip_breakdown matches deposit amount
        const buyInData = {
          player_name: formData.player_name.trim(),
          phone_number: formData.phone_number.trim(),
          amount: finalAmount, // Cash amount deposited
          chips_amount: finalChips, // Total chips given (deposit + bonus if applicable)
          payment_mode: formData.payment_mode,
          chip_breakdown: chipBreakdown, // Breakdown for total chips (includes bonus if applied)
          promotion_id: (applyBonus && activePromotion) ? activePromotion.promotion_id : null,
          screenshot_url: screenshotUrl || null,
          screenshot_public_id: screenshotPublicId || null,
          notes: formData.notes.trim() || (applyBonus && activePromotion ? `Deposit: ${formatCurrency(depositAmount)}, Bonus: ${formatCurrency(bonusAmount)}` : null)
        };

        const result = await transactionService.createBuyIn(token, buyInData);
        
        // If promotion was applied, claim the bonus
        if (activePromotion && result.transaction_id) {
          try {
            // The backend should handle promotion claim automatically, but we can verify
            console.log('Promotion bonus applied:', activePromotion.promotion_name);
          } catch (promoError) {
            console.error('Error claiming promotion bonus:', promoError);
            // Don't fail the transaction if promotion claim fails
          }
        }
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
    const depositAmount = parseFloat(formData.amount) || 0;
    const totalChips = calculateTotalChips();

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
              {formatCurrency(totalChips)}
            </p>
            {activePromotion && bonusAmount > 0 && (
              <div className="mt-2 text-sm text-green-600">
                Deposit: {formatCurrency(depositAmount)} + Bonus: {formatCurrency(bonusAmount)}
              </div>
            )}
            <Badge className="mt-3" variant="secondary">
              {useStoredBalance ? 'Redeemed from stored' : formData.payment_mode.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  const depositAmount = parseFloat(formData.amount) || 0;
  const totalChips = calculateTotalChips();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Section */}
      <div className="space-y-2 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Buy-in</h2>
            <p className="text-sm text-gray-500">Player deposits cash for chips</p>
          </div>
        </div>
      </div>

      {/* Player Selection */}
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
                <span className="text-gray-900">{formData.player_name}</span>
              ) : (
                <span className="text-gray-400 flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search player by name or code...
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
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-bold flex-shrink-0">
                                  {player.player_name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 truncate">
                                    {player.player_name}
                                  </p>
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

      {/* New Player Form */}
      {isNewPlayer && (selectedPlayerId === null || selectedPlayerId === undefined) && (
        <Card className="border-2 border-dashed border-blue-300 bg-blue-50">
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <UserPlus className="w-5 h-5" />
              <span className="font-semibold">New Player Details</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900">Player Name *</Label>
                <Input
                  placeholder="Enter player name"
                  value={formData.player_name}
                  onChange={(e) => handleChange('player_name', e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <Input
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={formData.phone_number}
                    onChange={(e) => handleChange('phone_number', e.target.value.replace(/\D/g, ''))}
                    className="h-11 pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phone Number (for existing player if empty) */}
      {(selectedPlayerId !== null && selectedPlayerId !== undefined) && !formData.phone_number &&  (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-900">Phone Number *</Label>
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

      {/* Payment Method */}
      {((selectedPlayerId !== null && selectedPlayerId !== undefined) || isNewPlayer) &&  (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-900">Payment Method</Label>
          <div className={`flex gap-3 ${selectedPlayerId && !loadingBalance && storedBalance > 0 ? 'grid grid-cols-3' : 'grid grid-cols-2'}`}>
            <button
              type="button"
              onClick={() => {
                setUseStoredBalance(false);
                handleChange('payment_mode', 'cash');
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                !useStoredBalance && formData.payment_mode === 'cash'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  !useStoredBalance && formData.payment_mode === 'cash' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <Wallet className={`w-5 h-5 ${
                    !useStoredBalance && formData.payment_mode === 'cash' ? 'text-green-600' : 'text-gray-400'
                  }`} />
                </div>
                <span className={`text-sm font-medium ${
                  !useStoredBalance && formData.payment_mode === 'cash' ? 'text-green-600' : 'text-gray-500'
                }`}>
                  Cash
                </span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setUseStoredBalance(false);
                // Set to online_sbi as default when Online is clicked
                if (formData.payment_mode === 'cash' || useStoredBalance) {
                  handleChange('payment_mode', 'online_sbi');
                }
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                !useStoredBalance && formData.payment_mode !== 'cash'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  !useStoredBalance && formData.payment_mode !== 'cash' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <CreditCard className={`w-5 h-5 ${
                    !useStoredBalance && formData.payment_mode !== 'cash' ? 'text-green-600' : 'text-gray-400'
                  }`} />
                </div>
                <span className={`text-sm font-medium ${
                  !useStoredBalance && formData.payment_mode !== 'cash' ? 'text-green-600' : 'text-gray-500'
                }`}>
                  Online
                </span>
              </div>
            </button>
            
            {/* Stored Balance Option - Show when available */}
            {selectedPlayerId && !loadingBalance && storedBalance > 0 && (
              <button
                type="button"
                onClick={() => {
                  setUseStoredBalance(true);
                  handleChange('payment_mode', 'cash'); // Reset payment mode
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  useStoredBalance
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    useStoredBalance ? 'bg-amber-100' : 'bg-gray-100'
                  }`}>
                    <Coins className={`w-5 h-5 ${
                      useStoredBalance ? 'text-amber-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={`text-sm font-medium ${
                      useStoredBalance ? 'text-amber-600' : 'text-gray-500'
                    }`}>
                      Stored
                    </span>
                    <span className="text-xs text-gray-400">{formatCurrency(storedBalance)}</span>
                  </div>
                </div>
              </button>
            )}
          </div>
          
          {/* Online Payment Options - Show when Online is selected */}
          {!useStoredBalance && formData.payment_mode !== 'cash' && (
            <>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleChange('payment_mode', 'online_sbi')}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    formData.payment_mode === 'online_sbi'
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  SBI
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('payment_mode', 'online_hdfc')}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    formData.payment_mode === 'online_hdfc'
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  HDFC
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('payment_mode', 'online_icici')}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    formData.payment_mode === 'online_icici'
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  ICICI
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('payment_mode', 'online_other')}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    formData.payment_mode === 'online_other'
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Other
                </button>
              </div>

              {/* Screenshot Upload - MANDATORY for Online Payment */}
              <div className="mt-4 space-y-2">
                <Label className="text-sm font-medium text-gray-900">
                  Payment Screenshot <span className="text-red-500">*</span>
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    id="screenshot-input"
                    accept="image/*"
                    onChange={handleScreenshotSelect}
                    disabled={uploadingScreenshot}
                    className="hidden"
                  />
                  <label htmlFor="screenshot-input" className="cursor-pointer flex flex-col items-center gap-2">
                    {screenshotPreview ? (
                      <div className="relative w-full">
                        <img
                          src={screenshotPreview}
                          alt="Screenshot preview"
                          className="max-h-48 w-full object-contain rounded"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveScreenshot();
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {screenshot && <p className="text-xs text-gray-600 mt-2">{screenshot.name}</p>}
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                          Click to upload payment screenshot
                        </span>
                        <span className="text-xs text-gray-500">
                          PNG, JPG, JPEG up to 5MB
                        </span>
                      </>
                    )}
                  </label>
                </div>
                {uploadingScreenshot && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading screenshot...
                  </div>
                )}
                {screenshotUrl && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Screenshot uploaded successfully
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Bonus Selection - Shows when promotion is available */}
      {!useStoredBalance && formData.amount && parseFloat(formData.amount) > 0 && (
        <>
          {checkingPromotion && (
            <Card className="border border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm text-blue-700">Checking for available promotions...</span>
                </div>
              </CardContent>
            </Card>
          )}
          
          {availablePromotion && !checkingPromotion && (
            <Card className="border border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-900">Bonus Available!</p>
                      <p className="text-xs text-blue-700">{availablePromotion.promotion_name}</p>
                      {/* Show usage count if limit exists */}
                      {availablePromotion.player_limit > 0 && (
                        <p className="text-xs text-blue-600 mt-1">
                          Usage: {availablePromotion.current_usage || 0}/{availablePromotion.player_limit} players
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={!applyBonus ? "default" : "outline"}
                      onClick={() => {
                        setApplyBonus(false);
                        setActivePromotion(null);
                        setBonusAmount(0);
                      }}
                      className="flex-1"
                    >
                      Without Bonus
                    </Button>
                    <Button
                      type="button"
                      variant={applyBonus ? "default" : "outline"}
                      onClick={() => {
                        setApplyBonus(true);
                        setActivePromotion(availablePromotion);
                        // Ensure bonusAmount is a number
                        setBonusAmount(parseFloat(availablePromotion.bonus_amount) || 0);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      With Bonus (+{formatCurrency(availablePromotion.bonus_amount || 0)})
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {applyBonus && activePromotion && bonusAmount > 0 && !checkingPromotion && (
            <Card className="border-2 border-green-300 bg-green-50 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Gift className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-green-900">🎉 Bonus Applied!</p>
                    <p className="text-xs text-green-700 font-medium">{activePromotion.promotion_name}</p>
                  </div>
                </div>
                <div className="space-y-2 pt-3 border-t border-green-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Deposit Amount:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(parseFloat(formData.amount) || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Bonus:</span>
                    <span className="font-bold text-green-600 text-lg">+{formatCurrency(bonusAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-green-200">
                    <span className="font-medium text-gray-900">Total Chips:</span>
                    <span className="font-bold text-green-600 text-lg">{formatCurrency(calculateTotalChips())}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {bonusMessage && !checkingPromotion && (
            <Alert variant="destructive" className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-orange-700">{bonusMessage}</AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Amount Input */}
      {((selectedPlayerId !== null && selectedPlayerId !== undefined) || isNewPlayer) && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-900">Amount (₹)</Label>
          <Input
            type="number"
            placeholder="Enter amount (e.g., 10000)"
            value={formData.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            className="h-12 text-lg"
            min="0"
            disabled={useStoredBalance}
          />
          {useStoredBalance && (
            <p className="text-xs text-gray-500">Using stored balance: {formatCurrency(storedBalance)}</p>
          )}
          {formData.amount && parseFloat(formData.amount) > 0 && !activePromotion && !checkingPromotion && !useStoredBalance && (
            <p className="text-xs text-gray-500">Enter amount to check for available bonus promotions</p>
          )}
        </div>
      )}

      {/* Chip Warning - Show if chips are insufficient */}
      {chipWarning && (
        <Alert variant="destructive" className="border-orange-300 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 font-medium">
            {chipWarning}
          </AlertDescription>
        </Alert>
      )}

      {/* Chip Breakdown - Show when stored balance is selected OR when amount is entered OR when chip values are entered */}
      {((useStoredBalance && ((selectedPlayerId !== null && selectedPlayerId !== undefined) || isNewPlayer)) ||
        (!useStoredBalance && (formData.amount || formData.chips_100 || formData.chips_500 || formData.chips_1000 || formData.chips_5000 || formData.chips_10000))) && (
        <Card className="bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200 shadow-md">
          <CardContent className="pt-5 pb-4">
            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <Coins className="w-4 h-4" />
              Chip Breakdown
            </Label>
            
            <div className="grid grid-cols-5 gap-3">
              {[
                { key: 'chips_100', value: 100, colorClass: 'text-red-600 border-red-200 focus:border-red-400 bg-red-50', label: '₹100' },
                { key: 'chips_500', value: 500, colorClass: 'text-green-600 border-green-200 focus:border-green-400 bg-green-50', label: '₹500' },
                { key: 'chips_1000', value: 1000, colorClass: 'text-yellow-600 border-yellow-200 focus:border-yellow-400 bg-yellow-50', label: '₹1K' },
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
                    value={formData[chip.key] || ''}
                    onChange={(e) => handleChange(chip.key, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                    className={`text-center text-lg font-bold h-12 border-2 ${chip.colorClass}`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency((parseInt(formData[chip.key]) || 0) * chip.value)}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Total Display */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Value:</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(calculateTotalFromChips())}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || chipWarning || ((selectedPlayerId === null || selectedPlayerId === undefined) && !isNewPlayer) ||  (useStoredBalance && calculateTotalFromChips() <= 0) || (!useStoredBalance && depositAmount <= 0 && calculateTotalFromChips() <= 0)}
          className="flex-1 h-12 bg-orange-600 hover:bg-orange-700 text-white"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Process Buy-in
        </Button>
      </div>
    </form>
  );
};

export default BuyInForm;
