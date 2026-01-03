import React from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Coins } from 'lucide-react';

/**
 * Reusable Chip Input Component
 * - 5 chip denominations: ₹100, ₹500, ₹1,000, ₹5,000, ₹10,000
 * - Color coded inputs
 * - Shows individual and total values
 */
const ChipInputGrid = ({ 
  chips, 
  onChange, 
  title = "Chips",
  showTotal = true,
  totalLabel = "Total Value",
  className = ""
}) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const calculateTotal = () => {
    return (
      (parseInt(chips.chips_100) || 0) * 100 +
      (parseInt(chips.chips_500) || 0) * 500 +
      (parseInt(chips.chips_1000) || 0) * 1000 +
      (parseInt(chips.chips_5000) || 0) * 5000 +
      (parseInt(chips.chips_10000) || 0) * 10000
    );
  };

  const handleChange = (key, value) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    onChange({ ...chips, [key]: numValue });
  };

  const total = calculateTotal();

  const chipConfig = [
    { key: 'chips_100', value: 100, label: '₹100', colorClass: 'text-red-600 border-red-200 focus:border-red-400 bg-red-50' },
    { key: 'chips_500', value: 500, label: '₹500', colorClass: 'text-green-600 border-green-200 focus:border-green-400 bg-green-50' },
    { key: 'chips_1000', value: 1000, label: '₹1K', colorClass: 'text-yellow-600 border-yellow-200 focus:border-yellow-400 bg-yellow-50' },
    { key: 'chips_5000', value: 5000, label: '₹5K', colorClass: 'text-blue-600 border-blue-200 focus:border-blue-400 bg-blue-50' },
    { key: 'chips_10000', value: 10000, label: '₹10K', colorClass: 'text-purple-600 border-purple-200 focus:border-purple-400 bg-purple-50' }
  ];

  return (
    <Card className={`bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-md ${className}`}>
      <CardContent className="pt-5 pb-4">
        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
          <Coins className="w-4 h-4" />
          {title}
        </Label>
        
        <div className="grid grid-cols-5 gap-3">
          {chipConfig.map(chip => (
            <div key={chip.key} className="text-center">
              <div className={`text-xs font-bold mb-2 ${chip.colorClass.split(' ')[0]}`}>
                {chip.label}
              </div>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={chips[chip.key] || ''}
                onChange={(e) => handleChange(chip.key, e.target.value)}
                className={`text-center text-lg font-bold h-12 border-2 ${chip.colorClass}`}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency((parseInt(chips[chip.key]) || 0) * chip.value)}
              </p>
            </div>
          ))}
        </div>
        
        {/* Total Display */}
        {showTotal && (
          <div className="mt-5 pt-4 border-t border-slate-200 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">{totalLabel}</span>
            <span className={`text-3xl font-black ${total > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
              {formatCurrency(total)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChipInputGrid;
