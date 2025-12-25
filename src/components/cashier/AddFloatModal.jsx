// components/cashier/AddFloatModal.jsx
// Add Float - Cashier can add more chips during session when needed for payouts

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import cashierService from '../../services/cashier.service';

const AddFloatModal = ({ isOpen, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [chipBreakdown, setChipBreakdown] = useState({
    chips_100: 0,
    chips_500: 0,
    chips_5000: 0,
    chips_10000: 0,
  });

  if (!isOpen) return null;

  const handleChipChange = (key, value) => {
    setChipBreakdown(prev => ({
      ...prev,
      [key]: Number(value) || 0,
    }));
  };

  const calculateChipValue = () => {
    return (
      chipBreakdown.chips_100 * 100 +
      chipBreakdown.chips_500 * 500 +
      chipBreakdown.chips_5000 * 5000 +
      chipBreakdown.chips_10000 * 10000
    );
  };

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      setError('Enter a valid float amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await cashierService.addCashFloat(
        Number(amount),
        notes,
        chipBreakdown
      );

      onSuccess?.(res.data);
      onClose();

      // reset
      setAmount('');
      setNotes('');
      setChipBreakdown({
        chips_100: 0,
        chips_500: 0,
        chips_5000: 0,
        chips_10000: 0,
      });
    } catch (err) {
      setError(err.message || 'Failed to add float');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-0 relative border border-gray-200">
        {/* Modal Top Bar */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 rounded-t-2xl bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-xl font-bold text-blue-900 tracking-tight">Add Float</h2>
            <p className="text-xs text-gray-500">Add cash or chips to the session float</p>
          </div>
          <button onClick={onClose} className="hover:bg-gray-200 rounded-full p-1 transition"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Amount Section */}
          <div className="rounded-lg p-4 mb-2">
            <Label className="block text-blue-900 font-semibold mb-1">Cash Amount (₹)</Label>
            <Input
              type="number"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Enter cash amount"
              className="border-blue-300 focus:ring-blue-400 text-black focus:border-blue-500 bg-white"
            />
          </div>

          {/* Chips Section */}
          <div className="rounded-lg border border-purple-200 bg-purple-50/60 p-4 mb-2">
            <Label className="block text-black font-semibold mb-1">Chip Breakdown (optional)</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {/* 10,000 */}
              <div className="rounded-lg border-2 border-purple-400 bg-purple-100 p-3 flex flex-col items-center">
                <span className="text-xs font-bold text-purple-700 mb-1">₹10,000</span>
                <Input
                  type="number"
                  min="0"
                  value={chipBreakdown.chips_10000}
                  onChange={e => handleChipChange('chips_10000', e.target.value)}
                  className="text-center text-black font-bold border-purple-300 focus:ring-purple-400 focus:border-purple-500 bg-white"
                />
              </div>
              {/* 5,000 */}
              <div className="rounded-lg border-2 border-blue-400 bg-blue-100 p-3 flex flex-col items-center">
                <span className="text-xs font-bold text-black text-blue-700 mb-1">₹5,000</span>
                <Input
                  type="number"
                  min="0"
                  value={chipBreakdown.chips_5000}
                  onChange={e => handleChipChange('chips_5000', e.target.value)}
                  className="text-center text-black font-bold border-blue-300 focus:ring-blue-400 focus:border-blue-500 bg-white"
                />
              </div>
              {/* 500 */}
              <div className="rounded-lg border-2 border-green-400 bg-green-100 p-3 flex flex-col items-center">
                <span className="text-xs text-black font-bold  mb-1">₹500</span>
                <Input
                  type="number"
                  min="0"
                  value={chipBreakdown.chips_500}
                  onChange={e => handleChipChange('chips_500', e.target.value)}
                  className="text-center text-black font-bold border-green-300 focus:ring-green-400 focus:border-green-500 bg-white"
                />
              </div>
              {/* 100 */}
              <div className="rounded-lg border-2 border-red-400 bg-red-100 p-3 flex flex-col items-center">
                <span className="text-xs text-black font-bold text-red-700 mb-1">₹100</span>
                <Input
                  type="number"
                  min="0"
                  value={chipBreakdown.chips_100}
                  onChange={e => handleChipChange('chips_100', e.target.value)}
                  className="text-center text-black font-bold border-red-300 focus:ring-red-400 focus:border-red-500 bg-white"
                />
              </div>
            </div>
            <div className="mt-3 text-right text-xs text-black font-semibold">
              Chip Value: <span className="text-base">{cashierService.formatCurrency(calculateChipValue())}</span>
            </div>
          </div>

          

          {/* Error */}
          {error && <div className="rounded-md bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm mb-2">{error}</div>}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-black text-white font-bold shadow-md hover:from-blue-600 hover:to-purple-600"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Float'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFloatModal;
