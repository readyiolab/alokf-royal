// ============================================
// FILE: hooks/useFloorManagerTimers.js
// Timer calculations for floor manager dashboard
//
// FEATURES:
// 1. Player timer: Countdown from 120 min, STOPS at 0 (shows TIME UP)
// 2. Call time: 60 minute countdown
// 3. Break time: 15 minute countdown
// 4. Dealer shift: Countdown with PAUSE/RESUME functionality
//    - When dealer goes on break: shift timer PAUSES
//    - When dealer returns: shift timer RESUMES from paused point
// 5. Waitlist timer: Count UP from when player was added
// ============================================

import { useState, useEffect, useCallback, useMemo } from "react";

// Timer constants (in seconds)
const DEFAULT_MIN_PLAY_TIME = 7200; // 120 minutes = 2 hours


const useFloorManagerTimers = (tables = [], dealers = [], waitlist = []) => {
  const [tick, setTick] = useState(0);

  // Update every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  /**
   * ✅ GET PLAYER TIMER DATA
   *
   * Logic:
   * - PLAYING: Countdown from 120 min to 0, then STOP at 0 (show "TIME UP")
   * - ON BREAK: Pause play timer, show break countdown
   * - CALL TIME: Show 60-minute countdown
   */
  const getPlayerTimer = useCallback(
    (tablePlayerId, playerStatus) => {
      // Find player in tables
      let player = null;
      for (const table of tables) {
        if (table.players) {
          player = table.players.find(
            (p) => p.table_player_id === tablePlayerId
          );
          if (player) break;
        }
      }

      if (!player) {
        return {
          playedTime: 0,
          remainingTime: DEFAULT_MIN_PLAY_TIME,
          breakRemaining: 0,
          callTimeRemaining: 0,
          canCallTime: false,
          timeUp: false,
          status: "unknown",
        };
      }

      const now = new Date();
      const minimumPlaySeconds = (player.minimum_play_time || 120) * 60;

      // ✅ Calculate total played time
      let totalPlayedSeconds = 0;
      const accumulatedSeconds =
        parseInt(player.played_time_before_break) ||
        parseInt(player.total_played_seconds) ||
        0;

      if (player.player_status === "playing") {
        // Active playing - calculate current session
        const seatedAt = player.seated_at ? new Date(player.seated_at) : now;
        const currentSessionSeconds = Math.max(
          0,
          Math.floor((now - seatedAt) / 1000)
        );
        totalPlayedSeconds = accumulatedSeconds + currentSessionSeconds;
      } else {
        // On break or call time - use accumulated time
        totalPlayedSeconds = accumulatedSeconds;
      }

      // ✅ FIX: Remaining time should NOT go negative
      const remainingSeconds = Math.max(
        0,
        minimumPlaySeconds - totalPlayedSeconds
      );
      const canCallTime = remainingSeconds <= 0;
      const timeUp = remainingSeconds <= 0;

      // Break remaining calculation
      let breakRemaining = 0;
      if (player.player_status === "on_break" && player.break_ends_at) {
        const breakEndsAt = new Date(player.break_ends_at);
        breakRemaining = Math.max(0, Math.floor((breakEndsAt - now) / 1000));
      }

      // Call time remaining calculation
      let callTimeRemaining = 0;
      if (
        player.player_status === "call_time_active" &&
        player.call_time_ends_at
      ) {
        const callTimeEndsAt = new Date(player.call_time_ends_at);
        callTimeRemaining = Math.floor((callTimeEndsAt - now) / 1000);
      }

      return {
        playedTime: totalPlayedSeconds,
        playedMinutes: Math.floor(totalPlayedSeconds / 60),
        remainingTime: remainingSeconds,
        remainingMinutes: Math.floor(remainingSeconds / 60),
        breakRemaining: breakRemaining,
        callTimeRemaining: callTimeRemaining,
        canCallTime: canCallTime,
        timeUp: timeUp,
        status: player.player_status,
      };
    },
    [tables, tick]
  );

  /**
   * ✅ GET DEALER TIMER DATA
   * 
   * Logic:
   * - ON_TABLE: Countdown shift timer (e.g., 60 min → 0)
   * - ON_BREAK: 
   *   - Shift timer is PAUSED (show paused remaining time)
   *   - Break timer counts down (15 min → 0)
   * - AVAILABLE (after break): Ready to be assigned again
   * 
   * When dealer is assigned to a new table after break:
   * - If they still have paused shift time, it resumes
   * - Otherwise, a new shift starts
   */
  const getDealerTimer = useCallback(
    (dealerId, dealerStatus) => {
      // Find dealer
      const dealer = dealers.find((d) => d.dealer_id === dealerId);

      if (!dealer) {
        return {
          shiftRemaining: 0,
          breakRemaining: 0,
          shiftElapsed: 0,
          isShiftEnding: false,
          isShiftOverdue: false,
          isPaused: false,
          pausedRemaining: 0,
        };
      }

      const now = new Date();

      // ✅ SHIFT REMAINING CALCULATION
      let shiftRemaining = 0;
      let shiftElapsed = 0;
      let isPaused = false;
      let pausedRemaining = 0;

      if (dealer.dealer_status === "on_table") {
        // ✅ ACTIVE ON TABLE - Calculate countdown from shift_ends_at
        if (dealer.shift_ends_at) {
          const shiftEndsAt = new Date(dealer.shift_ends_at);
          shiftRemaining = Math.floor((shiftEndsAt - now) / 1000);
          // Can be negative if overdue
        }

        // Calculate elapsed time
        const shiftStart = dealer.shift_start_time || dealer.current_shift_started_at;
        if (shiftStart) {
          const shiftStartDate = new Date(shiftStart);
          shiftElapsed = Math.max(0, Math.floor((now - shiftStartDate) / 1000));
        }
        
      } else if (dealer.dealer_status === "on_break") {
        // ✅ ON BREAK - Shift timer is PAUSED
        isPaused = true;
        
        // Use the paused remaining time from backend
        pausedRemaining = dealer.shift_paused_remaining_seconds || 0;
        
        // Display paused time as shift remaining (frozen)
        shiftRemaining = pausedRemaining;
      } else if (dealer.dealer_status === "available") {
        // Available - might have paused shift time to resume
        if (dealer.shift_paused_remaining_seconds > 0) {
          pausedRemaining = dealer.shift_paused_remaining_seconds;
          shiftRemaining = pausedRemaining;
        }
      }

      // ✅ BREAK REMAINING CALCULATION
      let breakRemaining = 0;
      if (dealer.dealer_status === "on_break" && dealer.break_ends_at) {
        const breakEndsAt = new Date(dealer.break_ends_at);
        breakRemaining = Math.max(0, Math.floor((breakEndsAt - now) / 1000));
      }

      return {
        // Shift timer
        shiftRemaining: shiftRemaining,
        shiftElapsed: shiftElapsed,
        
        // Break timer
        breakRemaining: breakRemaining,
        
        // Pause state
        isPaused: isPaused,
        pausedRemaining: pausedRemaining,
        
        // Alert flags
        isShiftEnding: shiftRemaining > 0 && shiftRemaining <= 300, // 5 min warning
        isShiftOverdue: shiftRemaining <= 0 && dealer.dealer_status === "on_table",
        isBreakEnding: breakRemaining > 0 && breakRemaining <= 120, // 2 min warning
        isBreakOverdue: breakRemaining <= 0 && dealer.dealer_status === "on_break",
      };
    },
    [dealers, tick]
  );

  /**
   * ✅ GET WAITLIST TIMER DATA
   * Counts UP from when player was added to waitlist
   */
  const getWaitlistTimer = useCallback(
    (waitlistId) => {
      const entry = waitlist.find((w) => w.waitlist_id === waitlistId);

      if (!entry) {
        return {
          waitingSeconds: 0,
          priority: "normal",
        };
      }

      const now = new Date();
      const createdAt = new Date(entry.created_at);
      const waitingSeconds = Math.max(0, Math.floor((now - createdAt) / 1000));
      const waitingMinutes = Math.floor(waitingSeconds / 60);

      // Priority based on waiting time
      let priority = "normal";
      if (waitingMinutes >= 30) {
        priority = "high";
      } else if (waitingMinutes >= 15) {
        priority = "medium";
      }

      return {
        waitingSeconds: waitingSeconds,
        waitingMinutes: waitingMinutes,
        priority: priority,
        createdAt: entry.created_at,
      };
    },
    [waitlist, tick]
  );

  /**
   * ✅ FORMAT WAITING TIME (for waitlist)
   * Shows: "5 min", "1h 30m", etc.
   */
  const formatWaitingTime = useCallback((seconds) => {
    if (!seconds || seconds < 60) return "<1 min";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${minutes} min`;
  }, []);

  /**
   * ✅ FORMAT SHORT DURATION (MM:SS)
   */
  const formatShortDuration = useCallback((seconds) => {
    if (seconds === null || seconds === undefined) return "0:00";
    const absSeconds = Math.abs(Math.floor(seconds));
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    const formatted = `${mins}:${secs.toString().padStart(2, "0")}`;
    return seconds < 0 ? `-${formatted}` : formatted;
  }, []);

  /**
   * ✅ GET ALL PLAYERS WITH TIME STATUS
   */
  const getAllPlayersWithTimers = useMemo(() => {
    const allPlayers = [];

    tables.forEach((table) => {
      if (table.players) {
        table.players.forEach((player) => {
          const timerData = getPlayerTimer(
            player.table_player_id,
            player.player_status
          );
          allPlayers.push({
            ...player,
            table_id: table.table_id,
            table_name: table.table_name,
            table_number: table.table_number,
            timer: timerData,
          });
        });
      }
    });

    return allPlayers;
  }, [tables, getPlayerTimer]);

  /**
   * ✅ GET ALL DEALERS WITH TIMER STATUS
   */
  const getAllDealersWithTimers = useMemo(() => {
    return dealers.map((dealer) => {
      const timerData = getDealerTimer(dealer.dealer_id, dealer.dealer_status);
      
      // Find assigned table
      const assignedTable = tables.find(
        (t) => t.dealer?.dealer_id === dealer.dealer_id
      );
      
      return {
        ...dealer,
        assigned_table_id: assignedTable?.table_id || null,
        assigned_table_name: assignedTable?.table_name || null,
        timer: timerData,
      };
    });
  }, [dealers, tables, getDealerTimer]);

  /**
   * ✅ GET PLAYERS FINISHING SOON
   */
  const getPlayersFinishingSoon = useMemo(() => {
    return getAllPlayersWithTimers
      .filter((p) => p.timer.timeUp || p.player_status === "call_time_active")
      .sort((a, b) => {
        if (
          a.player_status === "call_time_active" &&
          b.player_status !== "call_time_active"
        )
          return -1;
        if (
          b.player_status === "call_time_active" &&
          a.player_status !== "call_time_active"
        )
          return 1;
        if (
          a.player_status === "call_time_active" &&
          b.player_status === "call_time_active"
        ) {
          return a.timer.callTimeRemaining - b.timer.callTimeRemaining;
        }
        return 0;
      });
  }, [getAllPlayersWithTimers]);

  /**
   * ✅ GET DEALERS NEEDING ATTENTION
   * Returns dealers with shift ending soon, overdue, or break ending
   */
  const getDealersNeedingAttention = useMemo(() => {
    return getAllDealersWithTimers.filter((d) => 
      d.timer.isShiftEnding || 
      d.timer.isShiftOverdue || 
      d.timer.isBreakEnding ||
      d.timer.isBreakOverdue
    ).sort((a, b) => {
      // Overdue first
      if (a.timer.isShiftOverdue && !b.timer.isShiftOverdue) return -1;
      if (!a.timer.isShiftOverdue && b.timer.isShiftOverdue) return 1;
      if (a.timer.isBreakOverdue && !b.timer.isBreakOverdue) return -1;
      if (!a.timer.isBreakOverdue && b.timer.isBreakOverdue) return 1;
      // Then by remaining time
      return a.timer.shiftRemaining - b.timer.shiftRemaining;
    });
  }, [getAllDealersWithTimers]);

  return {
    getPlayerTimer,
    getDealerTimer,
    getWaitlistTimer,
    formatWaitingTime,
    formatShortDuration,
    getAllPlayersWithTimers,
    getAllDealersWithTimers,
    getPlayersFinishingSoon,
    getDealersNeedingAttention,
    tick,
  };
};

export default useFloorManagerTimers;