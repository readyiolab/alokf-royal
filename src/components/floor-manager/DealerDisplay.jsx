// ============================================
// FILE: components/floor-manager/DealerDisplay.jsx
// Dealer display component with timer pause/resume indication
// ============================================

import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coffee, Play, Pause, Clock, AlertTriangle } from "lucide-react";

/**
 * ✅ DEALER DISPLAY COMPONENT
 * Shows dealer info with timer that properly reflects pause/resume state
 */
const DealerDisplay = ({
  dealer,
  timerData,
  onRemoveDealer,
  tableId,
  formatTime
}) => {
  if (!dealer) return null;

  const {
    shiftRemaining = 0,
    breakRemaining = 0,
    isPaused = false,
    pausedRemaining = 0,
    isShiftEnding = false,
    isShiftOverdue = false,
    isBreakEnding = false,
    isBreakOverdue = false
  } = timerData || {};

  // ✅ Format time display
  const formatTimeDisplay = (seconds) => {
    if (seconds === null || seconds === undefined) return "0:00";
    const absSeconds = Math.abs(Math.floor(seconds));
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
    return seconds < 0 ? `-${formatted}` : formatted;
  };

  // ✅ Determine display state
  const isOnBreak = dealer.dealer_status === 'on_break';
  const isOnTable = dealer.dealer_status === 'on_table';

  // ✅ Get background color based on state
  const getBgColor = () => {
    if (isShiftOverdue) return 'bg-red-600 animate-pulse';
    if (isBreakOverdue) return 'bg-orange-600 animate-pulse';
    if (isOnBreak) return 'bg-yellow-600';
    if (isShiftEnding) return 'bg-orange-600';
    return 'bg-gray-800';
  };

  // ✅ Get timer color
  const getTimerColor = () => {
    if (isShiftOverdue || isBreakOverdue) return 'text-red-200';
    if (isOnBreak) return 'text-yellow-200';
    if (isShiftEnding) return 'text-orange-200';
    return 'text-amber-400';
  };

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Dealer Label */}
      <div className="flex items-center gap-1 bg-emerald-900/80 px-2 py-0.5 rounded-full">
        <span className="text-emerald-400 text-[9px]">★ DEALER</span>
        {isPaused && (
          <Badge className="bg-yellow-500 text-yellow-900 text-[7px] px-1">
            <Pause className="w-2 h-2 mr-0.5" />
            PAUSED
          </Badge>
        )}
      </div>

      {/* Dealer Card */}
      <div className={`px-3 py-2 rounded-lg text-center ${getBgColor()}`}>
        {/* Dealer Name */}
        <p className="text-white font-semibold text-xs truncate max-w-[70px]">
          {dealer.dealer_name}
        </p>

        {/* Timer Display */}
        {isOnTable && (
          <>
            {/* Shift Timer - Active countdown */}
            <p className={`text-sm font-mono font-bold ${getTimerColor()}`}>
              {formatTimeDisplay(shiftRemaining)}
              {isShiftOverdue && ' ⚠'}
            </p>
            <p className="text-gray-400 text-[8px]">
              {isShiftOverdue ? 'OVERDUE' : isShiftEnding ? 'ENDING SOON' : 'Shift Time'}
            </p>
          </>
        )}

        {isOnBreak && (
          <>
            {/* Break Timer */}
            <div className="space-y-0.5">
              <p className={`text-sm font-mono font-bold ${isBreakOverdue ? 'text-red-200' : 'text-yellow-200'}`}>
                {formatTimeDisplay(breakRemaining)}
                {isBreakOverdue && ' ⚠'}
              </p>
              <p className="text-yellow-300 text-[8px]">
                {isBreakOverdue ? 'BREAK OVERDUE' : 'Break Time'}
              </p>
              
              {/* Paused Shift Time */}
              {pausedRemaining > 0 && (
                <div className="mt-1 pt-1 border-t border-yellow-500/30">
                  <p className="text-gray-300 text-[7px]">
                    <Pause className="w-2 h-2 inline mr-0.5" />
                    Shift paused: {formatTimeDisplay(pausedRemaining)}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Action Button */}
        {isOnTable && (
          <Button
            onClick={() => onRemoveDealer(tableId)}
            size="sm"
            className="mt-1 bg-orange-500 hover:bg-orange-600 h-5 text-[9px] px-2"
          >
            <Coffee className="w-2.5 h-2.5 mr-0.5" /> Break
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * ✅ DEALER SIDEBAR ITEM
 * Shows dealer in sidebar with timer state
 */
const DealerSidebarItem = ({
  dealer,
  timerData,
  tables,
  onDealerAvailable,
  formatTime
}) => {
  const isAssigned = tables.some((t) => t.dealer?.dealer_id === dealer.dealer_id);
  const assignedTable = tables.find((t) => t.dealer?.dealer_id === dealer.dealer_id);
  const isOnBreak = dealer.dealer_status === 'on_break';
  const isAvailable = dealer.dealer_status === 'available';

  const {
    shiftRemaining = 0,
    breakRemaining = 0,
    isPaused = false,
    pausedRemaining = 0,
    isShiftEnding = false,
    isShiftOverdue = false
  } = timerData || {};

  const formatTimeDisplay = (seconds) => {
    if (seconds === null || seconds === undefined) return "0:00";
    const absSeconds = Math.abs(Math.floor(seconds));
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-between bg-gray-800/50 rounded-lg px-2 py-1.5">
      <div className="flex items-center gap-2">
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${
            isOnBreak
              ? 'bg-orange-600'
              : isAssigned
              ? 'bg-blue-600'
              : 'bg-gray-600'
          }`}
        >
          {dealer.dealer_name?.charAt(0)}
        </div>

        {/* Info */}
        <div>
          <p className="text-white text-xs font-medium">
            {dealer.dealer_name}
          </p>

          {isOnBreak ? (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-orange-400 text-[10px]">Break</span>
              <span className="text-orange-300 text-[10px] font-mono">
                {formatTimeDisplay(breakRemaining)} left
              </span>
              {pausedRemaining > 0 && (
                <Badge className="bg-yellow-600/50 text-yellow-300 text-[8px] px-1">
                  <Pause className="w-2 h-2 mr-0.5 inline" />
                  {formatTimeDisplay(pausedRemaining)} paused
                </Badge>
              )}
            </div>
          ) : isAssigned ? (
            <div className="flex items-center gap-1">
              <Badge className={`${isShiftOverdue ? 'bg-red-600/50 text-red-300' : isShiftEnding ? 'bg-orange-600/50 text-orange-300' : 'bg-blue-600/50 text-blue-300'} text-[9px] px-1`}>
                {assignedTable?.table_name}
              </Badge>
              <span className={`text-[10px] font-mono ${isShiftOverdue ? 'text-red-300' : isShiftEnding ? 'text-orange-300' : 'text-blue-300'}`}>
                {formatTimeDisplay(shiftRemaining)}
                {isShiftOverdue && ' ⚠'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-emerald-400 text-[10px]">Available</span>
              {/* Show if dealer has paused shift time to resume */}
              {pausedRemaining > 0 && (
                <Badge className="bg-blue-600/50 text-blue-300 text-[8px] px-1">
                  {formatTimeDisplay(pausedRemaining)} to resume
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      {isOnBreak && (
        <Button
          onClick={() => onDealerAvailable(dealer.dealer_id)}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 h-6 w-6 p-0"
          title="Mark as available"
        >
          <Play className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
};

export { DealerDisplay, DealerSidebarItem };