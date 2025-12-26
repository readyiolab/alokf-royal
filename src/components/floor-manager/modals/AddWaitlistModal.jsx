// ============================================
// FILE: components/floor-manager/modals/AddWaitlistModal.jsx
// Add player to waitlist with LIVE table availability
// Shows which tables have open seats and players closest to finishing
// ============================================

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, Users, Timer, AlertCircle, Check } from 'lucide-react';

const AddWaitlistModal = ({ open, onOpenChange, onSubmit, tables = [] }) => {
  const [formData, setFormData] = useState({
    player_name: '',
    player_phone: '',
    requested_game_type: '',
    preferred_stakes: '',
  });
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        player_name: '',
        player_phone: '',
        requested_game_type: '',
        preferred_stakes: '',
      });
    }
  }, [open]);

  // ✅ Calculate live table availability
  const getTableAvailability = () => {
    const availability = [];
    
    tables.forEach(table => {
      const maxSeats = table.max_seats || 9;
      const players = table.players || [];
      const occupiedSeats = players.length;
      const openSeats = maxSeats - occupiedSeats;
      
      // Find empty seat numbers
      const occupiedSeatNumbers = players.map(p => p.seat_number);
      const emptySeatNumbers = [];
      for (let i = 1; i <= maxSeats; i++) {
        if (!occupiedSeatNumbers.includes(i)) {
          emptySeatNumbers.push(i);
        }
      }
      
      // Find players closest to finishing (TIME UP or low remaining time)
      const playersWithTime = players
        .filter(p => p.player_status === 'playing' || p.player_status === 'call_time_active')
        .map(p => {
          let remainingSeconds = 0;
          let status = 'playing';
          
          if (p.player_status === 'call_time_active') {
            // Call time - show call time remaining
            remainingSeconds = p.call_time_remaining_seconds || 0;
            status = 'call_time';
          } else if (p.remaining_minutes !== undefined) {
            remainingSeconds = p.remaining_minutes * 60;
            status = remainingSeconds <= 0 ? 'time_up' : 'playing';
          } else if (p.can_call_time) {
            remainingSeconds = 0;
            status = 'time_up';
          }
          
          return {
            player_name: p.player_name,
            seat_number: p.seat_number,
            remaining_seconds: remainingSeconds,
            status: status,
            played_minutes: p.played_minutes || 0,
          };
        })
        .sort((a, b) => a.remaining_seconds - b.remaining_seconds);
      
      availability.push({
        table_id: table.table_id,
        table_name: table.table_name,
        table_number: table.table_number,
        game_type: table.game_type,
        stakes: table.stakes,
        max_seats: maxSeats,
        occupied_seats: occupiedSeats,
        open_seats: openSeats,
        empty_seat_numbers: emptySeatNumbers,
        players_finishing_soon: playersWithTime.slice(0, 3), // Top 3 closest to finishing
      });
    });
    
    // Sort by open seats (most open first), then by players finishing soon
    return availability.sort((a, b) => {
      if (b.open_seats !== a.open_seats) return b.open_seats - a.open_seats;
      // If same open seats, prioritize tables with players finishing soon
      const aFinishing = a.players_finishing_soon.filter(p => p.status === 'time_up' || p.status === 'call_time').length;
      const bFinishing = b.players_finishing_soon.filter(p => p.status === 'time_up' || p.status === 'call_time').length;
      return bFinishing - aFinishing;
    });
  };

  const tableAvailability = getTableAvailability();
  const totalOpenSeats = tableAvailability.reduce((sum, t) => sum + t.open_seats, 0);
  const tablesWithOpenSeats = tableAvailability.filter(t => t.open_seats > 0);
  const playersFinishingSoon = tableAvailability.flatMap(t => 
    t.players_finishing_soon
      .filter(p => p.status === 'time_up' || p.status === 'call_time')
      .map(p => ({ ...p, table_name: t.table_name, table_number: t.table_number }))
  );

  // Format time display
  const formatTime = (seconds) => {
    if (seconds <= 0) return 'TIME UP';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.player_name.trim()) return;
    
    setLoading(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } catch (err) {
      console.error('Error adding to waitlist:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a2e] border-gray-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-amber-500 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Add to Waitlist
          </DialogTitle>
        </DialogHeader>

        {/* ✅ LIVE AVAILABILITY SECTION */}
        <div className="space-y-3 mb-4">
          {/* Total Open Seats */}
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Current Availability</span>
              <Badge className={`${totalOpenSeats > 0 ? 'bg-emerald-600' : 'bg-red-600'} text-white`}>
                {totalOpenSeats} open seat{totalOpenSeats !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            {/* Tables with open seats */}
            {tablesWithOpenSeats.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {tablesWithOpenSeats.map(table => (
                  <Badge 
                    key={table.table_id} 
                    className="bg-emerald-900/50 text-emerald-300 text-xs"
                  >
                    {table.table_name}: S{table.empty_seat_numbers.join(', S')}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Players Finishing Soon */}
          {playersFinishingSoon.length > 0 && (
            <div className="bg-blue-900/30 rounded-lg p-3 border border-blue-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Timer className="w-4 h-4 text-blue-400" />
                <span className="text-blue-300 text-sm font-medium">Players Finishing Soon</span>
              </div>
              <div className="space-y-1">
                {playersFinishingSoon.slice(0, 5).map((player, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gray-700 text-gray-300 text-[10px] px-1.5">
                        {player.table_name} S{player.seat_number}
                      </Badge>
                      <span className="text-gray-300">{player.player_name}</span>
                    </div>
                    <Badge className={`${
                      player.status === 'time_up' ? 'bg-blue-600' : 
                      player.status === 'call_time' ? 'bg-orange-600' : 'bg-gray-600'
                    } text-white text-[10px]`}>
                      {player.status === 'time_up' ? 'TIME UP' : 
                       player.status === 'call_time' ? `Call: ${formatTime(player.remaining_seconds)}` :
                       formatTime(player.remaining_seconds)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No availability warning */}
          {totalOpenSeats === 0 && playersFinishingSoon.length === 0 && (
            <div className="bg-amber-900/30 rounded-lg p-3 border border-amber-700/50 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 text-sm">All tables are full. Player will be notified when a seat opens.</span>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-gray-400 text-xs">Player Name *</Label>
              <Input
                value={formData.player_name}
                onChange={(e) => setFormData({ ...formData, player_name: e.target.value })}
                placeholder="Enter player name"
                className="bg-gray-800 border-gray-600 text-white mt-1"
                required
              />
            </div>

            <div className="col-span-2">
              <Label className="text-gray-400 text-xs">Phone Number</Label>
              <Input
                value={formData.player_phone}
                onChange={(e) => setFormData({ ...formData, player_phone: e.target.value })}
                placeholder="Optional"
                className="bg-gray-800 border-gray-600 text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-gray-400 text-xs">Preferred Game</Label>
              <Select
                value={formData.requested_game_type}
                onValueChange={(value) => setFormData({ ...formData, requested_game_type: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-1">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="any">Any Game</SelectItem>
                  <SelectItem value="NL Hold'em">NL Hold'em</SelectItem>
                  <SelectItem value="PLO">PLO</SelectItem>
                  <SelectItem value="Mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-400 text-xs">Preferred Stakes</Label>
              <Select
                value={formData.preferred_stakes}
                onValueChange={(value) => setFormData({ ...formData, preferred_stakes: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-1">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="any">Any Stakes</SelectItem>
                  <SelectItem value="25/50">25/50</SelectItem>
                  <SelectItem value="50/100">50/100</SelectItem>
                  <SelectItem value="100/200">100/200</SelectItem>
                  <SelectItem value="200/400">200/400</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.player_name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? 'Adding...' : 'Add to Waitlist'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddWaitlistModal;