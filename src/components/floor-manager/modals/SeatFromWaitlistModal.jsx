// ============================================
// FILE: components/floor-manager/modals/SeatFromWaitlistModal.jsx
// Modal for seating a waitlist player to a table and seat
// ============================================

import React, { useState, useMemo } from 'react';
import { Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const SeatFromWaitlistModal = ({
  open,
  onOpenChange,
  tables = [],
  onSelectSeat,
  selectedEntry,
  title = 'Select a seat for the player:',
}) => {
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);

  // Calculate available seats for each table
  const tablesWithSeats = useMemo(() => {
    return tables
      .filter((table) => table.table_status === 'active')
      .map((table) => {
        const occupiedSeats = (table.players || []).map((p) => p.seat_number);
        const allSeats = Array.from({ length: table.max_seats || 9 }, (_, i) => i + 1);
        const availableSeats = allSeats.filter((seat) => !occupiedSeats.includes(seat));
        
        return {
          ...table,
          availableSeats,
          openCount: availableSeats.length,
        };
      })
      .filter((table) => table.openCount > 0) // Only show tables with open seats
      .sort((a, b) => b.openCount - a.openCount); // Sort by most open seats first
  }, [tables]);

  const handleSeatClick = (table, seat) => {
    setSelectedTable(table);
    setSelectedSeat(seat);
  };

  const handleConfirm = () => {
    if (selectedTable && selectedSeat && onSelectSeat) {
      // Call onSelectSeat with table and seat info
      onSelectSeat(selectedTable, selectedSeat);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedTable(null);
    setSelectedSeat(null);
    onOpenChange(false);
  };

  // Format stakes display
  const formatStakes = (table) => {
    if (table.stakes) return table.stakes;
    return `₹${table.small_blind || 50}/₹${table.big_blind || 100}`;
  };

  // Get game type badge
  const getGameTypeBadge = (gameType) => {
    if (gameType?.includes('Omaha') || gameType?.includes('PLO')) {
      return 'PLO';
    }
    return 'NL';
  };

  const playerName = selectedEntry?.player_name || 'Player';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1a1a2e] border-gray-700 text-white max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-300 text-sm font-normal">
            {title}
          </DialogTitle>
          {selectedEntry && (
            <p className="text-xs text-emerald-400 font-medium mt-2">
              Seating: {playerName}
            </p>
          )}
        </DialogHeader>

        {/* Scrollable Tables List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 -mr-2">
          {tablesWithSeats.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No tables with open seats available</p>
            </div>
          ) : (
            tablesWithSeats.map((table) => (
              <div
                key={table.table_id}
                className={`bg-[#12121c] border rounded-xl p-4 transition-all ${
                  selectedTable?.table_id === table.table_id
                    ? 'border-emerald-500 ring-1 ring-emerald-500/50'
                    : 'border-gray-700/50 hover:border-gray-600'
                }`}
              >
                {/* Table Header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-white font-semibold text-base">
                      Table {table.table_number} - {table.table_name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {formatStakes(table)} {getGameTypeBadge(table.game_type)}
                    </p>
                  </div>
                  <Badge className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-2 py-1">
                    {table.openCount} open
                  </Badge>
                </div>

                {/* Available Seats Grid */}
                <div className="flex flex-wrap gap-2">
                  {table.availableSeats.map((seat) => (
                    <Button
                      key={seat}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSeatClick(table, seat)}
                      className={`min-w-[70px] h-9 transition-all ${
                        selectedTable?.table_id === table.table_id && selectedSeat === seat
                          ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700'
                          : 'bg-[#1a1a2e] border-gray-600 text-gray-300 hover:border-emerald-500 hover:text-emerald-400'
                      }`}
                    >
                      Seat {seat}
                    </Button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Confirm Button */}
        {tablesWithSeats.length > 0 && (
          <div className="pt-4 border-t border-gray-700/50 mt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {selectedTable && selectedSeat ? (
                  <span>
                    Selected:{' '}
                    <span className="text-emerald-400 font-medium">
                      Table {selectedTable.table_number}, Seat {selectedSeat}
                    </span>
                  </span>
                ) : (
                  'Click a seat to select'
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={!selectedTable || !selectedSeat}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                >
                  Seat Player
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SeatFromWaitlistModal;