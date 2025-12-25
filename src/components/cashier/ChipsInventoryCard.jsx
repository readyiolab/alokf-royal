// ============================================
// FILE: components/cashier/ChipsInventoryCard.jsx
// Card showing chip inventory status
// ============================================

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const ChipsInventoryCard = ({ dashboard, formatCurrency }) => {
  const chipInventory = dashboard?.chip_inventory || {};
  const openingChips = chipInventory?.opening || {};
  const currentChips = chipInventory?.current_in_hand || {};
  const chipsWithPlayers = chipInventory?.with_players || {};

  return (
    <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <p className="text-sm font-semibold text-gray-600">Chips Inventory</p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Opening Chips</span>
            <span className="text-sm font-semibold text-gray-700">
              {openingChips.total_count || 0} chips
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Value</span>
            <span className="text-lg font-bold text-purple-700">
              {formatCurrency(openingChips.total_value || 0)}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-200 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">In Hand</span>
              <span className="font-semibold text-green-600">
                {currentChips.total_count || 0} chips
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">With Players</span>
              <span className="font-semibold text-blue-600">
                {chipsWithPlayers.total_count || 0} chips
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChipsInventoryCard;

