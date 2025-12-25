import React from 'react';
import { Clock, AlertCircle, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * ✅ PLAYER TIMER DISPLAY COMPONENT
 * Shows play time, break time, and call time countdowns
 */
export const PlayerTimerDisplay = ({ player, timer, formatTime }) => {
  if (!player) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'playing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'on_break':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'call_time_active':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTimerColor = (status) => {
    switch (status) {
      case 'playing':
        return 'text-blue-600';
      case 'on_break':
        return 'text-yellow-600';
      case 'call_time_active':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const remainingMinutes = timer?.remainingSeconds
    ? Math.ceil(timer.remainingSeconds / 60)
    : 0;

  return (
    <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200">
      {/* Player Info */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <p className="font-semibold text-sm text-slate-900">{player.player_name}</p>
          <p className="text-xs text-slate-500">Seat {player.seat_number}</p>
        </div>
        <Badge className={getStatusColor(player.player_status)}>
          {player.player_status.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      {/* Timer Display */}
      <div className="space-y-2">
        {/* Play Time */}
        <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-slate-600">Play Time</span>
          </div>
          <span className={`text-sm font-bold ${getTimerColor('playing')}`}>
            {formatTime(timer?.remainingSeconds || 0)}
          </span>
        </div>

        {/* Break Time */}
        {player.player_status === 'on_break' && (
          <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-xs text-slate-600">Break Ends In</span>
            </div>
            <span className={`text-sm font-bold ${getTimerColor('on_break')}`}>
              {formatTime(timer?.remainingSeconds || 0)}
            </span>
          </div>
        )}

        {/* Call Time */}
        {player.player_status === 'call_time_active' && (
          <div className="flex items-center justify-between bg-white p-2 rounded border border-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-xs text-slate-600">Call Time</span>
            </div>
            <span className={`text-sm font-bold ${getTimerColor('call_time_active')}`}>
              {formatTime(timer?.remainingSeconds || 0)}
            </span>
          </div>
        )}

        {/* Buy-in Status */}
        <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
          <span className="text-xs text-slate-600">Buy-in</span>
          <Badge variant={player.buy_in_status === 'CONFIRMED' ? 'default' : 'secondary'}>
            {player.buy_in_status}
          </Badge>
        </div>

        {/* Warning: Call Time can be activated */}
        {player.player_status === 'playing' && remainingMinutes <= 120 && (
          <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded">
            <Zap className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-orange-700">
              Can call time in {120 - remainingMinutes} min
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
