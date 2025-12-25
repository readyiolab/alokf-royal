// ============================================
// FILE: components/floor-manager/modals/TransferPlayerModal.jsx
// Modal for transferring a player to another table
// ============================================

import React, { useState, useMemo } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const TransferPlayerModal = ({
  open,
  onOpenChange,
  player,
  currentTableId,
  tables,
  onSubmit,
}) => {
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [loading, setLoading] = useState(false);

  // Get available tables (excluding current table)
  const availableTables = useMemo(() => {
    if (!tables) return [];
    return tables.filter(
      (t) => t.table_id !== currentTableId && t.table_status === 'active'
    );
  }, [tables, currentTableId]);

  // Get open seats for selected table
  const getOpenSeats = (table) => {
    if (!table) return [];
    const occupiedSeats = new Set(
      (table.players || []).map((p) => p.seat_number)
    );
    const allSeats = [];
    for (let i = 1; i <= (table.max_seats || 9); i++) {
      if (!occupiedSeats.has(i)) {
        allSeats.push(i);
      }
    }
    return allSeats;
  };

  const handleSubmit = async () => {
    if (!selectedTable || !selectedSeat) return;

    setLoading(true);
    try {
      await onSubmit(player.table_player_id, selectedTable.table_id, selectedSeat);
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedTable(null);
    setSelectedSeat(null);
    onOpenChange(false);
  };

  // Calculate player's current stack (buy_in_amount for display)
  const currentStack = player?.buy_in_amount || 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-lg max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <ArrowRightLeft className="w-5 h-5 text-blue-600" />
            Transfer {player?.player_name}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Current Stack Display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <Label className="text-gray-500 text-sm">
              Current Stack (will transfer with player)
            </Label>
            <p className="text-2xl font-bold text-emerald-600">
              ₹{currentStack.toLocaleString('en-IN')}
            </p>
          </div>

          {/* Table Selection */}
          <div>
            <Label className="text-gray-700 mb-2 block">
              Select destination table and seat:
            </Label>

            <div className="space-y-3">
              {availableTables.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No other tables available
                </p>
              ) : (
                availableTables.map((table) => {
                  const openSeats = getOpenSeats(table);
                  const isSelected = selectedTable?.table_id === table.table_id;

                  return (
                    <div
                      key={table.table_id}
                      className={`border rounded-lg p-4 transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            Table {table.table_number} - {table.table_name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {table.stakes} {table.game_type}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-emerald-600 border-emerald-200 bg-emerald-50"
                        >
                          {openSeats.length} open
                        </Badge>
                      </div>

                      {openSeats.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {openSeats.map((seat) => (
                            <Button
                              key={seat}
                              type="button"
                              variant={
                                isSelected && selectedSeat === seat
                                  ? 'default'
                                  : 'outline'
                              }
                              size="sm"
                              className={
                                isSelected && selectedSeat === seat
                                  ? 'bg-emerald-600 hover:bg-emerald-700'
                                  : 'hover:bg-gray-100'
                              }
                              onClick={() => {
                                setSelectedTable(table);
                                setSelectedSeat(seat);
                              }}
                            >
                              Seat {seat}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No open seats</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!selectedTable || !selectedSeat || loading}
            onClick={handleSubmit}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            {loading
              ? 'Transferring...'
              : `Transfer to Table ${selectedTable?.table_number || '?'} Seat ${selectedSeat || '?'}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransferPlayerModal;


