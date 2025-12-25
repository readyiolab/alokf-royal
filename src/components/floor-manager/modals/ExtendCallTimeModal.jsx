// ============================================
// FILE: components/floor-manager/modals/ExtendCallTimeModal.jsx
// Modal for extending call time - Using shadcn
// ============================================

import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ExtendCallTimeModal = ({ open, onOpenChange, selectedPlayer, onSubmit }) => {
  const [minutes, setMinutes] = useState(30);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlayer) return;

    setLoading(true);
    try {
      await onSubmit(selectedPlayer.table_player_id, minutes);
      setMinutes(30);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMinutes(30);
    onOpenChange(false);
  };

  const presetOptions = [15, 30, 45, 60];

  if (!selectedPlayer) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5 text-orange-500" />
            Extend Call Time for {selectedPlayer.player_name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Extend by (minutes)</Label>
            <div className="flex flex-wrap gap-2">
              {presetOptions.map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={minutes === option ? 'default' : 'outline'}
                  onClick={() => setMinutes(option)}
                  className={`${
                    minutes === option
                      ? 'bg-orange-600'
                      : 'border-gray-700 text-gray-300'
                  }`}
                >
                  {option} min
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Custom minutes</Label>
            <Input
              type="number"
              min="5"
              max="180"
              className="bg-gray-800 border-gray-700 text-white"
              value={minutes}
              onChange={(e) => setMinutes(parseInt(e.target.value) || 30)}
            />
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
              disabled={loading}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {loading ? 'Extending...' : `Extend by ${minutes} min`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExtendCallTimeModal;
