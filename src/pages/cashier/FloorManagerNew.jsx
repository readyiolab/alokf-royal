import React, { useState, useCallback, useEffect, useRef } from "react";
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
  ArrowRightLeft,
  MapPin,
  Sparkles,
  ListChecks,
  Gift,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

import { useAuth } from "../../hooks/useAuth";
import { useSession } from "../../hooks/useSession";
import useFloorManagerData from "../../hooks/useFloorManagerData";
import useFloorManagerTimers from "../../hooks/useFloorManagerTimers";
import floorManagerService from "../../services/floorManager.service";

import {
  AddTableModal,
  AddPlayerModal,
  AssignDealerModal,
  AddWaitlistModal,
  SeatFromWaitlistModal,
  ExtendCallTimeModal,
  AddDealerModal,
  RakebackModal,
} from "../../components/floor-manager/modals";
import TransferPlayerModal from "../../components/floor-manager/modals/TransferPlayerModal";
import SeatSelectionModal from "../../components/floor-manager/modals/SeatFromWaitlistModal";
import CloseTableConfirmationModal from "../../components/floor-manager/modals/CloseTableConfirmationModal";

// ============================================
// ✅ DEALER DISPLAY COMPONENT (INLINE)
// Shows dealer on table with timer pause/resume indication
// ============================================
const DealerOnTable = ({ dealer, timerData, onRemoveDealer, tableId }) => {
  if (!dealer) return null;

  const {
    shiftRemaining = 0,
    breakRemaining = 0,
    isPaused = false,
    pausedRemaining = 0,
    isShiftEnding = false,
    isShiftOverdue = false,
  } = timerData || {};

  // Format time display
  const formatTimeDisplay = (seconds) => {
    if (seconds === null || seconds === undefined) return "0:00";
    const absSeconds = Math.abs(Math.floor(seconds));
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    const formatted = `${mins}:${secs.toString().padStart(2, "0")}`;
    return seconds < 0 ? `-${formatted}` : formatted;
  };

  // Get background color based on state
  const getBgColor = () => {
    if (isShiftOverdue) return "bg-red-600 animate-pulse";
    if (isShiftEnding) return "bg-orange-600";
    return "bg-gray-800";
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`px-3 py-2 rounded-lg flex justify-center items-center gap-7 text-center ${getBgColor()}`}
      >
        <p className="text-white font-semibold text-xs truncate max-w-[70px]">
          D:{dealer.dealer_name}
        </p>
        <p
          className={`text-sm font-mono font-bold ${
            isShiftOverdue
              ? "text-red-200"
              : isShiftEnding
              ? "text-orange-200"
              : "text-amber-400"
          }`}
        >
          {formatTimeDisplay(shiftRemaining)}
          {isShiftOverdue && " ⚠"}
        </p>
        <p className="text-gray-400 text-[8px]">
          {isShiftOverdue
            ? "OVERDUE"
            : isShiftEnding
            ? "ENDING SOON"
            : "Shift Time"}
        </p>
        <Button
          onClick={() => onRemoveDealer(tableId)}
          size="sm"
          className="mt-1 bg-orange-500 hover:bg-orange-600 h-5 text-[9px] px-2"
        >
          <Coffee className="w-2.5 h-2.5 mr-0.5" /> Break
        </Button>
      </div>
    </div>
  );
};

