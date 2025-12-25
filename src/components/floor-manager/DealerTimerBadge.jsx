// ============================================
// FILE: components/floor-manager/DealerTimerBadge.jsx
// Displays dealer timer based on status
// Shows: shift countdown, break countdown
// ============================================

import React from 'react';
import { Timer, Coffee, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const DealerTimerBadge = ({ dealer, timerData, formatDuration }) => {
  const { type, shiftRemaining, breakRemaining, pausedShiftRemaining } = timerData;

  // ✅ ON TABLE: Show shift countdown
  if (type === 'shift') {
    const isLowTime = shiftRemaining <= 300; // 5 minutes or less

    return (
      <div className="flex items-center gap-1.5">
        <Badge
          className={`${
            isLowTime
              ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50'
              : 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'
          }`}
        >
          <Timer className="w-3 h-3 mr-1" />
          Shift: {formatDuration(shiftRemaining)}
        </Badge>
      </div>
    );
  }

  // ✅ ON BREAK: Show break countdown + paused shift time
  if (type === 'break') {
    return (
      <div className="flex flex-col gap-1">
        <Badge className="bg-orange-600/20 text-orange-400 border border-orange-500/30">
          <Coffee className="w-3 h-3 mr-1" />
          Break: {formatDuration(breakRemaining)}
        </Badge>
        {pausedShiftRemaining > 0 && (
          <span className="text-xs text-slate-400">
            Shift paused: {formatDuration(pausedShiftRemaining)} left
          </span>
        )}
      </div>
    );
  }

  // ✅ AVAILABLE
  if (type === 'available') {
    return (
      <Badge className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
        <Clock className="w-3 h-3 mr-1" />
        Ready
      </Badge>
    );
  }

  return null;
};

export default DealerTimerBadge;

