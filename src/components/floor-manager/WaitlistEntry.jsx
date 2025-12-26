// ============================================
// FILE: components/floor-manager/WaitlistEntry.jsx
// Waitlist entry component with LIVE availability display
// Shows waiting time + suggested seats (T2S4 format)
// ============================================

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin } from 'lucide-react';

const WaitlistEntry = ({ 
  entry, 
  index, 
  onSeat, 
  getWaitlistTimer, 
  formatWaitingTime,
  tables = [],  // ✅ NEW: Pass tables for live availability
  getPlayerTimer  // ✅ NEW: Pass timer function for player time calculation
}) => {
  const timerData = getWaitlistTimer(entry.waitlist_id);
  const waitingTime = formatWaitingTime(timerData.waitingSeconds);
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };
  
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-600';
      case 'medium': return 'bg-orange-600';
      default: return 'bg-amber-600';
    }
  };

  // ✅ Calculate best available seats (T2S4 format)
  const getBestAvailableSeats = () => {
    const availableSeats = [];
    
    tables.forEach(table => {
      const maxSeats = table.max_seats || 9;
      const players = table.players || [];
      const occupiedSeatNumbers = players.map(p => p.seat_number);
      
      // Find empty seats
      for (let i = 1; i <= maxSeats; i++) {
        if (!occupiedSeatNumbers.includes(i)) {
          availableSeats.push({
            table_id: table.table_id,
            table_name: table.table_name,
            table_number: table.table_number,
            seat_number: i,
            game_type: table.game_type,
            stakes: table.stakes,
            display: `T${table.table_number}S${i}`,
          });
        }
      }
    });
    
    // Return top 3 available seats
    return availableSeats.slice(0, 3);
  };

  // ✅ Get players finishing soon (for when no seats available)
  const getPlayersFinishingSoon = () => {
    const finishing = [];
    
    tables.forEach(table => {
      const players = table.players || [];
      
      players.forEach(player => {
        if (player.player_status === 'playing' || player.player_status === 'call_time_active') {
          let remainingSeconds = 0;
          let status = 'playing';
          
          if (player.player_status === 'call_time_active') {
            remainingSeconds = player.call_time_remaining_seconds || 0;
            status = 'call_time';
          } else if (player.can_call_time || player.remaining_minutes <= 0) {
            remainingSeconds = 0;
            status = 'time_up';
          } else {
            remainingSeconds = (player.remaining_minutes || 0) * 60;
          }
          
          finishing.push({
            table_number: table.table_number,
            seat_number: player.seat_number,
            player_name: player.player_name,
            remaining_seconds: remainingSeconds,
            status: status,
            display: `T${table.table_number}S${player.seat_number}`,
          });
        }
      });
    });
    
    // Sort by remaining time (lowest first = finishing soonest)
    finishing.sort((a, b) => a.remaining_seconds - b.remaining_seconds);
    
    // Return top 2 players finishing soon
    return finishing.filter(p => p.status === 'time_up' || p.status === 'call_time').slice(0, 2);
  };

  const availableSeats = getBestAvailableSeats();
  const playersFinishing = getPlayersFinishingSoon();

  // Format remaining time for finishing players
  const formatTime = (seconds) => {
    if (seconds <= 0) return 'NOW';
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  };

  return (
    <div className="bg-gray-800/50 rounded-lg px-2 py-1.5">
      {/* Main Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 ${getPriorityBadge(timerData.priority)} rounded-full flex items-center justify-center text-white text-[10px] font-bold`}>
            {index + 1}
          </div>
          <div>
            <p className="text-white text-xs font-medium">{entry.player_name}</p>
            <div className="flex items-center gap-1">
              <span className="text-gray-500 text-[10px]">{entry.requested_game_type || 'Any'}</span>
              <span className="text-gray-600">•</span>
              <span className={`text-[10px] font-medium ${getPriorityColor(timerData.priority)}`}>
                <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                {waitingTime}
              </span>
            </div>
          </div>
        </div>
        <Button
          onClick={() => onSeat(entry)}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 h-6 text-[10px] px-2"
        >
          Seat
        </Button>
      </div>

      {/* ✅ LIVE Availability Row */}
      <div className="mt-1.5 pt-1.5 border-t border-gray-700/50">
        {availableSeats.length > 0 ? (
          // Show available seats
          <div className="flex items-center gap-1 flex-wrap">
            <MapPin className="w-2.5 h-2.5 text-emerald-400" />
            <span className="text-[9px] text-gray-500">Open:</span>
            {availableSeats.map((seat, idx) => (
              <Badge 
                key={idx} 
                className="bg-emerald-900/60 text-emerald-300 text-[9px] px-1 py-0 h-4"
              >
                {seat.display}
              </Badge>
            ))}
            {availableSeats.length < tables.reduce((sum, t) => sum + (t.max_seats - (t.players?.length || 0)), 0) && (
              <span className="text-[9px] text-gray-500">+more</span>
            )}
          </div>
        ) : playersFinishing.length > 0 ? (
          // Show players finishing soon
          <div className="flex items-center gap-1 flex-wrap">
            <Clock className="w-2.5 h-2.5 text-blue-400" />
            <span className="text-[9px] text-gray-500">Soon:</span>
            {playersFinishing.map((player, idx) => (
              <Badge 
                key={idx} 
                className={`${
                  player.status === 'time_up' ? 'bg-blue-900/60 text-blue-300' : 'bg-orange-900/60 text-orange-300'
                } text-[9px] px-1 py-0 h-4`}
              >
                {player.display} {player.status === 'time_up' ? '✓' : formatTime(player.remaining_seconds)}
              </Badge>
            ))}
          </div>
        ) : (
          // All tables full, no one finishing soon
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-gray-500">All tables full</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaitlistEntry;