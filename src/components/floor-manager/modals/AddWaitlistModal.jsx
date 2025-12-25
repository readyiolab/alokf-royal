// ============================================
// FILE: components/floor-manager/modals/AddWaitlistModal.jsx
// Modal for adding a player to waitlist - Using shadcn
// Supports pre-filled data when player not found in database
// ============================================

import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AddWaitlistModal = ({ 
  open, 
  onOpenChange, 
  onSubmit,
  prefillData = null, // { player_name, player_phone, requested_game_type }
}) => {
  const [form, setForm] = useState({
    player_name: '',
    player_phone: '',
    requested_game_type: '',
  });
  const [loading, setLoading] = useState(false);

  // Pre-fill form when prefillData changes
  useEffect(() => {
    if (prefillData) {
      setForm({
        player_name: prefillData.player_name || '',
        player_phone: prefillData.player_phone || '',
        requested_game_type: prefillData.requested_game_type || '',
      });
    }
  }, [prefillData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.player_name) return;

    setLoading(true);
    try {
      await onSubmit(form);
      setForm({
        player_name: '',
        player_phone: '',
        requested_game_type: '',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({
      player_name: '',
      player_phone: '',
      requested_game_type: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1a1a2e] border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5 text-amber-500" />
            Add to Waitlist
          </DialogTitle>
        </DialogHeader>

        {/* Info banner when pre-filled from player search */}
        {prefillData?.player_name && (
          <div className="flex items-start gap-2 p-3 bg-amber-900/30 border border-amber-500/50 rounded-lg mb-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-200 text-xs">
              Adding "{prefillData.player_name}" to waitlist. They will be notified when a seat is available.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Player Name *</Label>
            <Input
              type="text"
              className="bg-gray-800 border-gray-700 text-white"
              value={form.player_name}
              onChange={(e) =>
                setForm({ ...form, player_name: e.target.value })
              }
              placeholder="Enter player name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Phone (Optional)</Label>
            <Input
              type="tel"
              className="bg-gray-800 border-gray-700 text-white"
              value={form.player_phone}
              onChange={(e) =>
                setForm({ ...form, player_phone: e.target.value })
              }
              placeholder="e.g. +91 98765 43210"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Game Preference</Label>
            <Select
              value={form.requested_game_type || 'any'}
              onValueChange={(v) =>
                setForm({ ...form, requested_game_type: v === 'any' ? '' : v })
              }
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Any Game" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="any">Any Game</SelectItem>
                <SelectItem value="Texas Hold'em">Texas Hold'em</SelectItem>
                <SelectItem value="Pot Limit Omaha (PLO)">
                  Pot Limit Omaha (PLO)
                </SelectItem>
                <SelectItem value="Omaha Hi-Lo">Omaha Hi-Lo</SelectItem>
                <SelectItem value="Mixed Games">Mixed Games</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !form.player_name}
              className="flex-1 bg-amber-600 hover:bg-amber-700"
            >
              {loading ? 'Adding...' : 'Add to Waitlist'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddWaitlistModal;