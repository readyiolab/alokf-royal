// ============================================
// FILE: components/cashier/ChipsInventoryCard.jsx
// Card showing chip inventory status with dropdown popover
// ============================================

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Coins } from 'lucide-react';

const ChipsInventoryCard = ({ dashboard, formatCurrency }) => {
  const chipInventory = dashboard?.chip_inventory || {};
  const openingChips = chipInventory?.opening || {};
  const currentChips = chipInventory?.current_in_hand || {};
  
  // Calculate chips out (difference between opening and current)
  // Only count positive differences (chips actually given out)
  const chipsOut = {
    chips_100: Math.max(0, (openingChips?.chips_100 || 0) - (currentChips?.chips_100 || 0)),
    chips_500: Math.max(0, (openingChips?.chips_500 || 0) - (currentChips?.chips_500 || 0)),
    chips_1000: Math.max(0, (openingChips?.chips_1000 || 0) - (currentChips?.chips_1000 || 0)),
    chips_5000: Math.max(0, (openingChips?.chips_5000 || 0) - (currentChips?.chips_5000 || 0)),
    chips_10000: Math.max(0, (openingChips?.chips_10000 || 0) - (currentChips?.chips_10000 || 0)),
  };
  const chipsOutTotal = chipsOut.chips_100 + chipsOut.chips_500 + chipsOut.chips_1000 + chipsOut.chips_5000 + chipsOut.chips_10000;
  const chipsOutValue = chipsOut.chips_100 * 100 + chipsOut.chips_500 * 500 + chipsOut.chips_1000 * 1000 + chipsOut.chips_5000 * 5000 + chipsOut.chips_10000 * 10000;

  const chipDenominations = [
    { key: 'chips_100', label: '₹100', value: 100, colorClass: 'text-red-600' },
    { key: 'chips_500', label: '₹500', value: 500, colorClass: 'text-blue-600' },
    { key: 'chips_1000', label: '₹1K', value: 1000, colorClass: 'text-yellow-600' },
    { key: 'chips_5000', label: '₹5K', value: 5000, colorClass: 'text-green-600' },
    { key: 'chips_10000', label: '₹10K', value: 10000, colorClass: 'text-purple-600' },
  ];

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-gray-700">CHIPS INVENTORY</CardTitle>
        <Popover>
          <PopoverTrigger asChild>
            <button className="cursor-pointer hover:opacity-80 transition-opacity">
              <Coins className="w-4 h-4 text-orange-500" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              {/* Opening Chips Section */}
              <div className="space-y-3">
                <div className="pb-3 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Opening</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-black">{(openingChips?.total_count || 0)} chips</span>
                    <span className="text-sm font-semibold text-black">Value {formatCurrency(openingChips?.total_value || 0)}</span>
                  </div>
                </div>

                {/* Chip Denominations Breakdown - Opening */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">By Denomination</p>
                  <div className="space-y-2">
                    {chipDenominations.map((denom) => {
                      const openingCount = openingChips?.[denom.key] || 0;
                      return (
                        <div key={denom.key} className="flex justify-between items-center text-sm">
                          <span className={`font-medium ${denom.colorClass}`}>{denom.label}</span>
                          <span className="font-semibold text-black">{openingCount}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Chips Out Section - Always show */}
              <div className="space-y-3 pt-3 border-t border-gray-200">
                <div className="pb-2">
                  <p className="text-xs font-semibold text-orange-600 mb-2">Chips Out</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-orange-600">{chipsOutTotal} chips</span>
                    <span className="text-sm font-semibold text-orange-600">Value {formatCurrency(chipsOutValue)}</span>
                  </div>
                </div>

                {/* Chip Denominations Breakdown - Chips Out */}
                {chipsOutTotal > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase">By Denomination</p>
                    <div className="space-y-2">
                      {chipDenominations.map((denom) => {
                        const outCount = chipsOut[denom.key] || 0;
                        if (outCount > 0) {
                          return (
                            <div key={denom.key} className="flex justify-between items-center text-sm">
                              <span className={`font-medium ${denom.colorClass}`}>{denom.label}</span>
                              <span className="font-semibold text-orange-600">{outCount}</span>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary View - Always Visible */}
        <div className="space-y-2">
          <div>
            <p className="text-xs text-gray-600 mb-1">Opening</p>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-black">{(openingChips?.total_count || 0)} chips</span>
              <span className="text-sm font-semibold text-black">Value {formatCurrency(openingChips?.total_value || 0)}</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">With Cashier</p>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-black">{(currentChips?.total_count || 0)} chips</span>
              <span className="text-sm font-semibold text-black">Value {formatCurrency(currentChips?.total_value || 0)}</span>
            </div>
          </div>
        </div>

        {/* By Denomination Breakdown - Shows Current Chips (With Cashier) */}
        <div className="pt-3 border-t border-gray-200 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase">By Denomination</p>
          <div className="space-y-1.5">
            {chipDenominations.map((denom) => {
              const currentCount = currentChips?.[denom.key] || 0;
              return (
                <div key={denom.key} className="flex justify-between items-center text-sm">
                  <span className={`font-medium ${denom.colorClass}`}>{denom.label}</span>
                  <span className="font-semibold text-black">{currentCount}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChipsInventoryCard;

