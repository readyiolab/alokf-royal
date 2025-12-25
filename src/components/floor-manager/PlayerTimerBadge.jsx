// ============================================
// FILE: components/floor-manager/PlayerTimerBadge.jsx
// Displays player timer based on status
// Shows: playing time, break countdown, call time countdown
// ============================================

import React from 'react';
import { Timer, Coffee, AlertTriangle, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const PlayerTimerBadge = ({ player, timerData, formatDuration }) => {
  const { type, playedTime, breakRemaining, callTimeRemaining } = timerData;

  // ✅ PLAYING: Show elapsed time (count up)
  if (type === 'playing') {
    return (
      <div className="flex items-center gap-1.5">
        <Badge className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
          <Play className="w-3 h-3 mr-1" />
          {formatDuration(playedTime)}
        </Badge>
      </div>
    );
  }

  // ✅ ON BREAK: Show break countdown + paused play time
  if (type === 'break') {
    return (
      <div className="flex flex-col gap-1">
        <Badge className="bg-orange-600/20 text-orange-400 border border-orange-500/30">
          <Coffee className="w-3 h-3 mr-1" />
          Break: {formatDuration(breakRemaining)}
        </Badge>
        <span className="text-xs text-slate-400">
          Played: {formatDuration(playedTime)} (paused)
        </span>
      </div>
    );
  }

  // ✅ CALL TIME: Show countdown to must leave
  if (type === 'calltime') {
    const isUrgent = callTimeRemaining <= 300; // 5 minutes or less

    return (
      <Badge
        className={`${
          isUrgent
            ? 'bg-red-600/30 text-red-300 border border-red-500/50 animate-pulse'
            : 'bg-red-600/20 text-red-400 border border-red-500/30'
        }`}
      >
        <AlertTriangle className="w-3 h-3 mr-1" />
        Must Leave: {formatDuration(callTimeRemaining)}
      </Badge>
    );
  }

  // ✅ AWAITING CONFIRMATION: Show status
  if (player.buy_in_status === 'AWAITING_CONFIRMATION') {
    return (
      <Badge className="bg-yellow-600/20 text-yellow-400 border border-yellow-500/30">
        <Timer className="w-3 h-3 mr-1" />
        Awaiting Buy-in
      </Badge>
    );
  }

  return null;
};

export default PlayerTimerBadge;

