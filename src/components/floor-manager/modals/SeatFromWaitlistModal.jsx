// ============================================
// FILE: components/floor-manager/modals/SeatFromWaitlistModal.jsx
// Modal for seating a player from waitlist - Using shadcn
// ============================================

import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
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

const SeatFromWaitlistModal = ({
  open,
  onOpenChange,
  selectedEntry,
  tables,
  onSubmit,
}) => {
  const [form, setForm] = useState({
    table_id: '',
    seat_number: '',
    buy_in_amount: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.table_id || !form.seat_number || !selectedEntry) return;

    setLoading(true);
    try {
      await onSubmit(selectedEntry.waitlist_id, {
        table_id: parseInt(form.table_id),
        seat_number: parseInt(form.seat_number),
        buy_in_amount:
          parseFloat(form.buy_in_amount) ||
          selectedEntry.buy_in_range_min ||
          5000,
      });
      setForm({ table_id: '', seat_number: '', buy_in_amount: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({ table_id: '', seat_number: '', buy_in_amount: '' });
    onOpenChange(false);
  };

  // Get selected table
  const selectedTable = tables.find(
    (t) => t.table_id === parseInt(form.table_id)
  );

  // Get available seats for selected table
  const occupiedSeats = selectedTable?.players?.map((p) => p.seat_number) || [];
  const availableSeats = [];
  if (selectedTable) {
    for (let i = 1; i <= selectedTable.max_seats; i++) {
      if (!occupiedSeats.includes(i)) {
        availableSeats.push(i);
      }
    }
  }

  if (!selectedEntry) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <UserPlus className="w-5 h-5 text-emerald-500" />
            Seat from Waitlist
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Waitlist Info */}
          <div className="p-3 bg-gray-800 border border-gray-700 rounded-lg">
            <p className="font-medium text-white">{selectedEntry.player_name}</p>
            <p className="text-sm text-gray-400">
              Waiting for: {selectedEntry.requested_game_type || 'Any game'}
            </p>
            <p className="text-sm text-gray-400">
              Buy-in: ₹{selectedEntry.buy_in_range_min || '?'} - ₹
              {selectedEntry.buy_in_range_max || '?'}
            </p>
          </div>

          {/* Table Selection */}
          <div className="space-y-2">
            <Label className="text-gray-300">Select Table</Label>
            <Select
              value={form.table_id}
              onValueChange={(v) =>
                setForm({ ...form, table_id: v, seat_number: '' })
              }
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select a table" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {tables
                  .filter((t) => (t.players?.length || 0) < t.max_seats)
                  .map((t) => (
                    <SelectItem key={t.table_id} value={t.table_id.toString()}>
                      {t.table_name} - {t.game_type} ({t.players?.length || 0}/
                      {t.max_seats})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seat Selection */}
          {form.table_id && (
            <div className="space-y-2">
              <Label className="text-gray-300">Select Seat</Label>
              <div className="flex flex-wrap gap-2">
                {availableSeats.map((seat) => (
                  <Button
                    key={seat}
                    type="button"
                    variant={
                      form.seat_number === seat.toString() ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() =>
                      setForm({ ...form, seat_number: seat.toString() })
                    }
                    className={`w-10 h-10 ${
                      form.seat_number === seat.toString()
                        ? 'bg-emerald-600'
                        : 'border-gray-700 text-gray-300'
                    }`}
                  >
                    {seat}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Buy-in Amount */}
          <div className="space-y-2">
            <Label className="text-gray-300">Buy-in Amount (₹)</Label>
            <Input
              type="number"
              className="bg-gray-800 border-gray-700 text-white"
              value={form.buy_in_amount}
              onChange={(e) =>
                setForm({ ...form, buy_in_amount: e.target.value })
              }
              placeholder={`e.g. ${selectedEntry.buy_in_range_min || 5000}`}
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
              disabled={!form.table_id || !form.seat_number || loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Seating...' : 'Seat Player'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SeatFromWaitlistModal;
