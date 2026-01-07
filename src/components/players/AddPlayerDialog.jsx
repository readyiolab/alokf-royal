import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2, CreditCard, UserPlus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';

import playerService from '../../services/player.service';
import { useAuth } from '../../contexts/AuthContext';

export const AddPlayerDialog = ({ isOpen, onClose, onPlayerAdded }) => {
  const { token } = useAuth();

  // Generate referral code (RF + 4 random digits)
  const generateReferralCode = () => {
    const digits = Math.floor(1000 + Math.random() * 9000);
    return `RF${digits}`;
  };

  const [formData, setFormData] = useState({
    player_name: '',
    phone_number: '',
    email: '',
    address: '',
    credit_limit: '',
    notes: '',
    joining_date: new Date().toISOString().split('T')[0], // Today's date
    has_referral: false,
    referral_type: 'player', // player, club, owner
    referral_code: generateReferralCode(),
    referred_by_player_id: null, // ID of the referring player
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [allPlayers, setAllPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [playerCode, setPlayerCode] = useState(''); // Auto-generated player code preview
  const [fieldErrors, setFieldErrors] = useState({}); // Field-level validation errors

  // Validate individual field
  const validateField = (name, value) => {
    const errors = { ...fieldErrors };

    switch (name) {
      case 'player_name':
        if (!value.trim()) {
          errors.player_name = 'Player name is required';
        } else if (value.trim().length < 2) {
          errors.player_name = 'Player name must be at least 2 characters';
        } else if (value.trim().length > 100) {
          errors.player_name = 'Player name must be less than 100 characters';
        } else {
          delete errors.player_name;
        }
        break;
      case 'phone_number':
        if (value && value.trim()) {
          const cleaned = value.replace(/\D/g, '');
          if (cleaned.length !== 10) {
            errors.phone_number = 'Phone number must be exactly 10 digits';
          } else {
            delete errors.phone_number;
          }
        } else {
          delete errors.phone_number;
        }
        break;
      case 'email':
        if (value && value.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value.trim())) {
            errors.email = 'Please enter a valid email address';
          } else {
            delete errors.email;
          }
        } else {
          delete errors.email;
        }
        break;
      case 'credit_limit':
        if (value && value.trim()) {
          const numValue = parseFloat(value);
          if (isNaN(numValue) || numValue < 0) {
            errors.credit_limit = 'Credit limit must be a positive number or 0';
          } else {
            delete errors.credit_limit;
          }
        } else {
          delete errors.credit_limit;
        }
        break;
      default:
        break;
    }
    setFieldErrors(errors);
  };

  // Validate all fields
  const validateAllFields = () => {
    const errors = {};
    
    // Validate player name
    if (!formData.player_name.trim()) {
      errors.player_name = 'Player name is required';
    } else if (formData.player_name.trim().length < 2) {
      errors.player_name = 'Player name must be at least 2 characters';
    } else if (formData.player_name.trim().length > 100) {
      errors.player_name = 'Player name must be less than 100 characters';
    }

    // Validate phone number
    if (formData.phone_number && formData.phone_number.trim()) {
      const cleaned = formData.phone_number.replace(/\D/g, '');
      if (cleaned.length > 0 && cleaned.length !== 10) {
        errors.phone_number = 'Phone number must be exactly 10 digits';
      }
    }

    // Validate email
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = 'Please enter a valid email address';
      }
    }

    // Validate credit limit
    if (formData.credit_limit && formData.credit_limit.trim()) {
      const numValue = parseFloat(formData.credit_limit);
      if (isNaN(numValue) || numValue < 0) {
        errors.credit_limit = 'Credit limit must be a positive number or 0';
      }
    }

    // Check if referral player is required
    if (formData.has_referral && formData.referral_type === 'player' && !formData.referred_by_player_id) {
      errors.referred_by_player_id = 'Please select a referring player';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For phone number, strip non-numeric characters and limit to 10 digits
    let processedValue = value;
    if (name === 'phone_number') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    }
    
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    setError(null);
    // Validate field in real-time
    validateField(name, processedValue);
  };

  const handleCreditLimitChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, credit_limit: value }));
    setError(null);
    validateField('credit_limit', value);
  };

  // Load all players when dialog opens or referral is enabled
  useEffect(() => {
    if (isOpen && formData.has_referral && formData.referral_type === 'player') {
      loadAllPlayers();
    }
  }, [isOpen, formData.has_referral, formData.referral_type]);

  // Generate player code preview when dialog opens
  useEffect(() => {
    if (isOpen) {
      generatePlayerCodePreview();
    }
  }, [isOpen]);

  const loadAllPlayers = async () => {
    try {
      setLoadingPlayers(true);
      const players = await playerService.getAllPlayers();
      setAllPlayers(Array.isArray(players) ? players : []);
    } catch (err) {
      console.error('Error loading players:', err);
      setAllPlayers([]);
    } finally {
      setLoadingPlayers(false);
    }
  };

  const generatePlayerCodePreview = async () => {
    // The backend will generate the actual code, but we can show a preview
    // Format: RF + 4 random digits (e.g., RF1234)
    const previewCode = generateReferralCode(); // Same format as referral code
    setPlayerCode(`Auto-generated (e.g., ${previewCode})`);
  };

  const handleReferralToggle = (checked) => {
    setFormData((prev) => ({ 
      ...prev, 
      has_referral: checked,
      referral_code: checked ? generateReferralCode() : '',
      referred_by_player_id: checked && prev.referral_type === 'player' ? prev.referred_by_player_id : null
    }));
    
    if (checked && formData.referral_type === 'player') {
      loadAllPlayers();
    }
  };

  const handleReferralTypeChange = (value) => {
    setFormData(prev => ({ 
      ...prev, 
      referral_type: value,
      referred_by_player_id: value === 'player' ? prev.referred_by_player_id : null
    }));
    
    if (value === 'player' && formData.has_referral) {
      loadAllPlayers();
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    // Validate all fields
    // Validate all fields and check result
    const isValid = validateAllFields();
    if (!isValid) {
      setError('Please fix the errors in the form');
      return;
    }

    // Additional validation
    if (!formData.player_name.trim()) {
      setError('Player name is required');
      return;
    }

    // Validate referral player selection
    if (formData.has_referral && formData.referral_type === 'player' && !formData.referred_by_player_id) {
      setError('Please select a referring player');
      return;
    }

    try {
      setLoading(true);
      // Build player data object, only including fields that have values
      const playerData = {
        player_name: formData.player_name.trim(),
        joining_date: formData.joining_date || new Date().toISOString().split('T')[0],
      };

      // Only add optional fields if they have values
      if (formData.phone_number && formData.phone_number.trim()) {
        playerData.phone_number = formData.phone_number.trim();
      }

      if (formData.email && formData.email.trim()) {
        playerData.email = formData.email.trim();
      }

      if (formData.address && formData.address.trim()) {
        playerData.address = formData.address.trim();
      }

      if (formData.notes && formData.notes.trim()) {
        playerData.notes = formData.notes.trim();
      }

      if (formData.credit_limit && formData.credit_limit.trim()) {
        const creditLimit = parseFloat(formData.credit_limit);
        if (!isNaN(creditLimit) && creditLimit >= 0) {
          playerData.credit_limit = creditLimit;
        }
      }

      // Only add referral fields if referral is enabled
      if (formData.has_referral) {
        if (formData.referral_code && formData.referral_code.trim()) {
          playerData.referral_code = formData.referral_code.trim();
        }
        if (formData.referral_type) {
          playerData.referred_by_type = formData.referral_type;
        }
        if (formData.referral_type === 'player' && formData.referred_by_player_id) {
          playerData.referred_by_player_id = formData.referred_by_player_id;
        }
      }
      const newPlayer = await playerService.createPlayer(playerData);
      setSuccess('Player added successfully!');

      setTimeout(() => {
        if (onPlayerAdded) onPlayerAdded(newPlayer);
        handleClose();
      }, 1500);
    } catch (err) {
      const errorMessage = err.message || 'Failed to create player';
      setError(errorMessage);

      // Check for duplicate phone number or email errors from backend
      if (errorMessage.toLowerCase().includes('phone number already')) {
        setFieldErrors(prev => ({ ...prev, phone_number: 'This phone number is already registered' }));
      } else if (errorMessage.toLowerCase().includes('email already')) {
        setFieldErrors(prev => ({ ...prev, email: 'This email is already registered' }));
      } else if (errorMessage.toLowerCase().includes('referring player not found')) {
        setFieldErrors(prev => ({ ...prev, referred_by_player_id: 'Referring player not found' }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      player_name: '',
      phone_number: '',
      email: '',
      address: '',
      credit_limit: '',
      notes: '',
      joining_date: new Date().toISOString().split('T')[0],
      has_referral: false,
      referral_type: 'player',
      referral_code: generateReferralCode(),
      referred_by_player_id: null,
    });
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Player</DialogTitle>
          <DialogDescription>
            Register a new player to the system. Fill in the details below.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 py-4">
          {/* Player Name */}
          <div className="grid gap-2">
            <Label htmlFor="player_name">
              Player Name <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="player_name"
                name="player_name"
                value={formData.player_name}
                onChange={handleChange}
                placeholder="Enter player name"
                autoComplete="off"
                className={fieldErrors.player_name ? 'border-red-500 pr-10' : ''}
              />
              {fieldErrors.player_name ? (
                <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
              ) : formData.player_name && !fieldErrors.player_name ? (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
              ) : null}
            </div>
            {fieldErrors.player_name && (
              <p className="text-xs text-red-500">{fieldErrors.player_name}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="grid gap-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <div className="relative">
              <Input
                id="phone_number"
                name="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                maxLength={10}
                className={fieldErrors.phone_number ? 'border-red-500 pr-10' : ''}
              />
              {fieldErrors.phone_number ? (
                <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
              ) : formData.phone_number && !fieldErrors.phone_number ? (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
              ) : null}
            </div>
            {fieldErrors.phone_number && (
              <p className="text-xs text-red-500">{fieldErrors.phone_number}</p>
            )}
          </div>

          {/* Email - Optional */}
          <div className="grid gap-2">
            <Label htmlFor="email">Email Address <span className="text-gray-400 text-xs font-normal">(Optional)</span></Label>
            <div className="relative">
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="player@example.com"
                className={fieldErrors.email ? 'border-red-500 pr-10' : ''}
              />
              {fieldErrors.email ? (
                <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
              ) : formData.email && !fieldErrors.email ? (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
              ) : null}
            </div>
            {fieldErrors.email && (
              <p className="text-xs text-red-500">{fieldErrors.email}</p>
            )}
          </div>

          {/* Address */}
          <div className="grid gap-2 col-span-3">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter address"
              rows={2}
            />
          </div>

          {/* Joining Date */}
          {/* <div className="grid gap-2">
            <Label htmlFor="joining_date">Joining Date</Label>
            <Input
              id="joining_date"
              name="joining_date"
              type="date"
              value={formData.joining_date}
              onChange={handleChange}
            />
          </div> */}

          

          {/* Credit Limit - Optional */}
          <div className="grid gap-2">
            <Label htmlFor="credit_limit" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Credit Limit <span className="text-gray-400 text-xs font-normal">(Optional)</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
              <Input
                id="credit_limit"
                name="credit_limit"
                type="number"
                min="0"
                value={formData.credit_limit}
                onChange={handleCreditLimitChange}
                placeholder="0 = No credit allowed"
                className={`pl-8 ${fieldErrors.credit_limit ? 'border-red-500 pr-10' : ''}`}
              />
              {fieldErrors.credit_limit ? (
                <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
              ) : formData.credit_limit && !fieldErrors.credit_limit ? (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
              ) : null}
            </div>
            {fieldErrors.credit_limit ? (
              <p className="text-xs text-red-500">{fieldErrors.credit_limit}</p>
            ) : (
              <p className="text-xs text-gray-500">Set 0 or leave empty to disable credit for this player</p>
            )}
          </div>

          {/* Referral Toggle - Optional */}
          <div className="grid gap-2 col-span-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <Label htmlFor="has_referral" className="text-base font-medium">
                  Referred By <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  Enable if this player was referred by someone
                </p>
              </div>
              <Switch
                id="has_referral"
                checked={formData.has_referral}
                onCheckedChange={handleReferralToggle}
              />
            </div>
          </div>

          {/* Referral Type and Code */}
          {formData.has_referral && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="referral_type">Referral Type</Label>
                <Select 
                  value={formData.referral_type} 
                  onValueChange={handleReferralTypeChange}
                >
                  <SelectTrigger id="referral_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="player">Player</SelectItem>
                    <SelectItem value="club">Club</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Show Player Dropdown if referral type is "player" */}
              {formData.referral_type === 'player' ? (
                <div className="grid gap-2">
                  <Label htmlFor="referred_by_player">Referred By Player</Label>
                  <div className="relative">
                    <Select 
                      value={formData.referred_by_player_id?.toString() || ''} 
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, referred_by_player_id: parseInt(value) }));
                        setFieldErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.referred_by_player_id;
                          return newErrors;
                        });
                      }}
                      disabled={loadingPlayers}
                    >
                      <SelectTrigger 
                        id="referred_by_player"
                        className={fieldErrors.referred_by_player_id ? 'border-red-500' : ''}
                      >
                        <SelectValue placeholder={loadingPlayers ? "Loading..." : "Select a player"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {allPlayers.length === 0 ? (
                          <div className="p-2 text-sm text-gray-500 text-center">
                            {loadingPlayers ? "Loading..." : "No players found"}
                          </div>
                        ) : (
                          allPlayers.map((player) => (
                            <SelectItem key={player.player_id} value={player.player_id.toString()}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{player.player_name}</span>
                                <span className="text-xs text-gray-500">({player.player_code || player.player_id})</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {fieldErrors.referred_by_player_id ? (
                      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 pointer-events-none" />
                    ) : formData.referred_by_player_id && !fieldErrors.referred_by_player_id ? (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500 pointer-events-none" />
                    ) : null}
                  </div>
                  {fieldErrors.referred_by_player_id ? (
                    <p className="text-xs text-red-500">{fieldErrors.referred_by_player_id}</p>
                  ) : (
                    <p className="text-xs text-gray-500">Select referring player</p>
                  )}
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="referral_code">Referral Code</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="referral_code"
                      name="referral_code"
                      value={formData.referral_code}
                      onChange={handleChange}
                      placeholder="RF1234"
                      readOnly
                      className="bg-gray-50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, referral_code: generateReferralCode() }))}
                    >
                      Regenerate
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">Auto-generated code</p>
                </div>
              )}
              
              {formData.referral_type === 'player' && (
                <div className="grid gap-2">
                  <Label htmlFor="referral_code">Referral Code</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="referral_code"
                      name="referral_code"
                      value={formData.referral_code}
                      onChange={handleChange}
                      placeholder="RF1234"
                      readOnly
                      className="bg-gray-50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, referral_code: generateReferralCode() }))}
                    >
                      Regenerate
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">Auto-generated code</p>
                </div>
              )}
            </>
          )}

          {/* Notes - Optional */}
          <div className="grid gap-2 col-span-3">
            <Label htmlFor="notes">Notes <span className="text-gray-400 text-xs font-normal">(Optional)</span></Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any notes about this player..."
              rows={2}
            />
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || Object.keys(fieldErrors).length > 0 || !formData.player_name.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Add Player'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddPlayerDialog;