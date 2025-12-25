import { useState } from 'react';
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
import { AlertCircle, CheckCircle, Loader2, CreditCard } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

import playerService from '../../services/player.service';
import { useAuth } from '../../contexts/AuthContext';

export const AddPlayerDialog = ({ isOpen, onClose, onPlayerAdded }) => {
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    player_name: '',
    phone_number: '',
    email: '',
    address: '',
    player_type: 'occasional',
    credit_limit: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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
      // Include credit_limit if provided
      const playerData = {
        ...formData,
        credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : 0
      };
      const newPlayer = await playerService.createPlayer(playerData);
      setSuccess('Player added successfully!');

      setTimeout(() => {
        if (onPlayerAdded) onPlayerAdded(newPlayer);
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to create player');
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
      player_type: 'occasional',
      credit_limit: '',
      notes: '',
    });
    setError(null);
    setSuccess(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent >
        <DialogHeader>
          <DialogTitle>Add New Player</DialogTitle>
          <DialogDescription>
            Register a new player to the system. Fill in the details below.
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
              autoComplete="off"
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

          {/* Address */}
          <div className="grid gap-2">
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

          {/* Credit Limit */}
          <div className="grid gap-2">
            <Label htmlFor="credit_limit" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Credit Limit
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
              <Input
                id="credit_limit"
                name="credit_limit"
                type="number"
                min="0"
                value={formData.credit_limit}
                onChange={handleChange}
                placeholder="0 = No credit allowed"
                className="pl-8"
              />
            </div>
            <p className="text-xs text-gray-500">Set 0 or leave empty to disable credit for this player</p>
          </div>

          {/* Notes */}
          <div className="grid gap-2">
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
          <Button onClick={handleSubmit} disabled={loading}>
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