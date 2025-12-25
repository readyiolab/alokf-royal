// ============================================
// FILE: pages/cashier/FloorManagerNew.jsx
// Floor Manager Dashboard - Poker Room Style
// ============================================

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Plus,
  Users,
  Clock,
  Coffee,
  Play,
  Pause,
  UserPlus,
  X,
  Timer,
  ChevronDown,
  ChevronUp,
  LogOut,
  Settings,
  AlertTriangle,
  Bell,
  Volume2,
  VolumeX,
} from 'lucide-react';

// =================== SHADCN COMPONENTS ===================
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

// =================== HOOKS ===================
import { useAuth } from '../../hooks/useAuth';
import { useSession } from '../../hooks/useSession';
import useFloorManagerData from '../../hooks/useFloorManagerData';
import useFloorManagerTimers from '../../hooks/useFloorManagerTimers';

// =================== SERVICES ===================
import floorManagerService from '../../services/floorManager.service';

// =================== MODALS ===================
import {
  AddTableModal,
  AddPlayerModal,
  AssignDealerModal,
  AddWaitlistModal,
  SeatFromWaitlistModal,
  ExtendCallTimeModal,
  AddDealerModal,
} from '../../components/floor-manager/modals';
import TransferPlayerModal from '../../components/floor-manager/modals/TransferPlayerModal';
import { ArrowRightLeft } from 'lucide-react';

