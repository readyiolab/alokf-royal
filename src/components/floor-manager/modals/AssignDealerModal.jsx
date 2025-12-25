// ============================================
// FILE: components/floor-manager/modals/AssignDealerModal.jsx
// Modal for assigning a dealer to a table - Using shadcn
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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const AssignDealerModal = ({
  open,
  onOpenChange,
  selectedTable,
  availableDealers,
  onSubmit,
}) => {
  const [dealerId, setDealerId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dealerId) return;

    setLoading(true);
    try {
      await onSubmit({
        table_id: selectedTable.table_id,
        dealer_id: parseInt(dealerId),
      });
      setDealerId('');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDealerId('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <UserPlus className="w-5 h-5 text-blue-500" />
            Assign Dealer to {selectedTable?.table_name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Select Dealer</Label>
            {availableDealers.length === 0 ? (
              <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg text-center text-gray-400">
                No available dealers
              </div>
            ) : (
              <RadioGroup value={dealerId} onValueChange={setDealerId}>
                <div className="space-y-2">
                  {availableDealers.map((dealer) => (
                    <label
                      key={dealer.dealer_id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                        dealerId === dealer.dealer_id.toString()
                          ? 'border-blue-500 bg-blue-900/30'
                          : 'border-gray-700 hover:bg-gray-800'
                      }`}
                    >
                      <RadioGroupItem
                        value={dealer.dealer_id.toString()}
                        className="border-gray-600"
                      />
                      <div>
                        <p className="font-medium text-white">
                          {dealer.dealer_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {dealer.dealer_code || 'Ready'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            )}
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
              disabled={!dealerId || availableDealers.length === 0 || loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Assigning...' : 'Assign'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignDealerModal;
