// ============================================
// FILE: hooks/useFloorManagerTimers.js
// Timer calculations for floor manager dashboard
//
// FEATURES:
// 1. Player timer: Countdown from 120 min, STOPS at 0 (shows TIME UP)
// 2. Call time: 60 minute countdown
// 3. Break time: 15 minute countdown
// 4. Dealer shift: Countdown with pause/resume
// 5. Waitlist timer: Count UP from when player was added
// ============================================

import { useState, useEffect, useCallback, useMemo } from "react";

// Timer constants (in seconds)
const DEFAULT_MIN_PLAY_TIME = 7200; // 120 minutes = 2 hours
const DEFAULT_CALL_TIME = 3600; // 60 minutes (UPDATED from 5 min)
const DEFAULT_BREAK_TIME = 900; // 15 minutes
const DEFAULT_DEALER_SHIFT = 3600; // 60 minutes

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
      // When remaining is 0 or less, player has completed minimum time
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
        // Can be negative (overdue)
      }

      return {
        playedTime: totalPlayedSeconds,
        playedMinutes: Math.floor(totalPlayedSeconds / 60),
        remainingTime: remainingSeconds, // ✅ FIX: Never negative
        remainingMinutes: Math.floor(remainingSeconds / 60),
        breakRemaining: breakRemaining,
        callTimeRemaining: callTimeRemaining,
        canCallTime: canCallTime,
        timeUp: timeUp, // ✅ NEW: True when player has completed minimum time
        status: player.player_status,
      };
    },
    [tables, tick]
  );

  /**
   * ✅ GET DEALER TIMER DATA
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
        };
      }

      const now = new Date();

      // Shift remaining calculation
      let shiftRemaining = 0;
      let shiftElapsed = 0;

      if (dealer.dealer_status === "on_table") {
        // Active on table - calculate from shift_ends_at
        if (dealer.shift_ends_at) {
          const shiftEndsAt = new Date(dealer.shift_ends_at);
          shiftRemaining = Math.floor((shiftEndsAt - now) / 1000);
        }

        // Calculate elapsed
        if (dealer.shift_start_time) {
          const shiftStart = new Date(dealer.shift_start_time);
          shiftElapsed = Math.max(0, Math.floor((now - shiftStart) / 1000));
        }
      } else if (dealer.dealer_status === "on_break") {
        // On break - use paused remaining time
        shiftRemaining = dealer.shift_paused_remaining_seconds || 0;
      }

      // Break remaining calculation
      let breakRemaining = 0;
      if (dealer.dealer_status === "on_break" && dealer.break_ends_at) {
        const breakEndsAt = new Date(dealer.break_ends_at);
        breakRemaining = Math.max(0, Math.floor((breakEndsAt - now) / 1000));
      }

      return {
        shiftRemaining: shiftRemaining,
        shiftElapsed: shiftElapsed,
        breakRemaining: breakRemaining,
        isShiftEnding: shiftRemaining > 0 && shiftRemaining <= 300,
        isShiftOverdue:
          shiftRemaining <= 0 && dealer.dealer_status === "on_table",
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
   * Returns array of all players with their timer data
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
   * ✅ GET PLAYERS FINISHING SOON
   * Returns players who have completed minimum time or on call time
   */
  const getPlayersFinishingSoon = useMemo(() => {
    return getAllPlayersWithTimers
      .filter((p) => p.timer.timeUp || p.player_status === "call_time_active")
      .sort((a, b) => {
        // Call time players first (sorted by remaining time)
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

  return {
    getPlayerTimer,
    getDealerTimer,
    getWaitlistTimer,
    formatWaitingTime,
    formatShortDuration,
    getAllPlayersWithTimers,
    getPlayersFinishingSoon,
    tick,
  };
};

export default useFloorManagerTimers;
