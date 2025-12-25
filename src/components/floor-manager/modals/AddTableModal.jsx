// ============================================
// FILE: components/floor-manager/modals/AddTableModal.jsx
// Modal for creating a new table - Using shadcn
// ============================================

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
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

const AddTableModal = ({ open, onOpenChange, onSubmit }) => {
  const [form, setForm] = useState({
    table_number: '',
    table_name: '',
    game_type: "Texas Hold'em",
    stakes: '',
    max_seats: '9',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...form,
        max_seats: parseInt(form.max_seats),
      });
      setForm({
        table_number: '',
        table_name: '',
        game_type: "Texas Hold'em",
        stakes: '',
        max_seats: '9',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Plus className="w-5 h-5 text-emerald-500" />
            Create New Table
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Table Number</Label>
              <Input
                type="number"
                className="bg-gray-800 border-gray-700 text-white"
                value={form.table_number}
                onChange={(e) =>
                  setForm({ ...form, table_number: e.target.value })
                }
                placeholder="e.g. 1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Table Name</Label>
              <Input
                type="text"
                className="bg-gray-800 border-gray-700 text-white"
                value={form.table_name}
                onChange={(e) =>
                  setForm({ ...form, table_name: e.target.value })
                }
                placeholder="e.g. Royal Flush"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Game Type</Label>
            <Select
              value={form.game_type}
              onValueChange={(v) => setForm({ ...form, game_type: v })}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="Texas Hold'em">Texas Hold'em (NL)</SelectItem>
                <SelectItem value="Pot Limit Omaha (PLO)">
                  Pot Limit Omaha (PLO)
                </SelectItem>
                <SelectItem value="Omaha Hi-Lo">Omaha Hi-Lo</SelectItem>
                <SelectItem value="Mixed Games">Mixed Games</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Stakes</Label>
              <Input
                type="text"
                className="bg-gray-800 border-gray-700 text-white"
                value={form.stakes}
                onChange={(e) => setForm({ ...form, stakes: e.target.value })}
                placeholder="e.g. $1/$2 NL"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Max Seats</Label>
              <Select
                value={form.max_seats}
                onValueChange={(v) => setForm({ ...form, max_seats: v })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="6">6 Max</SelectItem>
                  <SelectItem value="8">8 Max</SelectItem>
                  <SelectItem value="9">9 Max (Full Ring)</SelectItem>
                  <SelectItem value="10">10 Max</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? 'Creating...' : 'Create Table'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTableModal;
