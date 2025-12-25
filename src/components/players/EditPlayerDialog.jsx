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
import { AlertCircle, CheckCircle, Loader2, CreditCard, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

import playerService from '../../services/player.service';
import { useAuth } from '../../contexts/AuthContext';

export const EditPlayerDialog = ({ isOpen, onClose, player, onPlayerUpdated }) => {
  const { token, user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [formData, setFormData] = useState({
    player_name: '',
    phone_number: '',
    email: '',
    address: '',
    player_type: 'occasional',
    notes: '',
  });

  const [creditLimit, setCreditLimit] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingCreditLimit, setSavingCreditLimit] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (player) {
      setFormData({
        player_name: player.player_name || '',
        phone_number: player.phone_number || '',
        email: player.email || '',
        address: player.address || '',
        player_type: player.player_type || 'occasional',
        notes: player.notes || '',
      });
      setCreditLimit(player.credit_limit_personal || player.credit_limit || '');
    }
  }, [player]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handlePlayerTypeChange = (value) => {
    setFormData((prev) => ({ ...prev, player_type: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.player_name.trim()) {
      setError('Player name is required');
      return;
    }
    if (formData.phone_number && !/^\d{10}$/.test(formData.phone_number.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      await playerService.updatePlayer(player.player_id, formData);
      setSuccess('Player updated successfully!');

      setTimeout(() => {
        if (onPlayerUpdated) onPlayerUpdated();
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to update player');
    } finally {
      setLoading(false);
    }
  };

  const handleSetCreditLimit = async () => {
    if (!isAdmin) {
      setError('Only admins can set credit limits');
      return;
    }

    try {
      setSavingCreditLimit(true);
      const limitValue = parseFloat(creditLimit) || 0;
      await playerService.setPlayerCreditLimit(player.player_id, limitValue);
      setSuccess(`Credit limit set to ₹${limitValue.toLocaleString('en-IN')}`);
      
      setTimeout(() => {
        setSuccess(null);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to set credit limit');
    } finally {
      setSavingCreditLimit(false);
    }
  };

  const formatCurrency = (value) => {
    return `₹${parseFloat(value || 0).toLocaleString('en-IN')}`;
  };

  if (!player) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Edit Player - {player.player_name}
          </DialogTitle>
          <DialogDescription>
            Update player information. Player Code: <strong>{player.player_code}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {/* Player Name */}
          <div className="grid gap-2">
            <Label htmlFor="player_name">
              Player Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="player_name"
              name="player_name"
              value={formData.player_name}
              onChange={handleChange}
              placeholder="Enter player name"
            />
          </div>

          {/* Phone Number */}
          <div className="grid gap-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              name="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="10-digit mobile number"
            />
          </div>

          {/* Email */}
          <div className="grid gap-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="player@example.com"
            />
          </div>

          {/* Player Type */}
          <div className="grid gap-2">
            <Label htmlFor="player_type">Player Type</Label>
            <Select value={formData.player_type} onValueChange={handlePlayerTypeChange}>
              <SelectTrigger id="player_type">
                <SelectValue placeholder="Select player type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="occasional">Occasional</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Address */}
          <div className="grid gap-2 col-span-2">
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

          {/* Notes */}
          <div className="grid gap-2 col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any notes about this player..."
              rows={2}
            />
          </div>
        </div>

        {/* Credit Limit Section - Admin Only */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Credit Limit Settings</h3>
            {!isAdmin && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Admin Only</span>
            )}
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label htmlFor="credit_limit" className="text-sm text-purple-700 font-medium">
                  Personal Credit Limit
                </Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-600 font-bold">₹</span>
                  <Input
                    id="credit_limit"
                    type="number"
                    min="0"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    placeholder="0 = No credit"
                    className="pl-8 border-purple-300 focus:border-purple-500"
                    disabled={!isAdmin}
                  />
                </div>
                <p className="text-xs text-purple-600 mt-1">
                  Current: {formatCurrency(player.credit_limit_personal || player.credit_limit || 0)}
                </p>
              </div>
              <Button
                onClick={handleSetCreditLimit}
                disabled={!isAdmin || savingCreditLimit}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {savingCreditLimit ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Set Limit'
                )}
              </Button>
            </div>
            {!isAdmin && (
              <p className="text-xs text-gray-500 mt-2">
                Contact an admin to update credit limits
              </p>
            )}
          </div>
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditPlayerDialog;