// ============================================
// ✅ DEALER SIDEBAR ITEM COMPONENT (INLINE)
// Shows dealer in sidebar with pause/resume state
// ============================================
const DealerSidebarItem = ({
  dealer,
  timerData,
  tables,
  onDealerAvailable,
}) => {
  const isAssigned = tables.some(
    (t) => t.dealer?.dealer_id === dealer.dealer_id
  );
  const assignedTable = tables.find(
    (t) => t.dealer?.dealer_id === dealer.dealer_id
  );
  const isOnBreak = dealer.dealer_status === "on_break";

  const {
    shiftRemaining = 0,
    breakRemaining = 0,
    isPaused = false,
    pausedRemaining = 0,
    isShiftEnding = false,
    isShiftOverdue = false,
  } = timerData || {};

  const formatTimeDisplay = (seconds) => {
    if (seconds === null || seconds === undefined) return "0:00";
    const absSeconds = Math.abs(Math.floor(seconds));
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center justify-between bg-gray-800/50 rounded-lg px-2 py-1.5">
      <div className="flex items-center gap-2">
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${
            isOnBreak
              ? "bg-orange-600"
              : isAssigned
              ? "bg-blue-600"
              : "bg-gray-600"
          }`}
        >
          {dealer.dealer_name?.charAt(0)}
        </div>

        {/* Info */}
        <div>
          <p className="text-white text-xs font-medium">{dealer.dealer_name}</p>

          {isOnBreak ? (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-orange-400 text-[10px]">Break</span>
              <span className="text-orange-300 text-[10px] font-mono">
                {formatTimeDisplay(breakRemaining)} left
              </span>
              {/* ✅ Show paused shift time */}
              {pausedRemaining > 0 && (
                <Badge className="bg-yellow-600/50 text-yellow-300 text-[8px] px-1">
                  <Pause className="w-2 h-2 mr-0.5 inline" />
                  {formatTimeDisplay(pausedRemaining)} paused
                </Badge>
              )}
            </div>
          ) : isAssigned ? (
            <div className="flex items-center gap-1">
              <Badge
                className={`${
                  isShiftOverdue
                    ? "bg-red-600/50 text-red-300"
                    : isShiftEnding
                    ? "bg-orange-600/50 text-orange-300"
                    : "bg-blue-600/50 text-blue-300"
                } text-[9px] px-1`}
              >
                {assignedTable?.table_name}
              </Badge>
              <span
                className={`text-[10px] font-mono ${
                  isShiftOverdue
                    ? "text-red-300"
                    : isShiftEnding
                    ? "text-orange-300"
                    : "text-blue-300"
                }`}
              >
                {formatTimeDisplay(shiftRemaining)}
                {isShiftOverdue && " ⚠"}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-emerald-400 text-[10px]">Available</span>
              {/* ✅ Show paused time that will resume when assigned */}
              {pausedRemaining > 0 && (
                <Badge className="bg-blue-600/50 text-blue-300 text-[8px] px-1">
                  {formatTimeDisplay(pausedRemaining)} to resume
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Button - Resume from break */}
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

// ============================================
// WAITLIST ENTRY WITH LIVE AVAILABILITY (T2S4 format)
// ============================================
const WaitlistEntry = ({
  entry,
  index,
  onSeat,
  getWaitlistTimer,
  formatWaitingTime,
  tables = [],
  getPlayerTimer,
}) => {
  const timerData = getWaitlistTimer(entry.waitlist_id);
  const waitingTime = formatWaitingTime(timerData.waitingSeconds);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-400";
      case "medium":
        return "text-orange-400";
      default:
        return "text-gray-400";
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-600";
      case "medium":
        return "bg-orange-600";
      default:
        return "bg-amber-600";
    }
  };

  // ✅ Calculate best available seats (T2S4 format)
  const getBestAvailableSeats = () => {
    const availableSeats = [];
    tables.forEach((table) => {
      const maxSeats = table.max_seats || 9;
      const players = table.players || [];
      const occupiedSeatNumbers = players.map((p) => p.seat_number);
      for (let i = 1; i <= maxSeats; i++) {
        if (!occupiedSeatNumbers.includes(i)) {
          availableSeats.push({
            table_id: table.table_id,
            table_number: table.table_number,
            seat_number: i,
            display: `T${table.table_number}S${i}`,
          });
        }
      }
    });
    return availableSeats.slice(0, 3);
  };

  // ✅ Get players finishing soon (TIME UP or on call time)
  const getPlayersFinishingSoon = () => {
    const finishing = [];
    tables.forEach((table) => {
      const players = table.players || [];
      players.forEach((player) => {
        const td = getPlayerTimer(player.table_player_id, player.player_status);
        if (td.timeUp || player.player_status === "call_time_active") {
          finishing.push({
            table_number: table.table_number,
            seat_number: player.seat_number,
            player_name: player.player_name,
            remaining_seconds: td.callTimeRemaining || 0,
            status:
              player.player_status === "call_time_active"
                ? "call_time"
                : "time_up",
            display: `T${table.table_number}S${player.seat_number}`,
          });
        }
      });
    });
    finishing.sort((a, b) => a.remaining_seconds - b.remaining_seconds);
    return finishing.slice(0, 2);
  };

  const availableSeats = getBestAvailableSeats();
  const playersFinishing = getPlayersFinishingSoon();
  const formatTime = (s) => (s <= 0 ? "NOW" : `${Math.floor(s / 60)}m`);

  return (
    <div className="bg-gray-800/50 rounded-lg px-2 py-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 ${getPriorityBadge(
              timerData.priority
            )} rounded-full flex items-center justify-center text-white text-[10px] font-bold`}
          >
            {index + 1}
          </div>
          <div>
            <p className="text-white text-xs font-medium">
              {entry.player_name}
            </p>
            <div className="flex items-center gap-1">
              <span className="text-gray-500 text-[10px]">
                {entry.requested_game_type || "Any"}
              </span>
              <span className="text-gray-600">•</span>
              <span
                className={`text-[10px] font-medium ${getPriorityColor(
                  timerData.priority
                )}`}
              >
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

      {/* ✅ LIVE Availability Row - Shows T2S4 format */}
      <div className="mt-1.5 pt-1.5 border-t border-gray-700/50">
        {availableSeats.length > 0 ? (
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
          </div>
        ) : playersFinishing.length > 0 ? (
          <div className="flex items-center gap-1 flex-wrap">
            <Clock className="w-2.5 h-2.5 text-blue-400" />
            <span className="text-[9px] text-gray-500">Soon:</span>
            {playersFinishing.map((player, idx) => (
              <Badge
                key={idx}
                className={`${
                  player.status === "time_up"
                    ? "bg-blue-900/60 text-blue-300"
                    : "bg-orange-900/60 text-orange-300"
                } text-[9px] px-1 py-0 h-4`}
              >
                {player.display}{" "}
                {player.status === "time_up"
                  ? "✓"
                  : formatTime(player.remaining_seconds)}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-[9px] text-gray-500">All tables full</span>
        )}
      </div>
    </div>
  );
};

// ============================================
// ALERT NOTIFICATION PANEL
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
  const lastAlertRef = useRef({});
  const [isExpanded, setIsExpanded] = useState(true);
  const alerts = [];

  tables.forEach((table) => {
    if (!table.players) return;
    table.players.forEach((player) => {
      const timerData = getPlayerTimer(
        player.table_player_id,
        player.player_status
      );
      if (player.player_status === "playing" && timerData.timeUp) {
        alerts.push({
          id: `timeup_${player.table_player_id}`,
          type: "time_up",
          priority: "info",
          name: player.player_name,
          tableName: table.table_name,
          timeRemaining: 0,
          message: "TIME UP - Can leave or call time",
          icon: Clock,
        });
      }
      if (player.player_status === "call_time_active") {
        const remaining = timerData?.callTimeRemaining || 0;
        if (remaining <= 300 && remaining > 0) {
          alerts.push({
            id: `calltime_${player.table_player_id}`,
            type: "call_time",
            priority: remaining <= 60 ? "critical" : "warning",
            name: player.player_name,
            tableName: table.table_name,
            timeRemaining: remaining,
            message: `Call time ending in ${formatTime(remaining)}`,
            icon: Timer,
          });
        } else if (remaining <= 0) {
          alerts.push({
            id: `calltime_expired_${player.table_player_id}`,
            type: "call_time_expired",
            priority: "critical",
            name: player.player_name,
            tableName: table.table_name,
            timeRemaining: 0,
            message: "Call time EXPIRED!",
            icon: AlertTriangle,
          });
        }
      }
      if (player.player_status === "on_break") {
        const remaining = timerData?.breakRemaining || 0;
        if (remaining <= 120 && remaining > 0) {
          alerts.push({
            id: `break_${player.table_player_id}`,
            type: "player_break",
            priority: remaining <= 30 ? "critical" : "warning",
            name: player.player_name,
            tableName: table.table_name,
            timeRemaining: remaining,
            message: `Break ending in ${formatTime(remaining)}`,
            icon: Coffee,
          });
        } else if (remaining <= 0) {
          alerts.push({
            id: `break_expired_${player.table_player_id}`,
            type: "player_break_expired",
            priority: "critical",
            name: player.player_name,
            tableName: table.table_name,
            timeRemaining: 0,
            message: "Break time EXPIRED!",
            icon: AlertTriangle,
          });
        }
      }
    });
  });

  // ✅ DEALER ALERTS
  dealers.forEach((dealer) => {
    const timerData = getDealerTimer(dealer.dealer_id, dealer.dealer_status);

    if (dealer.dealer_status === "on_table") {
      const remaining = timerData?.shiftRemaining || 0;
      if (remaining <= 300 && remaining > 0) {
        const assignedTable = tables.find(
          (t) => t.dealer?.dealer_id === dealer.dealer_id
        );
        alerts.push({
          id: `dealer_shift_${dealer.dealer_id}`,
          type: "dealer_shift",
          priority: remaining <= 60 ? "critical" : "warning",
          name: dealer.dealer_name,
          tableName: assignedTable?.table_name || "Unknown",
          timeRemaining: remaining,
          message: `Shift ending in ${formatTime(remaining)}`,
          icon: Clock,
        });
      } else if (remaining <= 0) {
        const assignedTable = tables.find(
          (t) => t.dealer?.dealer_id === dealer.dealer_id
        );
        alerts.push({
          id: `dealer_shift_expired_${dealer.dealer_id}`,
          type: "dealer_shift_expired",
          priority: "critical",
          name: dealer.dealer_name,
          tableName: assignedTable?.table_name || "Unknown",
          timeRemaining: 0,
          message: "Shift time OVERDUE!",
          icon: AlertTriangle,
        });
      }
    }

    if (dealer.dealer_status === "on_break") {
      const remaining = timerData?.breakRemaining || 0;
      if (remaining <= 120 && remaining > 0) {
        alerts.push({
          id: `dealer_break_${dealer.dealer_id}`,
          type: "dealer_break",
          priority: remaining <= 30 ? "critical" : "warning",
          name: dealer.dealer_name,
          tableName: "On Break",
          timeRemaining: remaining,
          message: `Break ending in ${formatTime(remaining)}`,
          icon: Coffee,
        });
      } else if (remaining <= 0) {
        alerts.push({
          id: `dealer_break_expired_${dealer.dealer_id}`,
          type: "dealer_break_expired",
          priority: "critical",
          name: dealer.dealer_name,
          tableName: "On Break",
          timeRemaining: 0,
          message: "Break time EXPIRED!",
          icon: AlertTriangle,
        });
      }
    }
  });

  const sortedAlerts = alerts.sort((a, b) => {
    const priorityOrder = { critical: 0, warning: 1, info: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority])
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    return a.timeRemaining - b.timeRemaining;
  });

  useEffect(() => {
    const criticalAlerts = sortedAlerts.filter(
      (a) => a.priority === "critical"
    );
    if (criticalAlerts.length > 0 && soundEnabled) {
      const now = Date.now();
      const shouldAlert = criticalAlerts.some((alert) => {
        const lastAlertTime = lastAlertRef.current[alert.id] || 0;
        if (now - lastAlertTime > 10000) {
          lastAlertRef.current[alert.id] = now;
          return true;
        }
        return false;
      });
      if (shouldAlert) {
        try {
          const audioContext = new (window.AudioContext ||
            window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.frequency.value = 800;
          oscillator.type = "sine";
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.3
          );
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {}
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      }
    }
  }, [sortedAlerts, soundEnabled]);

  const criticalCount = sortedAlerts.filter(
    (a) => a.priority === "critical"
  ).length;
  const warningCount = sortedAlerts.filter(
    (a) => a.priority === "warning"
  ).length;
  const infoCount = sortedAlerts.filter((a) => a.priority === "info").length;

  if (sortedAlerts.length === 0) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
        isExpanded ? "h-auto max-h-64" : "h-12"
      }`}
    >
      <div
        className={`flex items-center justify-between px-4 py-2 cursor-pointer ${
          criticalCount > 0
            ? "bg-red-900/95 border-t-2 border-red-500"
            : warningCount > 0
            ? "bg-orange-900/95 border-t-2 border-orange-500"
            : "bg-blue-900/95 border-t-2 border-blue-500"
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={criticalCount > 0 ? "animate-pulse" : ""}>
            <Bell
              className={`w-5 h-5 ${
                criticalCount > 0
                  ? "text-red-400"
                  : warningCount > 0
                  ? "text-orange-400"
                  : "text-blue-400"
              }`}
            />
          </div>
          <span className="text-white font-semibold text-sm">
            {criticalCount > 0 ? `${criticalCount} CRITICAL` : ""}
            {criticalCount > 0 && warningCount > 0 ? " • " : ""}
            {warningCount > 0 ? `${warningCount} Warning` : ""}
            {infoCount > 0 && (criticalCount > 0 || warningCount > 0)
              ? " • "
              : ""}
            {infoCount > 0 ? `${infoCount} Info` : ""}
          </span>
          <Badge
            className={`${
              criticalCount > 0
                ? "bg-red-500"
                : warningCount > 0
                ? "bg-orange-500"
                : "bg-blue-500"
            } text-white text-xs`}
          >
            {sortedAlerts.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
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
      {isExpanded && (
        <div className="bg-[#1a1a2e]/98 backdrop-blur-sm overflow-y-auto max-h-52 p-2 space-y-1">
          {sortedAlerts.map((alert) => {
            const IconComponent = alert.icon;
            return (
              <div
                key={alert.id}
                className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                  alert.priority === "critical"
                    ? "bg-red-900/50 border border-red-500/50 animate-pulse"
                    : alert.priority === "warning"
                    ? "bg-orange-900/50 border border-orange-500/50"
                    : "bg-blue-900/50 border border-blue-500/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      alert.priority === "critical"
                        ? "bg-red-600"
                        : alert.priority === "warning"
                        ? "bg-orange-600"
                        : "bg-blue-600"
                    }`}
                  >
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">
                      {alert.name}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {alert.tableName} • {alert.message}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-mono font-bold text-lg ${
                      alert.priority === "critical"
                        ? "text-red-400"
                        : alert.priority === "warning"
                        ? "text-orange-400"
                        : "text-blue-400"
                    }`}
                  >
                    {alert.type === "time_up"
                      ? "TIME UP"
                      : alert.timeRemaining > 0
                      ? formatTime(alert.timeRemaining)
                      : "NOW!"}
                  </p>
                  <p
                    className={`text-xs ${
                      alert.priority === "critical"
                        ? "text-red-300"
                        : "text-gray-400"
                    }`}
                  >
                    {alert.type.replace(/_/g, " ").toUpperCase()}
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
// PLAYER SEAT COMPONENT - Timer STOPS at 0
// ============================================
const PlayerSeat = ({
  player,
  seatNumber,
  getPlayerTimer,
  formatTime,
  onBreak,
  onResume,
  onCallTime,
  onExtendCallTime,
  onRemove,
  onTransfer,
}) => {
  const timerData = getPlayerTimer(
    player.table_player_id,
    player.player_status
  );
  const isOnBreak = player.player_status === "on_break";
  const isCallTime = player.player_status === "call_time_active";
  const isPlaying = player.player_status === "playing";
  const isTimeUp = timerData?.timeUp || timerData?.canCallTime;

  let displayTime = "0:00",
    timeLabel = "Time",
    isWarning = false,
    isCritical = false;

  if (isPlaying) {
    const remainingSeconds = timerData?.remainingTime || 0;
    if (remainingSeconds > 0) {
      const mins = Math.floor(remainingSeconds / 60);
      const secs = remainingSeconds % 60;
      displayTime = `${mins}:${secs.toString().padStart(2, "0")}`;
      timeLabel = "Time Left";
      isWarning = remainingSeconds <= 600;
    } else {
      // ✅ FIX: Timer STOPS at 0, shows TIME UP
      displayTime = "TIME UP";
      timeLabel = "Can Leave";
      isWarning = true;
    }
  } else if (isOnBreak) {
    const breakRemaining = timerData?.breakRemaining || 0;
    const mins = Math.floor(breakRemaining / 60);
    const secs = breakRemaining % 60;
    displayTime = `${mins}:${secs.toString().padStart(2, "0")}`;
    timeLabel = "Break Left";
    isWarning = breakRemaining <= 120;
    isCritical = breakRemaining <= 30;
  } else if (isCallTime) {
    const callTimeRemaining = timerData?.callTimeRemaining || 0;

    // ✅ FIX: Stop at 0, don't go negative
  if (callTimeRemaining > 0) {
    const mins = Math.floor(callTimeRemaining / 60);
    const secs = callTimeRemaining % 60;
    displayTime = `${mins}:${secs.toString().padStart(2, "0")}`;
    timeLabel = "Call Time Left";
    isWarning = callTimeRemaining <= 300;
    isCritical = callTimeRemaining <= 60;
  } else {
    // Timer expired - show EXPIRED
    displayTime = "EXPIRED";
    timeLabel = "Extend Time";
    isCritical = true;
  }
    // const mins = Math.floor(Math.abs(callTimeRemaining) / 60);
    // const secs = Math.abs(callTimeRemaining) % 60;
    // displayTime =
    //   callTimeRemaining < 0
    //     ? `-${mins}:${secs.toString().padStart(2, "0")}`
    //     : `${mins}:${secs.toString().padStart(2, "0")}`;
    // timeLabel = callTimeRemaining < 0 ? "OVERDUE!" : "Call Time Left";
    // isWarning = callTimeRemaining <= 300;
    // isCritical = callTimeRemaining <= 60 || callTimeRemaining < 0;
  }

  const playedMins = timerData?.playedTime
    ? Math.floor(timerData.playedTime / 60)
    : player.played_minutes || 0;

  const getBgColor = () => {
    if (isCritical) return "bg-red-900/90";
    if (isCallTime) return "bg-orange-900/90";
    if (isOnBreak) return "bg-yellow-900/90";
    // REMOVED: if (isTimeUp && isPlaying) return "bg-blue-900/90";
    if (isWarning) return "bg-amber-900/90";
    return "bg-gray-900/90";
  };
  const getBorderColor = () => {
    if (isCritical) return "border-red-500";
    if (isCallTime) return "border-orange-500";
    if (isOnBreak) return "border-yellow-500";
    // REMOVED: if (isTimeUp && isPlaying) return "border-blue-500";
    if (isWarning) return "border-amber-500";
    return "border-gray-600";
  };
  const getTimerColor = () => {
    if (isCritical) return "text-red-400";
    if (isCallTime) return "text-orange-400";
    if (isOnBreak) return "text-yellow-400";
    // REMOVED: if (isTimeUp && isPlaying) return "text-blue-400";
    if (isWarning) return "text-amber-400";
    return "text-emerald-400";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className={`cursor-pointer group  ${
            isCritical ? "animate-pulse" : ""
          }`}
        >
          <div className="absolute -top-5 right-4 z-10">
            <Badge
              className={`${
                isCritical
                  ? "bg-red-500"
                  : isOnBreak
                  ? "bg-yellow-500"
                  : isCallTime
                  ? "bg-orange-500"
                  : isTimeUp && isPlaying
                  ? "bg-blue-500"
                  : isWarning
                  ? "bg-amber-500"
                  : "bg-emerald-600"
              } text-white text-[9px] px-1.5 py-0.5 font-mono font-bold`}
            >
              {displayTime}
            </Badge>
          </div>
          <div className="absolute -top-2 -left-1 z-10 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">
              {seatNumber}
            </span>
          </div>
          <div
            className={`relative ${getBgColor()} ${getBorderColor()} border-2 rounded-lg px-2 py-1.5 min-w-[75px] max-w-[90px] hover:scale-105 transition-transform`}
          >
            {(isOnBreak || isCallTime || (isTimeUp && isPlaying)) && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge
                  className={`${
                    isCallTime
                      ? "bg-orange-500 text-orange-900"
                      : isOnBreak
                      ? "bg-yellow-500 text-yellow-900"
                      : "bg-red-500 text-white"
                  } text-[7px] px-1.5 py-0 flex items-center gap-0.5`}
                >
                  {isCallTime ? (
                    <>
                      <Timer className="w-2 h-2" /> CALL
                    </>
                  ) : isOnBreak ? (
                    <>
                      <Pause className="w-2 h-2" /> BREAK
                    </>
                  ) : (
                    <>
                      <Clock className="w-2 h-2" /> DONE
                    </>
                  )}
                </Badge>
              </div>
            )}
            <p className="text-white font-medium text-[10px] truncate text-center">
              {player.player_name?.split(" ")[0]}
              {player.player_name?.split(" ")[1]
                ? ` ${player.player_name.split(" ")[1].charAt(0)}.`
                : ""}
            </p>
            <p className="text-gray-400 text-[8px] text-center">Buy-in</p>
            <p className="text-amber-400 font-bold text-xs text-center">
              ₹{(player.buy_in_amount || 0).toLocaleString()}
            </p>
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
          <p className="text-white font-semibold text-xs">
            {player.player_name}
          </p>
          <p className="text-gray-400 text-[10px]">
            Seat {seatNumber} • ₹{(player.buy_in_amount / 1000).toFixed(0)}k •{" "}
            {Math.floor(playedMins / 60)}h {playedMins % 60}m
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
            {isTimeUp && (
              <DropdownMenuItem
                onClick={onCallTime}
                className="text-red-400 cursor-pointer text-xs py-1"
              >
                <Timer className="w-3 h-3 mr-2" /> Call Time (60 min)
              </DropdownMenuItem>
            )}
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

        {isCallTime && (
          <DropdownMenuItem
            onClick={onExtendCallTime}
            className="text-orange-400 cursor-pointer text-xs py-1"
          >
            <Clock className="w-3 h-3 mr-2" /> Extend Call Time
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
// POKER TABLE COMPONENT
// ✅ UPDATED: Uses getDealerTimer for dealer display
// ============================================
const PokerTable = ({
  table,
  onSeatClick,
  onAssignDealer,
  onRemoveDealer,
  onPlayerBreak,
  onPlayerResume,
  onCallTime,
   onExtendCallTime,
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

  const getSeatPosition = (seatIndex, total) => {
    const startAngle = -90,
      angleStep = 360 / total;
    const angle = startAngle + seatIndex * angleStep;
    const radian = (angle * Math.PI) / 180;
    return { x: 50 + 46 * Math.cos(radian), y: 58 + 40 * Math.sin(radian) };
  };

  const seats = [];
  for (let i = 1; i <= maxSeats; i++) {
    const player = players.find((p) => p.seat_number === i);
    seats.push({
      seatNumber: i,
      player,
      position: getSeatPosition(i - 1, maxSeats),
    });
  }

  // ✅ Get dealer timer data using the hook
  const dealerTimerData = dealer
    ? getDealerTimer(dealer.dealer_id, dealer.dealer_status)
    : null;

  const dealerShiftRemaining = dealerTimerData?.shiftRemaining || 0;

  return (
    <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl border border-gray-700/50 overflow-hidden shadow-xl">
      <div className="relative w-full aspect-[4/3] p-4">
        <div
          className="absolute inset-[12%] rounded-[50%]"
          style={{
            background: `
      radial-gradient(ellipse at 50% 40%, 
        #2ecc71 0%, 
        #27ae60 20%, 
        #229954 40%, 
        #1e8449 60%, 
        #196f3d 80%, 
        #145a32 100%
      )
    `,
            border: "8px solid #1a1a1a",
            boxShadow:
              "inset 0 0 60px rgba(0,0,0,0.5), inset 0 0 120px rgba(0,0,0,0.3), 0 10px 30px rgba(0,0,0,0.5)",
          }}
        >
          <div className="absolute inset-4 rounded-[50%] border border-[#3d9a6a]/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center opacity-20">
              <p className="text-white text-xs tracking-[0.4em] font-light">
                ROYAL FLUSH
              </p>
            </div>
          </div>
          <div className="absolute top-[20%] left-1/2 transform -translate-x-1/2">
            <Badge
              className={`${
                table.game_type?.includes("Omaha")
                  ? "bg-purple-600"
                  : "bg-amber-600"
              } text-white text-[10px] px-2 py-0.5`}
            >
              {table.game_type?.includes("Omaha") ? "PLO" : "Hold'em"}
            </Badge>
          </div>
          <div className="absolute bottom-[18%] left-1/2 transform -translate-x-1/2 text-center">
            <p className="text-white font-bold text-base">{table.table_name}</p>
            <p className="text-amber-400 text-xs font-medium">{table.stakes}</p>
            <p className="text-gray-400 text-[10px]">
              Min Buy-in: ₹{table.minimum_buy_in?.toLocaleString() || "500"}
            </p>
          </div>
        </div>

        {/* ✅ DEALER DISPLAY - Now using getDealerTimer */}
        {dealer ? (
          <div
            className="absolute z-20"
            style={{ right: "23%", top: "50%", transform: "translateY(-50%)" }}
          >
            <DealerOnTable
              dealer={dealer}
              timerData={dealerTimerData}
              onRemoveDealer={onRemoveDealer}
              tableId={table.table_id}
            />
          </div>
        ) : (
          <div
            className="absolute z-20 cursor-pointer"
            style={{ right: "42%", top: "40%", transform: "translateY(-50%)" }}
            onClick={() => onAssignDealer(table)}
          >
            <div className="px-3 py-2 rounded-lg bg-gray-800/80 border-2 border-dashed border-gray-600 hover:border-emerald-500 transition-colors">
              <p className="text-gray-400 text-[10px] text-center">
                + Add Dealer
              </p>
            </div>
          </div>
        )}

        {seats.map(({ seatNumber, player, position }) => (
          <div
            key={seatNumber}
            className="absolute z-10"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              transform: "translate(-50%, -50%)",
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
                onExtendCallTime={() => onExtendCallTime(player.table_player_id)} 
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

        <div className="absolute bottom-2 right-2">
          <Button
            onClick={() => onEndTable && onEndTable(table.table_id)}
            variant="ghost"
            size="sm"
            className="text-white bg-red-900/20 hover:text-red-400 hover:bg-red-900/20 h-6 text-[10px]"
          >
            <Users className="w-3 h-3 mr-1" /> End Table
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const FloorManager = () => {
  const { user, logout } = useAuth();
  const { session, hasActiveSession, loading: isLoadingSession } = useSession();
  const token = localStorage.getItem("auth_token");
  const { toast } = useToast();

  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem("floor_manager_sound") !== "false"
  );
  const toggleSound = () =>
    setSoundEnabled((prev) => {
      const v = !prev;
      localStorage.setItem("floor_manager_sound", v.toString());
      return v;
    });

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

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

  const {
    getDealerTimer,
    getPlayerTimer,
    getWaitlistTimer,
    formatShortDuration,
    formatWaitingTime,
  } = useFloorManagerTimers(tables, dealers, waitlist);

  const [showAddTable, setShowAddTable] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showAssignDealer, setShowAssignDealer] = useState(false);
  const [showAddWaitlist, setShowAddWaitlist] = useState(false);
  const [showSeatWaitlist, setShowSeatWaitlist] = useState(false);
  const [showExtendCallTime, setShowExtendCallTime] = useState(false);
  const [showAddDealer, setShowAddDealer] = useState(false);
  const [showTransferPlayer, setShowTransferPlayer] = useState(false);
  const [showSeatSelection, setShowSeatSelection] = useState(false);
  const [selectedPlayerForTransfer, setSelectedPlayerForTransfer] =
    useState(null);
  const [transferFromTableId, setTransferFromTableId] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [selectedWaitlistEntry, setSelectedWaitlistEntry] = useState(null);
  const [waitlistExpanded, setWaitlistExpanded] = useState(true);
  const [dealersExpanded, setDealersExpanded] = useState(true);
  const [showRakeback, setShowRakeback] = useState(false);
  const [showCloseTableModal, setShowCloseTableModal] = useState(false);
  const [selectedTableForClose, setSelectedTableForClose] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const readyDealers = availableDealers?.length || 0;
  const formatTimeHHMMSS = () =>
    currentTime.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  const formatTime = (s) => {
    if (s === null || s === undefined) return "0:00";
    const a = Math.abs(Math.floor(s));
    return (
      (s < 0 ? "-" : "") +
      `${Math.floor(a / 60)}:${(a % 60).toString().padStart(2, "0")}`
    );
  };

  const showError = (m) =>
    toast({ variant: "destructive", title: "Error", description: m });
  const showSuccess = (m) => toast({ title: "Success", description: m });

  const handleExtendCallTime = async (tpId) => {
  try {
    // Extend by 15 minutes (you can change this)
    await floorManagerService.extendCallTime(tpId, 15, token);
    fetchData?.();
    showSuccess("Call time extended by 15 minutes");
  } catch (e) {
    showError(e.message);
  }
};

  const handleCreateTable = async (d) => {
    try {
      await floorManagerService.createTable(d, token);
      setShowAddTable(false);
      showSuccess("Table created");
      // Add small delay to ensure backend has processed the creation, then refresh
      setTimeout(async () => {
        if (fetchData) {
          await fetchData();
        }
      }, 500);
    } catch (e) {
      showError(e.message);
    }
  };
  const handleSeatClick = (t, s) => {
    setSelectedTable(t);
    setSelectedSeat(s);
    setShowAddPlayer(true);
  };
  const handleSeatSelected = (t, s) => {
    setSelectedTable(t);
    setSelectedSeat(s);
    setShowSeatSelection(false);
    setShowAddPlayer(true);
  };
  const openAssignDealer = useCallback((t) => {
    setSelectedTable(t);
    setShowAssignDealer(true);
  }, []);
  const handleAssignDealer = async (d) => {
    try {
      await floorManagerService.assignDealerToTable(d, token);
      setShowAssignDealer(false);
      fetchData?.();
      showSuccess("Dealer assigned");
    } catch (e) {
      showError(e.message);
    }
  };
  const handleRemoveDealer = async (tId) => {
    setConfirmDialog({
      open: true,
      title: "Send Dealer on Break",
      description:
        "Send this dealer on a 15-minute break? Their shift timer will be paused.",
      onConfirm: async () => {
        try {
          await floorManagerService.removeDealerFromTable(tId, token);
          fetchData?.();
          showSuccess("Dealer on break - shift timer paused");
        } catch (e) {
          showError(e.message);
        }
        setConfirmDialog((p) => ({ ...p, open: false }));
      },
    });
  };
  const handleEndTable = (tableId) => {
    setSelectedTableForClose(tableId);
    setShowCloseTableModal(true);
  };
  const handleCloseTable = async (tableId) => {
    try {
      await floorManagerService.closeTable(tableId, {}, token);
      setShowCloseTableModal(false);
      setSelectedTableForClose(null);
      fetchData?.();
      showSuccess("Table closed successfully");
    } catch (e) {
      showError(e.message);
    }
  };
  const handleDealerAvailable = async (dId) => {
    try {
      await floorManagerService.markDealerAvailable(dId, token);
      fetchData?.();
      showSuccess(
        "Dealer available - will resume shift when assigned to table"
      );
    } catch (e) {
      showError(e.message);
    }
  };
  const handleAddDealer = async (d) => {
    try {
      await floorManagerService.createDealer(d, token);
      setShowAddDealer(false);
      showSuccess("Dealer added");
      // Add small delay to ensure backend has processed the creation, then refresh
      setTimeout(async () => {
        if (fetchData) {
          await fetchData();
        }
      }, 500);
    } catch (e) {
      showError(e.message);
    }
  };
  const handleAddPlayer = async (d) => {
    try {
      const pd = selectedSeat ? { ...d, seat_number: selectedSeat } : d;
      await floorManagerService.addPlayerToTable(pd, token);
      setShowAddPlayer(false);
      setSelectedSeat(null);
      fetchData?.();
      showSuccess("Player seated");
    } catch (e) {
      showError(e.message);
    }
  };
  const handlePlayerBreak = async (tpId) => {
    try {
      await floorManagerService.setPlayerOnBreak(tpId, token);
      fetchData?.();
      showSuccess("Player on break");
    } catch (e) {
      showError(e.message);
    }
  };
  const handlePlayerResume = async (tpId) => {
    try {
      await floorManagerService.resumePlayerFromBreak(tpId, token);
      fetchData?.();
      showSuccess("Player resumed");
    } catch (e) {
      showError(e.message);
    }
  };
  const handleCallTime = async (tpId) => {
    try {
      await floorManagerService.callTime(tpId, token);
      fetchData?.();
      showSuccess("Call time started (60 minutes)");
    } catch (e) {
      showError(e.message);
    }
  };
  const handleRemovePlayer = async (tpId, pName) => {
    setConfirmDialog({
      open: true,
      title: "Remove Player",
      description: `Remove ${pName} from the table?`,
      onConfirm: async () => {
        try {
          await floorManagerService.removePlayer(tpId, "", token);
          fetchData?.();
          showSuccess("Player removed");
        } catch (e) {
          showError(e.message);
        }
        setConfirmDialog((p) => ({ ...p, open: false }));
      },
    });
  };
  const handleSeatFromWaitlist = async (wId, d) => {
    try {
      await floorManagerService.seatFromWaitlist(wId, d, token);
      setShowSeatWaitlist(false);
      setSelectedWaitlistEntry(null);
      fetchData?.();
      showSuccess("Player seated from waitlist");
    } catch (e) {
      showError(e.message);
    }
  };

  const handleSeatFromWaitlistSelection = async (table, seat) => {
    if (!selectedWaitlistEntry) return;

    try {
      await floorManagerService.seatFromWaitlist(
        selectedWaitlistEntry.waitlist_id,
        {
          table_id: table.table_id,
          seat_number: seat,
        },
        token
      );

      setShowSeatWaitlist(false);
      setSelectedWaitlistEntry(null);
      fetchData?.();
      showSuccess("Player seated from waitlist");
    } catch (e) {
      showError(e.message);
    }
  };
  const handleAddToWaitlist = async (d) => {
    try {
      await floorManagerService.addToWaitlist(d, token);
      setShowAddWaitlist(false);
      fetchData?.();
      showSuccess("Added to waitlist");
    } catch (e) {
      showError(e.message);
    }
  };
  const handleOpenTransfer = (p, tId) => {
    setSelectedPlayerForTransfer(p);
    setTransferFromTableId(tId);
    setShowTransferPlayer(true);
  };
  const handleTransferPlayer = async (tpId, ntId, ns) => {
    try {
      await floorManagerService.transferPlayer(tpId, ntId, ns, token);
      setShowTransferPlayer(false);
      setSelectedPlayerForTransfer(null);
      setTransferFromTableId(null);
      fetchData?.();
      showSuccess("Player transferred");
    } catch (e) {
      showError(e.message);
    }
  };

  const isLoading = isLoadingSession || (hasActiveSession && loading);
  if (isLoading)
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a14]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500 mx-auto"></div>
          <p className="mt-3 text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  if (!hasActiveSession)
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="text-center bg-[#1a1a2e] rounded-xl border border-gray-700 p-8 max-w-md">
          <Clock className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-white text-lg font-semibold mb-2">
            No Active Session
          </h2>
          <p className="text-gray-400 text-sm">
            Please start a session from the Cashier page.
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-black">
      {/* HEADER */}
      <header className="bg-[#12121c] border-b border-gray-800 px-4 py-2 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8  flex items-center justify-center">
              <img src="./flr.png" alt="" />
            </div>
            <h1 className="text-amber-500 text-sm font-bold tracking-widest">
              FLOOR MANAGER
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
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
          <Button
            onClick={() => setShowRakeback(true)}
            disabled={!hasActiveSession}
            size="sm"
            variant="outline"
            className="border-amber-500 text-amber-400 hover:bg-amber-900/30 h-8 text-xs px-3"
          >
            <Gift className="w-3 h-3 mr-1" />
            Rakeback
          </Button>
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
          <div className="flex items-center gap-1 text-sm">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-white font-medium">
              {totalPlayers}/{totalSeats}
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-amber-400">♦</span>
            <span className="text-emerald-400 font-medium">
              {readyDealers} ready
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm bg-[#1a1a2e] px-2 py-1 rounded">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-white font-mono">{formatTimeHHMMSS()}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-[#1a1a2e] border-gray-700"
            >
              <div className="px-2 py-1.5 border-b border-gray-700">
                <p className="text-white text-xs font-medium">
                  {user?.full_name || user?.username}
                </p>
                <p className="text-gray-500 text-[10px]">Floor Manager</p>
              </div>
              <DropdownMenuItem
                onClick={logout}
                className="text-red-400 cursor-pointer text-xs"
              >
                <LogOut className="w-3 h-3 mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex min-h-screen">
        {/* Tables Grid */}
        <div className="flex-1 p-4 overflow-y-auto pb-20">
          {tables.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="bg-[#1a1a2e] rounded-xl border border-gray-700 p-8 max-w-md">
                <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-white text-lg font-semibold mb-2">
                  No Tables Active
                </h3>
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
                 onExtendCallTime={handleExtendCallTime}
                onRemovePlayer={handleRemovePlayer}
                onTransferPlayer={handleOpenTransfer}
                onEndTable={handleEndTable}
                getPlayerTimer={getPlayerTimer}
                getDealerTimer={getDealerTimer}
                formatTime={formatTime}
              />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-72 bg-[#12121c] border-l border-gray-800 p-4 space-y-4 overflow-y-auto pb-20">
          <div className="flex items-center  gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h2 className=" font-bold tracking-wide text-sm">
              FLOOR OPERATIONS
            </h2>
          </div>

          {/* WAITLIST with LIVE availability (T2S4 format) */}
          <div className="bg-[#1a1a2e] rounded-lg border border-gray-700/50">
            <div
              className="flex items-center justify-between px-3 py-2 cursor-pointer"
              onClick={() => setWaitlistExpanded(!waitlistExpanded)}
            >
              <div className="flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-emerald-600" />
                <span className="text-white font-medium text-xs">WAITLIST</span>
                <Badge className="bg-gray-400 text-white text-[10px] px-1.5">
                  {waitlist?.length || 0}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddWaitlist(true);
                  }}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-70 text-white h-5 text-[10px] px-2"
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
              <div className="px-2 pb-2 space-y-1 max-h-64 overflow-y-auto">
                {waitlist && waitlist.length > 0 ? (
                  waitlist.map((entry, idx) => (
                    <WaitlistEntry
                      key={entry.waitlist_id}
                      entry={entry}
                      index={idx}
                      onSeat={(e) => {
                        setSelectedWaitlistEntry(e);
                        setShowSeatWaitlist(true);
                      }}
                      getWaitlistTimer={getWaitlistTimer}
                      formatWaitingTime={formatWaitingTime}
                      tables={tables}
                      getPlayerTimer={getPlayerTimer}
                    />
                  ))
                ) : (
                  <p className="text-gray-500 text-[10px] text-center py-4">
                    No players waiting
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ✅ DEALERS - Now using DealerSidebarItem with pause/resume */}
          <div className="bg-[#1a1a2e] rounded-lg border border-gray-700/50">
            <div
              className="flex items-center justify-between px-3 py-2 cursor-pointer"
              onClick={() => setDealersExpanded(!dealersExpanded)}
            >
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3 text-amber-500" />
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
                {dealers && dealers.length > 0 ? (
                  dealers.map((dealer) => {
                    const timerData = getDealerTimer(
                      dealer.dealer_id,
                      dealer.dealer_status
                    );
                    return (
                      <DealerSidebarItem
                        key={dealer.dealer_id}
                        dealer={dealer}
                        timerData={timerData}
                        tables={tables}
                        onDealerAvailable={handleDealerAvailable}
                      />
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

      {/* ALERTS */}
      <AlertNotificationPanel
        tables={tables}
        dealers={dealers}
        getPlayerTimer={getPlayerTimer}
        getDealerTimer={getDealerTimer}
        formatTime={formatTime}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
      />

      {/* MODALS */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(o) => setConfirmDialog((p) => ({ ...p, open: o }))}
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
        onOpenChange={(o) => {
          setShowAddPlayer(o);
          if (!o) setSelectedSeat(null);
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
        tables={tables}
      />
      <SeatFromWaitlistModal
        open={showSeatWaitlist}
        onOpenChange={setShowSeatWaitlist}
        selectedEntry={selectedWaitlistEntry}
        tables={tables}
        onSelectSeat={handleSeatFromWaitlistSelection}
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
      <SeatSelectionModal
        open={showSeatSelection}
        onOpenChange={setShowSeatSelection}
        tables={tables}
        onSelectSeat={handleSeatSelected}
      />

      <RakebackModal
        open={showRakeback}
        onOpenChange={setShowRakeback}
        sessionId={session?.session_id}
      />
      <CloseTableConfirmationModal
        open={showCloseTableModal}
        onOpenChange={setShowCloseTableModal}
        tableId={selectedTableForClose}
        onConfirm={handleCloseTable}
      />
    </div>
  );
};

export default FloorManager;