// ============================================
// ALERT NOTIFICATION PANEL COMPONENT
// Shows players/dealers with time ending soon
// ============================================
const AlertNotificationPanel = ({
  tables,
  dealers,
  getPlayerTimer,
  getDealerTimer,
  formatTime,
  soundEnabled,
  onToggleSound,
}) => {
  const audioRef = useRef(null);
  const lastAlertRef = useRef({});
  const [isExpanded, setIsExpanded] = useState(true);

  // Collect all alerts
  const alerts = [];

  // Check all players for critical times
  tables.forEach((table) => {
    if (!table.players) return;

    table.players.forEach((player) => {
      const timerData = getPlayerTimer(player.table_player_id, player.player_status);

      // Player call time ending (< 2 minutes)
      if (player.player_status === 'call_time_active') {
        const remaining = timerData?.callTimeRemaining || 0;
        if (remaining <= 120 && remaining > 0) {
          alerts.push({
            id: `calltime_${player.table_player_id}`,
            type: 'call_time',
            priority: remaining <= 30 ? 'critical' : 'warning',
            name: player.player_name,
            tableName: table.table_name,
            timeRemaining: remaining,
            message: `Call time ending in ${formatTime(remaining)}`,
            icon: Timer,
          });
        } else if (remaining <= 0) {
          alerts.push({
            id: `calltime_expired_${player.table_player_id}`,
            type: 'call_time_expired',
            priority: 'critical',
            name: player.player_name,
            tableName: table.table_name,
            timeRemaining: 0,
            message: 'Call time EXPIRED!',
            icon: AlertTriangle,
          });
        }
      }

      // Player break ending (< 2 minutes)
      if (player.player_status === 'on_break') {
        const remaining = timerData?.breakRemaining || 0;
        if (remaining <= 120 && remaining > 0) {
          alerts.push({
            id: `break_${player.table_player_id}`,
            type: 'player_break',
            priority: remaining <= 30 ? 'critical' : 'warning',
            name: player.player_name,
            tableName: table.table_name,
            timeRemaining: remaining,
            message: `Break ending in ${formatTime(remaining)}`,
            icon: Coffee,
          });
        } else if (remaining <= 0) {
          alerts.push({
            id: `break_expired_${player.table_player_id}`,
            type: 'player_break_expired',
            priority: 'critical',
            name: player.player_name,
            tableName: table.table_name,
            timeRemaining: 0,
            message: 'Break time EXPIRED!',
            icon: AlertTriangle,
          });
        }
      }

      // Player minimum play time reached (can call time now)
      if (player.player_status === 'playing') {
        const remaining = timerData?.remainingTime || 0;
        if (remaining <= 300 && remaining > 0) {
          alerts.push({
            id: `minplay_${player.table_player_id}`,
            type: 'min_play_ending',
            priority: 'info',
            name: player.player_name,
            tableName: table.table_name,
            timeRemaining: remaining,
            message: `Min play time in ${formatTime(remaining)}`,
            icon: Clock,
          });
        } else if (remaining <= 0 && timerData?.canCallTime) {
          // Don't alert for this - just informational
        }
      }
    });
  });

  // Check all dealers for critical times
  dealers.forEach((dealer) => {
    const timerData = getDealerTimer(dealer.dealer_id, dealer.dealer_status);

    // Dealer shift ending (< 5 minutes)
    if (dealer.dealer_status === 'on_table') {
      const remaining = timerData?.shiftRemaining || 0;
      if (remaining <= 300 && remaining > 0) {
        const assignedTable = tables.find((t) => t.dealer?.dealer_id === dealer.dealer_id);
        alerts.push({
          id: `dealer_shift_${dealer.dealer_id}`,
          type: 'dealer_shift',
          priority: remaining <= 60 ? 'critical' : 'warning',
          name: dealer.dealer_name,
          tableName: assignedTable?.table_name || 'Unknown',
          timeRemaining: remaining,
          message: `Shift ending in ${formatTime(remaining)}`,
          icon: Clock,
        });
      } else if (remaining <= 0) {
        const assignedTable = tables.find((t) => t.dealer?.dealer_id === dealer.dealer_id);
        alerts.push({
          id: `dealer_shift_expired_${dealer.dealer_id}`,
          type: 'dealer_shift_expired',
          priority: 'critical',
          name: dealer.dealer_name,
          tableName: assignedTable?.table_name || 'Unknown',
          timeRemaining: 0,
          message: 'Shift time OVERDUE!',
          icon: AlertTriangle,
        });
      }
    }

    // Dealer break ending (< 2 minutes)
    if (dealer.dealer_status === 'on_break') {
      const remaining = timerData?.breakRemaining || 0;
      if (remaining <= 120 && remaining > 0) {
        alerts.push({
          id: `dealer_break_${dealer.dealer_id}`,
          type: 'dealer_break',
          priority: remaining <= 30 ? 'critical' : 'warning',
          name: dealer.dealer_name,
          tableName: 'On Break',
          timeRemaining: remaining,
          message: `Break ending in ${formatTime(remaining)}`,
          icon: Coffee,
        });
      } else if (remaining <= 0) {
        alerts.push({
          id: `dealer_break_expired_${dealer.dealer_id}`,
          type: 'dealer_break_expired',
          priority: 'critical',
          name: dealer.dealer_name,
          tableName: 'On Break',
          timeRemaining: 0,
          message: 'Break time EXPIRED!',
          icon: AlertTriangle,
        });
      }
    }
  });

  // Sort alerts by priority and time remaining
  const sortedAlerts = alerts.sort((a, b) => {
    const priorityOrder = { critical: 0, warning: 1, info: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.timeRemaining - b.timeRemaining;
  });

  // Play sound and vibrate for critical alerts
  useEffect(() => {
    const criticalAlerts = sortedAlerts.filter((a) => a.priority === 'critical');

    if (criticalAlerts.length > 0 && soundEnabled) {
      // Check if we should play alert (not too frequent)
      const now = Date.now();
      const shouldAlert = criticalAlerts.some((alert) => {
        const lastAlertTime = lastAlertRef.current[alert.id] || 0;
        // Alert every 10 seconds for critical
        if (now - lastAlertTime > 10000) {
          lastAlertRef.current[alert.id] = now;
          return true;
        }
        return false;
      });

      if (shouldAlert) {
        // Play beep sound
        playBeep();

        // Vibrate if supported
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      }
    }
  }, [sortedAlerts, soundEnabled]);

  // Create audio beep
  const playBeep = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Hz
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.log('Audio not supported');
    }
  };

  const criticalCount = sortedAlerts.filter((a) => a.priority === 'critical').length;
  const warningCount = sortedAlerts.filter((a) => a.priority === 'warning').length;

  if (sortedAlerts.length === 0) {
    return null; // Don't show panel if no alerts
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
        isExpanded ? 'h-auto max-h-64' : 'h-12'
      }`}
    >
      {/* Alert Header Bar */}
      <div
        className={`flex items-center justify-between px-4 py-2 cursor-pointer ${
          criticalCount > 0
            ? 'bg-red-900/95 border-t-2 border-red-500'
            : 'bg-orange-900/95 border-t-2 border-orange-500'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`${criticalCount > 0 ? 'animate-pulse' : ''}`}>
            <Bell className={`w-5 h-5 ${criticalCount > 0 ? 'text-red-400' : 'text-orange-400'}`} />
          </div>
          <span className="text-white font-semibold text-sm">
            {criticalCount > 0 ? `${criticalCount} CRITICAL` : ''} 
            {criticalCount > 0 && warningCount > 0 ? ' • ' : ''}
            {warningCount > 0 ? `${warningCount} Warning` : ''}
            {criticalCount === 0 && warningCount === 0 ? 'Alerts' : ''}
          </span>
          <Badge
            className={`${
              criticalCount > 0 ? 'bg-red-500' : 'bg-orange-500'
            } text-white text-xs`}
          >
            {sortedAlerts.length}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSound();
            }}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 h-7 w-7 p-0"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-400" />
            )}
          </Button>

          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-white" />
          ) : (
            <ChevronUp className="w-5 h-5 text-white" />
          )}
        </div>
      </div>

      {/* Alert List */}
      {isExpanded && (
        <div className="bg-[#1a1a2e]/98 backdrop-blur-sm overflow-y-auto max-h-52 p-2 space-y-1">
          {sortedAlerts.map((alert) => {
            const IconComponent = alert.icon;
            return (
              <div
                key={alert.id}
                className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                  alert.priority === 'critical'
                    ? 'bg-red-900/50 border border-red-500/50 animate-pulse'
                    : alert.priority === 'warning'
                    ? 'bg-orange-900/50 border border-orange-500/50'
                    : 'bg-blue-900/50 border border-blue-500/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      alert.priority === 'critical'
                        ? 'bg-red-600'
                        : alert.priority === 'warning'
                        ? 'bg-orange-600'
                        : 'bg-blue-600'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{alert.name}</p>
                    <p className="text-gray-400 text-xs">
                      {alert.tableName} • {alert.message}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`font-mono font-bold text-lg ${
                      alert.priority === 'critical'
                        ? 'text-red-400'
                        : alert.priority === 'warning'
                        ? 'text-orange-400'
                        : 'text-blue-400'
                    }`}
                  >
                    {alert.timeRemaining > 0 ? formatTime(alert.timeRemaining) : 'NOW!'}
                  </p>
                  <p
                    className={`text-xs ${
                      alert.priority === 'critical' ? 'text-red-300' : 'text-gray-400'
                    }`}
                  >
                    {alert.type.replace('_', ' ').toUpperCase()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================
// POKER TABLE COMPONENT
// ============================================
const PokerTable = ({
  table,
  onSeatClick,
  onAssignDealer,
  onRemoveDealer,
  onPlayerBreak,
  onPlayerResume,
  onCallTime,
  onRemovePlayer,
  onTransferPlayer,
  onEndTable,
  getPlayerTimer,
  getDealerTimer,
  formatTime,
}) => {
  const maxSeats = table.max_seats || 9;
  const players = table.players || [];
  const dealer = table.dealer;

  // Calculate elliptical positions for seats
  const getSeatPosition = (seatIndex, total) => {
    const startAngle = -90;
    const angleStep = 360 / total;
    const angle = startAngle + seatIndex * angleStep;
    const radian = (angle * Math.PI) / 180;
    const radiusX = 46;
    const radiusY = 42;
    return {
      x: 50 + radiusX * Math.cos(radian),
      y: 50 + radiusY * Math.sin(radian),
    };
  };

  const seats = [];
  for (let i = 1; i <= maxSeats; i++) {
    const player = players.find((p) => p.seat_number === i);
    const position = getSeatPosition(i - 1, maxSeats);
    seats.push({ seatNumber: i, player, position });
  }

  // Dealer timer
  const dealerTimerData = dealer
    ? getDealerTimer(dealer.dealer_id, dealer.dealer_status)
    : null;
  const dealerShiftMins = dealerTimerData?.shiftRemaining
    ? Math.floor(dealerTimerData.shiftRemaining / 60)
    : 0;
  const dealerShiftSecs = dealerTimerData?.shiftRemaining
    ? dealerTimerData.shiftRemaining % 60
    : 0;
  const dealerIsEnding = dealerTimerData?.shiftRemaining > 0 && dealerTimerData?.shiftRemaining <= 300;
  const dealerIsOverdue = dealer?.dealer_status === 'on_table' && dealerTimerData?.shiftRemaining <= 0;

  return (
    <div className="bg-[#1e1e2d] rounded-2xl border border-gray-700/50 overflow-hidden shadow-xl">
      {/* Table Container */}
      <div className="relative w-full aspect-[4/3] p-4">
        {/* Poker Table (Oval) */}
        <div
          className="absolute inset-[12%] rounded-[50%]"
          style={{
            background:
              'radial-gradient(ellipse at 50% 40%, #2d8a5e 0%, #1d6847 40%, #145535 70%, #0d3d26 100%)',
            border: '8px solid #6b4423',
            boxShadow:
              'inset 0 0 60px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.5)',
          }}
        >
          {/* Inner felt border */}
          <div className="absolute inset-4 rounded-[50%] border border-[#3d9a6a]/30" />

          {/* Center ROYAL FLUSH text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center opacity-20">
              <p className="text-white text-xs tracking-[0.4em] font-light">
                ROYAL FLUSH
              </p>
            </div>
          </div>

          {/* Game Type Badge */}
          <div className="absolute top-[20%] left-1/2 transform -translate-x-1/2">
            <Badge
              className={`${
                table.game_type?.includes('Omaha')
                  ? 'bg-purple-600'
                  : 'bg-amber-600'
              } text-white text-[10px] px-2 py-0.5`}
            >
              {table.game_type?.includes('Omaha') ? 'PLO' : "Hold'em"}
            </Badge>
          </div>

          {/* Table Name & Stakes */}
          <div className="absolute bottom-[18%] left-1/2 transform -translate-x-1/2 text-center">
            <p className="text-white font-bold text-base">{table.table_name}</p>
            <p className="text-amber-400 text-xs font-medium">{table.stakes}</p>
            <p className="text-gray-400 text-[10px]">Min Buy-in: ₹{table.minimum_buy_in?.toLocaleString() || '500'}</p>
          </div>
        </div>

        {/* Dealer Position (Right side) */}
        {dealer ? (
          <div
            className="absolute z-20"
            style={{ right: '3%', top: '40%', transform: 'translateY(-50%)' }}
          >
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 bg-emerald-900/80 px-2 py-0.5 rounded-full">
                <span className="text-emerald-400 text-[9px]">★ DEALER</span>
              </div>
              <div
                className={`px-3 py-2 rounded-lg text-center ${
                  dealerIsOverdue
                    ? 'bg-red-600 animate-pulse'
                    : dealerIsEnding
                    ? 'bg-orange-600'
                    : 'bg-gray-800'
                }`}
              >
                <p className="text-white font-semibold text-xs truncate max-w-[70px]">
                  {dealer.dealer_name}
                </p>
                {/* Show countdown timer MM:SS */}
                <p
                  className={`text-sm font-mono font-bold ${
                    dealerIsOverdue
                      ? 'text-red-200'
                      : dealerIsEnding
                      ? 'text-orange-200'
                      : 'text-amber-400'
                  }`}
                >
                  {dealerShiftMins}:{dealerShiftSecs.toString().padStart(2, '0')}
                  {dealerIsOverdue && ' ⚠'}
                </p>
                <p className="text-gray-400 text-[8px]">
                  {dealerIsOverdue ? 'OVERDUE' : dealerIsEnding ? 'ENDING SOON' : 'Shift Time'}
                </p>
                <Button
                  onClick={() => onRemoveDealer(table.table_id)}
                  size="sm"
                  className="mt-1 bg-orange-500 hover:bg-orange-600 h-5 text-[9px] px-2"
                >
                  <Coffee className="w-2.5 h-2.5 mr-0.5" />
                  Break
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="absolute z-20 cursor-pointer"
            style={{ right: '42%', top: '40%', transform: 'translateY(-50%)' }}
            onClick={() => onAssignDealer(table)}
          >
            <div className="flex flex-col items-center gap-1">
              <div className="px-3 py-2 rounded-lg bg-gray-800/80 border-2 border-dashed border-gray-600 hover:border-emerald-500 transition-colors">
                <p className="text-gray-400 text-[10px] text-center">
                  + Add Dealer
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Player Seats */}
        {seats.map(({ seatNumber, player, position }) => (
          <div
            key={seatNumber}
            className="absolute z-10"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {player ? (
              <PlayerSeat
                player={player}
                seatNumber={seatNumber}
                getPlayerTimer={getPlayerTimer}
                formatTime={formatTime}
                onBreak={() => onPlayerBreak(player.table_player_id)}
                onResume={() => onPlayerResume(player.table_player_id)}
                onCallTime={() => onCallTime(player.table_player_id)}
                onRemove={() =>
                  onRemovePlayer(player.table_player_id, player.player_name)
                }
                onTransfer={() => onTransferPlayer(player, table.table_id)}
              />
            ) : (
              <EmptySeat
                seatNumber={seatNumber}
                onClick={() => onSeatClick(table, seatNumber)}
              />
            )}
          </div>
        ))}

        {/* End Table Button */}
        <div className="absolute bottom-2 right-2">
          <Button
            onClick={() => onEndTable && onEndTable(table.table_id)}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-red-400 hover:bg-red-900/20 h-6 text-[10px]"
          >
            <Users className="w-3 h-3 mr-1" />
            End Table
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// PLAYER SEAT COMPONENT
// ============================================
const PlayerSeat = ({
  player,
  seatNumber,
  getPlayerTimer,
  formatTime,
  onBreak,
  onResume,
  onCallTime,
  onRemove,
  onTransfer,
}) => {
  const timerData = getPlayerTimer(player.table_player_id, player.player_status);
  const isOnBreak = player.player_status === 'on_break';
  const isCallTime = player.player_status === 'call_time_active';
  const isPlaying = player.player_status === 'playing';

  // Calculate times based on status
  let displayTime = '0:00';
  let timeLabel = 'Time';
  let isWarning = false;
  let isCritical = false;

  if (isPlaying) {
    // Show remaining time until 120 min (countdown)
    const remainingSeconds = timerData?.remainingTime || 0;
    const playedSeconds = timerData?.playedTime || 0;

    if (remainingSeconds > 0) {
      // Still counting down to minimum play time
      const mins = Math.floor(remainingSeconds / 60);
      const secs = remainingSeconds % 60;
      displayTime = `${mins}:${secs.toString().padStart(2, '0')}`;
      timeLabel = 'Min Play Left';
      isWarning = remainingSeconds <= 600; // 10 min warning
    } else {
      // Minimum time reached, show played time
      const mins = Math.floor(playedSeconds / 60);
      const secs = playedSeconds % 60;
      displayTime = `${mins}:${secs.toString().padStart(2, '0')}`;
      timeLabel = 'Played (Can Leave)';
    }
  } else if (isOnBreak) {
    // Show break countdown
    const breakRemaining = timerData?.breakRemaining || 0;
    const mins = Math.floor(breakRemaining / 60);
    const secs = breakRemaining % 60;
    displayTime = `${mins}:${secs.toString().padStart(2, '0')}`;
    timeLabel = 'Break Left';
    isWarning = breakRemaining <= 120;
    isCritical = breakRemaining <= 30;
  } else if (isCallTime) {
    // Show call time countdown
    const callTimeRemaining = timerData?.callTimeRemaining || 0;
    const mins = Math.floor(Math.abs(callTimeRemaining) / 60);
    const secs = Math.abs(callTimeRemaining) % 60;
    displayTime = callTimeRemaining < 0 
      ? `-${mins}:${secs.toString().padStart(2, '0')}`
      : `${mins}:${secs.toString().padStart(2, '0')}`;
    timeLabel = callTimeRemaining < 0 ? 'OVERDUE!' : 'Call Time Left';
    isWarning = callTimeRemaining <= 120;
    isCritical = callTimeRemaining <= 30 || callTimeRemaining < 0;
  }

  // Calculate played time for display
  const playedMins = timerData?.playedTime
    ? Math.floor(timerData.playedTime / 60)
    : player.played_minutes || 0;

  const getBgColor = () => {
    if (isCritical) return 'bg-red-900/90';
    if (isCallTime) return 'bg-orange-900/90';
    if (isOnBreak) return 'bg-yellow-900/90';
    if (isWarning) return 'bg-amber-900/90';
    return 'bg-gray-900/90';
  };

  const getBorderColor = () => {
    if (isCritical) return 'border-red-500';
    if (isCallTime) return 'border-orange-500';
    if (isOnBreak) return 'border-yellow-500';
    if (isWarning) return 'border-amber-500';
    return 'border-gray-600';
  };

  const getTimerColor = () => {
    if (isCritical) return 'text-red-400';
    if (isCallTime) return 'text-orange-400';
    if (isOnBreak) return 'text-yellow-400';
    if (isWarning) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className={`cursor-pointer group ${isCritical ? 'animate-pulse' : ''}`}>
          {/* Timer badge */}
          <div className="absolute -top-2 -right-2 z-10">
            <Badge
              className={`${
                isCritical
                  ? 'bg-red-500'
                  : isOnBreak
                  ? 'bg-yellow-500'
                  : isCallTime
                  ? 'bg-orange-500'
                  : isWarning
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              } text-white text-[9px] px-1.5 py-0.5 font-mono font-bold`}
            >
              {displayTime}
            </Badge>
          </div>

          {/* Seat number */}
          <div className="absolute -top-1 -left-1 z-10 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">{seatNumber}</span>
          </div>

          {/* Player card */}
          <div
            className={`relative ${getBgColor()} ${getBorderColor()} border-2 rounded-lg px-2 py-1.5 min-w-[75px] max-w-[90px] hover:scale-105 transition-transform`}
          >
            {/* Status badge */}
            {(isOnBreak || isCallTime) && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge 
                  className={`${
                    isCallTime 
                      ? 'bg-orange-500 text-orange-900' 
                      : 'bg-yellow-500 text-yellow-900'
                  } text-[7px] px-1.5 py-0 flex items-center gap-0.5`}
                >
                  {isCallTime ? (
                    <><Timer className="w-2 h-2" /> CALL</>
                  ) : (
                    <><Pause className="w-2 h-2" /> BREAK</>
                  )}
                </Badge>
              </div>
            )}

            <p className="text-white font-medium text-[10px] truncate text-center">
              {player.player_name?.split(' ')[0]}
              {player.player_name?.split(' ')[1]
                ? ` ${player.player_name.split(' ')[1].charAt(0)}.`
                : ''}
            </p>
            <p className="text-gray-400 text-[8px] text-center">Buy-in</p>
            <p className="text-amber-400 font-bold text-xs text-center">
              ₹{(player.buy_in_amount || 0).toLocaleString()}
            </p>
            
            {/* Time info */}
            <div className={`text-center mt-0.5 ${getTimerColor()}`}>
              <p className="text-[7px]">{timeLabel}</p>
            </div>
          </div>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="center"
        className="bg-[#1a1a2e] border-gray-700 w-44"
      >
        <div className="px-2 py-1.5 border-b border-gray-700">
          <p className="text-white font-semibold text-xs">{player.player_name}</p>
          <p className="text-gray-400 text-[10px]">
            Seat {seatNumber} • ₹{(player.buy_in_amount / 1000).toFixed(0)}k • {Math.floor(playedMins / 60)}h {playedMins % 60}m played
          </p>
        </div>

        {isPlaying && (
          <>
            <DropdownMenuItem
              onClick={onBreak}
              className="text-gray-300 cursor-pointer text-xs py-1"
            >
              <Coffee className="w-3 h-3 mr-2" /> Break (15 min)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onCallTime}
              className="text-gray-300 cursor-pointer text-xs py-1"
            >
              <Timer className="w-3 h-3 mr-2" /> Call Time (5 min)
            </DropdownMenuItem>
          </>
        )}

        {isOnBreak && (
          <DropdownMenuItem
            onClick={onResume}
            className="text-emerald-400 cursor-pointer text-xs py-1"
          >
            <Play className="w-3 h-3 mr-2" /> Resume Playing
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="bg-gray-700" />

        <DropdownMenuItem
          onClick={onTransfer}
          className="text-blue-400 cursor-pointer text-xs py-1"
        >
          <ArrowRightLeft className="w-3 h-3 mr-2" /> Transfer Table
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={onRemove}
          className="text-red-400 cursor-pointer text-xs py-1"
        >
          <X className="w-3 h-3 mr-2" /> Remove Player
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ============================================
// EMPTY SEAT COMPONENT
// ============================================
const EmptySeat = ({ seatNumber, onClick }) => (
  <div
    onClick={onClick}
    className="w-10 h-10 rounded-full bg-transparent border-2 border-dashed border-amber-600/50 flex items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-900/20 transition-all group"
  >
    <span className="text-amber-600/70 text-xs font-medium group-hover:text-emerald-400">
      {seatNumber}
    </span>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
const FloorManager = () => {
  const { user, logout } = useAuth();
  const { session, hasActiveSession, loading: isLoadingSession } = useSession();
  const token = localStorage.getItem('auth_token');
  const { toast } = useToast();

  // Sound enabled state (persisted in localStorage)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('floor_manager_sound');
    return saved !== 'false'; // Default to true
  });

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const newValue = !prev;
      localStorage.setItem('floor_manager_sound', newValue.toString());
      return newValue;
    });
  };

  // Current time
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // =================== DATA HOOK ===================
  const {
    tables = [],
    waitlist = [],
    dealers = [],
    loading,
    availableDealers = [],
    totalPlayers = 0,
    totalSeats = 0,
    fetchData,
    getUnseatedPlayers,
  } = useFloorManagerData(session, hasActiveSession, token) || {};

  // =================== TIMER HOOK ===================
  const { getDealerTimer, getPlayerTimer, formatShortDuration } = useFloorManagerTimers(tables, dealers);

  // =================== MODAL STATES ===================
  const [showAddTable, setShowAddTable] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showAssignDealer, setShowAssignDealer] = useState(false);
  const [showAddWaitlist, setShowAddWaitlist] = useState(false);
  const [showSeatWaitlist, setShowSeatWaitlist] = useState(false);
  const [showExtendCallTime, setShowExtendCallTime] = useState(false);
  const [showAddDealer, setShowAddDealer] = useState(false);
  const [showTransferPlayer, setShowTransferPlayer] = useState(false);
  const [selectedPlayerForTransfer, setSelectedPlayerForTransfer] = useState(null);
  const [transferFromTableId, setTransferFromTableId] = useState(null);

  // =================== UI STATES ===================
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [selectedWaitlistEntry, setSelectedWaitlistEntry] = useState(null);
  const [waitlistExpanded, setWaitlistExpanded] = useState(true);
  const [dealersExpanded, setDealersExpanded] = useState(true);

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // =================== COMPUTED VALUES (WITH NULL-SAFETY) ===================
  const readyDealers = (availableDealers && availableDealers.length) || 0;
  const dealersOnBreak = (dealers && dealers.filter?.((d) => d.dealer_status === 'on_break')) || [];
  const assignedDealers = (dealers && dealers.filter?.((d) =>
    tables.some((t) => t.dealer?.dealer_id === d.dealer_id)
  )) || [];

  // =================== FORMATTERS ===================
  const formatTimeHHMMSS = () => {
    return currentTime.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '0:00';
    const absSeconds = Math.abs(Math.floor(seconds));
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
    return seconds < 0 ? `-${formatted}` : formatted;
  };

  // =================== HANDLERS ===================
  const showError = (message) => {
    toast({ variant: 'destructive', title: 'Error', description: message });
  };

  const showSuccess = (message) => {
    toast({ title: 'Success', description: message });
  };

  const handleCreateTable = async (formData) => {
    try {
      await floorManagerService.createTable(formData, token);
      setShowAddTable(false);
      fetchData?.();
      showSuccess('Table created');
    } catch (err) {
      showError(err.message);
    }
  };

  const handleSeatClick = (table, seatNumber) => {
    setSelectedTable(table);
    setSelectedSeat(seatNumber);
    setShowAddPlayer(true);
  };

  const openAssignDealer = useCallback((table) => {
    setSelectedTable(table);
    setShowAssignDealer(true);
  }, []);

  const handleAssignDealer = async (data) => {
    try {
      await floorManagerService.assignDealerToTable(data, token);
      setShowAssignDealer(false);
      fetchData?.();
      showSuccess('Dealer assigned');
    } catch (err) {
      showError(err.message);
    }
  };

  const handleRemoveDealer = async (tableId) => {
    setConfirmDialog({
      open: true,
      title: 'Send Dealer on Break',
      description: 'Send this dealer on a 15-minute break?',
      onConfirm: async () => {
        try {
          await floorManagerService.removeDealerFromTable(tableId, token);
          fetchData?.();
          showSuccess('Dealer on break');
        } catch (err) {
          showError(err.message);
        }
        setConfirmDialog((prev) => ({ ...prev, open: false }));
      },
    });
  };

  const handleDealerAvailable = async (dealerId) => {
    try {
      await floorManagerService.markDealerAvailable(dealerId, token);
      fetchData?.();
      showSuccess('Dealer available');
    } catch (err) {
      showError(err.message);
    }
  };

  const handleAddDealer = async (formData) => {
    try {
      await floorManagerService.createDealer(formData, token);
      fetchData?.();
      showSuccess('Dealer added');
    } catch (err) {
      showError(err.message);
    }
  };

  const handleAddPlayer = async (data) => {
    try {
      const playerData = selectedSeat ? { ...data, seat_number: selectedSeat } : data;
      await floorManagerService.addPlayerToTable(playerData, token);
      setShowAddPlayer(false);
      setSelectedSeat(null);
      fetchData?.();
      showSuccess('Player seated');
    } catch (err) {
      showError(err.message);
    }
  };

  const handlePlayerBreak = async (tablePlayerId) => {
    try {
      await floorManagerService.setPlayerOnBreak(tablePlayerId, token);
      fetchData?.();
      showSuccess('Player on break');
    } catch (err) {
      showError(err.message);
    }
  };

  const handlePlayerResume = async (tablePlayerId) => {
    try {
      await floorManagerService.resumePlayerFromBreak(tablePlayerId, token);
      fetchData?.();
      showSuccess('Player resumed');
    } catch (err) {
      showError(err.message);
    }
  };

  const handleCallTime = async (tablePlayerId) => {
    try {
      await floorManagerService.callTime(tablePlayerId, token);
      fetchData?.();
      showSuccess('Call time started');
    } catch (err) {
      showError(err.message);
    }
  };

  const handleRemovePlayer = async (tablePlayerId, playerName) => {
    setConfirmDialog({
      open: true,
      title: 'Remove Player',
      description: `Remove ${playerName} from the table?`,
      onConfirm: async () => {
        try {
          await floorManagerService.removePlayer(tablePlayerId, '', token);
          fetchData?.();
          showSuccess('Player removed');
        } catch (err) {
          showError(err.message);
        }
        setConfirmDialog((prev) => ({ ...prev, open: false }));
      },
    });
  };

  const handleSeatFromWaitlist = async (waitlistId, data) => {
    try {
      await floorManagerService.seatFromWaitlist(waitlistId, data, token);
      setShowSeatWaitlist(false);
      fetchData?.();
      showSuccess('Player seated from waitlist');
    } catch (err) {
      showError(err.message);
    }
  };

  const handleAddToWaitlist = async (formData) => {
    try {
      await floorManagerService.addToWaitlist(formData, token);
      setShowAddWaitlist(false);
      fetchData?.();
      showSuccess('Added to waitlist');
    } catch (err) {
      showError(err.message);
    }
  };

  const handleOpenTransfer = (player, tableId) => {
    setSelectedPlayerForTransfer(player);
    setTransferFromTableId(tableId);
    setShowTransferPlayer(true);
  };

  const handleTransferPlayer = async (tablePlayerId, newTableId, newSeatNumber) => {
    try {
      await floorManagerService.transferPlayer(tablePlayerId, newTableId, newSeatNumber, token);
      setShowTransferPlayer(false);
      setSelectedPlayerForTransfer(null);
      setTransferFromTableId(null);
      fetchData?.();
      showSuccess('Player transferred successfully');
    } catch (err) {
      showError(err.message);
    }
  };

  // =================== LOADING STATE ===================
  const isLoading = isLoadingSession || (hasActiveSession && loading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a14]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500 mx-auto"></div>
          <p className="mt-3 text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // No session
  if (!hasActiveSession) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="text-center bg-[#1a1a2e] rounded-xl border border-gray-700 p-8 max-w-md">
          <Clock className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-white text-lg font-semibold mb-2">No Active Session</h2>
          <p className="text-gray-400 text-sm">
            Please start a session from the Cashier page.
          </p>
        </div>
      </div>
    );
  }

  // =================== RENDER ===================
  return (
    <div className="min-h-screen bg-[#0a0a14] pb-16">
      {/* =================== HEADER =================== */}
      <header className="bg-[#12121c] border-b border-gray-800 px-4 py-2 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-700 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">♠</span>
            </div>
            <h1 className="text-amber-500 text-sm font-bold tracking-widest">
              FLOOR MANAGER
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Add Dealer Button */}
          <Button
            onClick={() => setShowAddDealer(true)}
            disabled={!hasActiveSession}
            size="sm"
            variant="outline"
            className="border-blue-500 text-blue-400 hover:bg-blue-900/30 h-8 text-xs px-3"
          >
            <Plus className="w-3 h-3 mr-1" />
            Dealer
          </Button>

          {/* Add Player Button */}
          <Button
            onClick={() => {
              setSelectedSeat(null);
              setSelectedTable(null);
              setShowAddPlayer(true);
            }}
            disabled={!hasActiveSession}
            size="sm"
            variant="outline"
            className="border-amber-500 text-amber-400 hover:bg-amber-900/30 h-8 text-xs px-3"
          >
            <UserPlus className="w-3 h-3 mr-1" />
            Player
          </Button>

          {/* Add Table Button */}
          <Button
            onClick={() => setShowAddTable(true)}
            disabled={!hasActiveSession}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs px-3"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Table
          </Button>

          <div className="h-6 w-px bg-gray-700" />

          {/* Stats */}
          <div className="flex items-center gap-1 text-sm">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-white font-medium">{totalPlayers}/{totalSeats}</span>
          </div>

          <div className="flex items-center gap-1 text-sm">
            <span className="text-amber-400">♦</span>
            <span className="text-emerald-400 font-medium">{readyDealers} ready</span>
          </div>

          <div className="flex items-center gap-1 text-sm bg-[#1a1a2e] px-2 py-1 rounded">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-white font-mono">{formatTimeHHMMSS()}</span>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1a1a2e] border-gray-700">
              <div className="px-2 py-1.5 border-b border-gray-700">
                <p className="text-white text-xs font-medium">{user?.full_name || user?.username}</p>
                <p className="text-gray-500 text-[10px]">Floor Manager</p>
              </div>
              <DropdownMenuItem onClick={logout} className="text-red-400 cursor-pointer text-xs">
                <LogOut className="w-3 h-3 mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* =================== MAIN CONTENT =================== */}
      <div className="flex h-[calc(100vh-48px-64px)]">
        {/* LEFT: Tables Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          {tables.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="bg-[#1a1a2e] rounded-xl border border-gray-700 p-8 max-w-md">
                <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-white text-lg font-semibold mb-2">No Tables Active</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Click "+ Table" to create a new table
                </p>
                <Button
                  onClick={() => setShowAddTable(true)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-2" /> Create Table
                </Button>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {tables.map((table) => (
              <PokerTable
                key={table.table_id}
                table={table}
                onSeatClick={handleSeatClick}
                onAssignDealer={openAssignDealer}
                onRemoveDealer={handleRemoveDealer}
                onPlayerBreak={handlePlayerBreak}
                onPlayerResume={handlePlayerResume}
                onCallTime={handleCallTime}
                onRemovePlayer={handleRemovePlayer}
                onTransferPlayer={handleOpenTransfer}
                getPlayerTimer={getPlayerTimer}
                getDealerTimer={getDealerTimer}
                formatTime={formatTime}
              />
            ))}
          </div>
        </div>

        {/* RIGHT: Floor Operations Sidebar */}
        <div className="w-72 bg-[#12121c] border-l border-gray-800 p-4 space-y-4 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-amber-500" />
            <h2 className="text-amber-500 font-bold tracking-wide text-sm">
              FLOOR OPERATIONS
            </h2>
          </div>

          {/* WAITLIST Section */}
          <div className="bg-[#1a1a2e] rounded-lg border border-gray-700/50">
            <div
              className="flex items-center justify-between px-3 py-2 cursor-pointer"
              onClick={() => setWaitlistExpanded(!waitlistExpanded)}
            >
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-xs">WAITLIST</span>
                <Badge className="bg-amber-600 text-white text-[10px] px-1.5">
                  {(waitlist && waitlist.length) || 0}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddWaitlist(true);
                  }}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 h-5 text-[10px] px-2"
                >
                  + Add
                </Button>
                {waitlistExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>

            {waitlistExpanded && (
              <div className="px-2 pb-2 space-y-1 max-h-48 overflow-y-auto">
                {(waitlist && waitlist.length > 0) ? (
                  waitlist.map((entry, idx) => (
                    <div
                      key={entry.waitlist_id}
                      className="flex items-center justify-between bg-gray-800/50 rounded-lg px-2 py-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-white text-xs font-medium">
                            {entry.player_name}
                          </p>
                          <p className="text-gray-500 text-[10px]">
                            {entry.requested_game_type || 'Any'} • {entry.wait_time_mins || 0} min
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedWaitlistEntry(entry);
                          setShowSeatWaitlist(true);
                        }}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 h-6 text-[10px] px-2"
                      >
                        Seat
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-[10px] text-center py-4">
                    No players waiting
                  </p>
                )}
              </div>
            )}
          </div>

          {/* DEALERS Section */}
          <div className="bg-[#1a1a2e] rounded-lg border border-gray-700/50">
            <div
              className="flex items-center justify-between px-3 py-2 cursor-pointer"
              onClick={() => setDealersExpanded(!dealersExpanded)}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-3 h-3 text-amber-500" />
                <span className="text-white font-medium text-xs">DEALERS</span>
                <Badge className="bg-emerald-600 text-white text-[10px] px-1.5">
                  {readyDealers} ready
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddDealer(true);
                  }}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 h-5 text-[10px] px-2"
                >
                  + Add
                </Button>
                {dealersExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>

            {dealersExpanded && (
              <div className="px-2 pb-2 space-y-1 max-h-64 overflow-y-auto">
                {(dealers && dealers.length > 0) ? (
                  dealers.map((dealer) => {
                    const isAssigned = tables.some(
                      (t) => t.dealer?.dealer_id === dealer.dealer_id
                    );
                    const assignedTable = tables.find(
                      (t) => t.dealer?.dealer_id === dealer.dealer_id
                    );
                    const isOnBreak = dealer.dealer_status === 'on_break';
                    const timerData = getDealerTimer(dealer.dealer_id, dealer.dealer_status);

                    return (
                      <div
                        key={dealer.dealer_id}
                        className="flex items-center justify-between bg-gray-800/50 rounded-lg px-2 py-1.5"
                      >
                        <div className="flex items-center gap-2">
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
                          <div>
                            <p className="text-white text-xs font-medium">
                              {dealer.dealer_name}
                            </p>
                            {isOnBreak ? (
                              <div className="flex items-center gap-1">
                                <span className="text-orange-400 text-[10px]">
                                  Break
                                </span>
                                <span className="text-orange-300 text-[10px] font-mono">
                                  {formatTime(timerData?.breakRemaining)} left
                                </span>
                              </div>
                            ) : isAssigned ? (
                              <div className="flex items-center gap-1">
                                <Badge className="bg-blue-600/50 text-blue-300 text-[9px] px-1">
                                  {assignedTable?.table_name}
                                </Badge>
                                <span className="text-blue-300 text-[10px] font-mono">
                                  {formatTime(timerData?.shiftRemaining)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-emerald-400 text-[10px]">
                                Available
                              </span>
                            )}
                          </div>
                        </div>

                        {isOnBreak && (
                          <Button
                            onClick={() => handleDealerAvailable(dealer.dealer_id)}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 h-6 w-6 p-0"
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-[10px] text-center py-4">
                    No dealers
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =================== ALERT NOTIFICATION PANEL =================== */}
      <AlertNotificationPanel
        tables={tables}
        dealers={dealers}
        getPlayerTimer={getPlayerTimer}
        getDealerTimer={getDealerTimer}
        formatTime={formatTime}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
      />

      {/* =================== DIALOGS & MODALS =================== */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent className="bg-[#1a1a2e] border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {confirmDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDialog.onConfirm}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddTableModal
        open={showAddTable}
        onOpenChange={setShowAddTable}
        onSubmit={handleCreateTable}
      />

      <AddPlayerModal
        open={showAddPlayer}
        onOpenChange={(open) => {
          setShowAddPlayer(open);
          if (!open) setSelectedSeat(null);
        }}
        selectedTable={selectedTable}
        selectedSeat={selectedSeat}
        getUnseatedPlayers={getUnseatedPlayers}
        onSubmit={handleAddPlayer}
        tables={tables}
      />

      <AssignDealerModal
        open={showAssignDealer}
        onOpenChange={setShowAssignDealer}
        selectedTable={selectedTable}
        availableDealers={availableDealers}
        onSubmit={handleAssignDealer}
      />

      <AddWaitlistModal
        open={showAddWaitlist}
        onOpenChange={setShowAddWaitlist}
        onSubmit={handleAddToWaitlist}
      />

      <SeatFromWaitlistModal
        open={showSeatWaitlist}
        onOpenChange={setShowSeatWaitlist}
        selectedEntry={selectedWaitlistEntry}
        tables={tables}
        onSubmit={handleSeatFromWaitlist}
      />

      <ExtendCallTimeModal
        open={showExtendCallTime}
        onOpenChange={setShowExtendCallTime}
        selectedPlayer={null}
        onSubmit={async () => {}}
      />

      <AddDealerModal
        open={showAddDealer}
        onClose={() => setShowAddDealer(false)}
        onSubmit={handleAddDealer}
      />

      <TransferPlayerModal
        open={showTransferPlayer}
        onOpenChange={setShowTransferPlayer}
        player={selectedPlayerForTransfer}
        currentTableId={transferFromTableId}
        tables={tables}
        onSubmit={handleTransferPlayer}
      />
    </div>
  );
};

export default FloorManager;