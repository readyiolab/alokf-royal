// ============================================
// FILE: components/floor-manager/modals/AddDealerModal.jsx
// Modal for adding a new dealer - Using shadcn
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

const AddDealerModal = ({ open, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    dealer_name: '',
    phone_number: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.dealer_name.trim()) return;

    setLoading(true);
    try {
      await onSubmit({
        dealer_name: form.dealer_name,
        phone_number: form.phone_number,
      });
      setForm({ dealer_name: '', phone_number: '' });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({ dealer_name: '', phone_number: '' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <UserPlus className="w-5 h-5 text-amber-500" />
            Add New Dealer
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Dealer Name *</Label>
            <Input
              type="text"
              className="bg-gray-800 border-gray-700 text-white"
              value={form.dealer_name}
              onChange={(e) =>
                setForm({ ...form, dealer_name: e.target.value })
              }
              placeholder="Enter dealer name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Phone Number</Label>
            <Input
              type="tel"
              className="bg-gray-800 border-gray-700 text-white"
              value={form.phone_number}
              onChange={(e) =>
                setForm({ ...form, phone_number: e.target.value })
              }
              placeholder="Enter phone number"
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
              className="flex-1 bg-amber-600 hover:bg-amber-700"
            >
              {loading ? 'Adding...' : 'Add Dealer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDealerModal;
