import { useState, useEffect } from 'react';
import { AlertCircle, Loader2, CheckCircle, Search, User, ChevronsUpDown, Check, Wallet, CreditCard, Banknote, Building2, Upload, X, Image as ImageIcon } from 'lucide-react';
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
    payment_type: 'cash', // 'cash' or 'online'
    online_bank: '', // 'sbi', 'hdfc', 'icici', 'other'
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(creditData || null);
  const [outstandingCredit, setOutstandingCredit] = useState(0);
  const [loadingCredit, setLoadingCredit] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState(null);
  const [screenshotPublicId, setScreenshotPublicId] = useState(null);

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
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // When payment type changes, update settlement_method
      if (name === 'payment_type') {
        if (value === 'cash') {
          newData.settlement_method = 'cash';
          newData.online_bank = '';
          handleRemoveScreenshot();
        } else if (value === 'online') {
          // Don't set settlement_method yet, wait for bank selection
          newData.settlement_method = '';
        }
      }
      
      // When online bank is selected, update settlement_method
      if (name === 'online_bank' && value) {
        newData.settlement_method = `online_${value}`;
      }
      
      // When payment mode changes to cash, clear screenshot
      if (name === 'settlement_method' && value === 'cash') {
        newData.payment_type = 'cash';
        newData.online_bank = '';
        handleRemoveScreenshot();
      }
      
      return newData;
    });
    setError(null);
  };

  const handleScreenshotSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setScreenshot(file);

    // Preview
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

      // Get API base URL
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

    // Validate online bank selection
    if (formData.payment_type === 'online' && !formData.online_bank) {
      setError('Please select a bank for online payment');
      return;
    }

    // Validate screenshot for online payments (MANDATORY)
    const isOnlinePayment = formData.settlement_method && formData.settlement_method.startsWith('online_');
    if (isOnlinePayment && !screenshotUrl) {
      setError('Payment screenshot is required for online payments');
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
        notes: formData.notes || `Credit settlement for ${formData.player_name}`,
        screenshot_url: screenshotUrl || null,
        screenshot_public_id: screenshotPublicId || null
      });

      setSuccess(result.message || `✅ Credit settled successfully! Remaining balance: ₹${result.remaining_credit?.toFixed(2) || 0}`);

      // Update outstanding credit
      setOutstandingCredit(result.remaining_credit || 0);

      // Reset form
      setFormData(prev => ({
        ...prev,
        settlement_amount: '',
        payment_type: 'cash',
        online_bank: '',
        settlement_method: 'cash',
        notes: ''
      }));
      handleRemoveScreenshot();

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
              
              <div className="text-left">
                {loadingCredit ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                ) : (
                  <>
                    <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                      <CreditCard className="w-3 h-3" />
                      Outstanding Credits
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
          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-900">Settlement Method</Label>
            
            {/* First Level: Cash or Online */}
            <div className="grid grid-cols-2 gap-3">
              <label 
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.payment_type === 'cash' 
                    ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                    : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment_type"
                  value="cash"
                  checked={formData.payment_type === 'cash'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <Banknote className={`w-5 h-5 ${formData.payment_type === 'cash' ? 'text-emerald-600' : 'text-gray-400'}`} />
                <span className={`text-base font-semibold ${formData.payment_type === 'cash' ? 'text-emerald-700' : 'text-gray-600'}`}>
                  Cash
                </span>
                {formData.payment_type === 'cash' && (
                  <Check className="w-5 h-5 text-emerald-600 ml-auto" />
                )}
              </label>

              <label 
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.payment_type === 'online' 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment_type"
                  value="online"
                  checked={formData.payment_type === 'online'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <CreditCard className={`w-5 h-5 ${formData.payment_type === 'online' ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className={`text-base font-semibold ${formData.payment_type === 'online' ? 'text-blue-700' : 'text-gray-600'}`}>
                  Online
                </span>
                {formData.payment_type === 'online' && (
                  <Check className="w-5 h-5 text-blue-600 ml-auto" />
                )}
              </label>
            </div>

            {/* Second Level: Bank Options (only show when Online is selected) */}
            {formData.payment_type === 'online' && (
              <div className="pl-4 border-l-2 border-blue-300 space-y-2">
                <Label className="text-sm font-medium text-gray-700">Select Bank</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'sbi', label: 'SBI', icon: Building2 },
                    { value: 'hdfc', label: 'HDFC', icon: Building2 },
                    { value: 'icici', label: 'ICICI', icon: Building2 },
                    { value: 'other', label: 'Other', icon: CreditCard }
                  ].map((bank) => {
                    const Icon = bank.icon;
                    return (
                      <label 
                        key={bank.value} 
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.online_bank === bank.value 
                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                            : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="online_bank"
                          value={bank.value}
                          checked={formData.online_bank === bank.value}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <Icon className={`w-4 h-4 ${formData.online_bank === bank.value ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${formData.online_bank === bank.value ? 'text-blue-700' : 'text-gray-600'}`}>
                          {bank.label}
                        </span>
                        {formData.online_bank === bank.value && (
                          <Check className="w-4 h-4 text-blue-600 ml-auto" />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Screenshot Upload - MANDATORY for Online Payment */}
          {formData.settlement_method && formData.settlement_method.startsWith('online_') && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">
                Payment Screenshot <span className="text-red-500">*</span>
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  id="screenshot-input-settle"
                  accept="image/*"
                  onChange={handleScreenshotSelect}
                  disabled={uploadingScreenshot}
                  className="hidden"
                />
                <label htmlFor="screenshot-input-settle" className="cursor-pointer flex flex-col items-center gap-2">
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
          )}

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