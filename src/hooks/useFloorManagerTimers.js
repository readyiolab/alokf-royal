// ============================================
// FILE: hooks/useFloorManagerTimers.js
// Timer management hook for Floor Manager
// Handles all countdown calculations from backend data
// ============================================

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Timer Logic:
 * 
 * PLAYER SEATED (PLAYING):
 *   - COUNTDOWN from 120 minutes (7200 seconds) to 0
 *   - When reaches 0, player can call time / leave
 *   - Backend sends: seated_at (when player sat down)
 *   - Display: 7200 - elapsed_since_seated
 * 
 * PLAYER ON BREAK:
 *   - Play timer PAUSED (show paused accumulated time)
 *   - Break timer COUNT DOWN to break_ends_at (typically 15 mins)
 *   - Backend sends: total_played_seconds (frozen), break_ends_at
 * 
 * PLAYER CALL TIME:
 *   - Count DOWN to call_time_ends_at (typically 5 mins)
 *   - When reaches 0, player must leave immediately
 * 
 * DEALER ASSIGNED TO TABLE:
 *   - COUNTDOWN from shift duration (e.g., 30 mins) to 0
 *   - Backend sends: assigned_at, shift_ends_at
 *   - Warning when < 5 minutes remaining
 * 
 * DEALER ON BREAK:
 *   - Count DOWN to break_ends_at (typically 15 mins)
 */

// Constants for default durations (in seconds)
const DEFAULT_MIN_PLAY_TIME = 120 * 60; // 120 minutes = 7200 seconds
const DEFAULT_BREAK_TIME = 15 * 60;     // 15 minutes = 900 seconds
const DEFAULT_CALL_TIME = 5 * 60;       // 5 minutes = 300 seconds
const DEFAULT_DEALER_SHIFT = 30 * 60;   // 30 minutes = 1800 seconds

export const useFloorManagerTimers = (tables = [], dealers = []) => {
  const [tick, setTick] = useState(0);
  const intervalRef = useRef(null);

  // Force re-render every second for live timers
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Build timers object from current data (recalculated each render)
  const timers = useMemo(() => {
    const newTimers = {};
    const now = new Date();

    // =================== DEALER TIMERS FROM DEALERS LIST ===================
    dealers.forEach((dealer) => {
      const dealerId = dealer.dealer_id;

      // ✅ DEALER ON BREAK: Countdown to break_ends_at
      if (dealer.dealer_status === 'on_break') {
        let remainingSeconds = 0;
        
        if (dealer.break_ends_at) {
          const endsAt = new Date(dealer.break_ends_at);
          const remainingMs = endsAt - now;
          remainingSeconds = Math.floor(remainingMs / 1000);
        } else if (dealer.break_started_at) {
          // Calculate from break start if end not provided
          const startedAt = new Date(dealer.break_started_at);
          const elapsedMs = now - startedAt;
          const elapsedSeconds = Math.floor(elapsedMs / 1000);
          remainingSeconds = DEFAULT_BREAK_TIME - elapsedSeconds;
        }
        
        newTimers[`dealer_${dealerId}_break`] = {
          type: 'countdown',
          breakRemaining: Math.max(0, remainingSeconds),
          endsAt: dealer.break_ends_at,
          status: 'on_break',
          isExpired: remainingSeconds <= 0,
        };
      }
      // ✅ DEALER ON TABLE: Countdown to shift_ends_at
      else if (dealer.dealer_status === 'on_table') {
        let remainingSeconds = 0;
        
        if (dealer.shift_ends_at) {
          const endsAt = new Date(dealer.shift_ends_at);
          const remainingMs = endsAt - now;
          remainingSeconds = Math.floor(remainingMs / 1000);
        } else if (dealer.assigned_at) {
          // Calculate from assignment time if end not provided
          const assignedAt = new Date(dealer.assigned_at);
          const elapsedMs = now - assignedAt;
          const elapsedSeconds = Math.floor(elapsedMs / 1000);
          remainingSeconds = DEFAULT_DEALER_SHIFT - elapsedSeconds;
        }
        
        newTimers[`dealer_${dealerId}_shift`] = {
          type: 'countdown',
          shiftRemaining: remainingSeconds,
          endsAt: dealer.shift_ends_at,
          status: 'on_table',
          isEnding: remainingSeconds > 0 && remainingSeconds <= 300, // 5 min warning
          isOverdue: remainingSeconds <= 0,
        };
      }
      // ✅ DEALER AVAILABLE
      else if (dealer.dealer_status === 'available') {
        newTimers[`dealer_${dealerId}_available`] = {
          type: 'available',
          status: 'available',
        };
      }
    });

    // =================== DEALER TIMERS FROM TABLES ===================
    // Process dealer timers embedded in table objects
    tables.forEach((table) => {
      if (!table.dealer) return;
      
      const dealer = table.dealer;
      const dealerId = dealer.dealer_id;
      
      // Skip if already processed from dealers list
      if (newTimers[`dealer_${dealerId}_shift`] || newTimers[`dealer_${dealerId}_break`]) {
        return;
      }
      
      // ✅ DEALER ON TABLE: Real-time countdown
      let remainingSeconds = 0;
      
      if (dealer.shift_ends_at) {
        const endsAt = new Date(dealer.shift_ends_at);
        const remainingMs = endsAt - now;
        remainingSeconds = Math.floor(remainingMs / 1000);
      } else if (dealer.assigned_at) {
        // Calculate from assignment time
        const assignedAt = new Date(dealer.assigned_at);
        const elapsedMs = now - assignedAt;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        remainingSeconds = DEFAULT_DEALER_SHIFT - elapsedSeconds;
      } else {
        // No timing info, use default
        remainingSeconds = DEFAULT_DEALER_SHIFT;
      }
      
      newTimers[`dealer_${dealerId}_shift`] = {
        type: 'countdown',
        shiftRemaining: remainingSeconds,
        endsAt: dealer.shift_ends_at,
        status: 'on_table',
        isEnding: remainingSeconds > 0 && remainingSeconds <= 300,
        isOverdue: remainingSeconds <= 0,
      };
    });

    // =================== PLAYER TIMERS ===================
    tables.forEach((table) => {
      if (!table.players || !Array.isArray(table.players)) return;

      table.players.forEach((player) => {
        const playerId = player.table_player_id;
        const minimumPlaySeconds = (player.minimum_play_time || 120) * 60;

        // ✅ PLAYER ON BREAK: Countdown to break_ends_at
        if (player.player_status === 'on_break') {
          let breakRemaining = 0;
          
          if (player.break_ends_at) {
            const endsAt = new Date(player.break_ends_at);
            const remainingMs = endsAt - now;
            breakRemaining = Math.floor(remainingMs / 1000);
          } else if (player.break_started_at) {
            const startedAt = new Date(player.break_started_at);
            const elapsedMs = now - startedAt;
            const elapsedSeconds = Math.floor(elapsedMs / 1000);
            breakRemaining = DEFAULT_BREAK_TIME - elapsedSeconds;
          }
          
          newTimers[`player_${playerId}_break`] = {
            type: 'countdown',
            breakRemaining: Math.max(0, breakRemaining),
            endsAt: player.break_ends_at,
            status: 'on_break',
            isExpired: breakRemaining <= 0,
          };

          // Store paused play time (frozen while on break)
          const pausedSeconds = parseInt(player.total_played_seconds) || 
                               parseInt(player.played_time_before_break) || 0;
          
          newTimers[`player_${playerId}_played`] = {
            type: 'static',
            playedTime: pausedSeconds,
            remainingTime: minimumPlaySeconds - pausedSeconds,
            status: 'paused',
          };
        }
        // ✅ PLAYER CALL TIME: Countdown to call_time_ends_at
        else if (player.player_status === 'call_time_active') {
          let callTimeRemaining = 0;
          
          if (player.call_time_ends_at) {
            const endsAt = new Date(player.call_time_ends_at);
            const remainingMs = endsAt - now;
            callTimeRemaining = Math.floor(remainingMs / 1000);
          } else if (player.call_time_started_at) {
            const startedAt = new Date(player.call_time_started_at);
            const elapsedMs = now - startedAt;
            const elapsedSeconds = Math.floor(elapsedMs / 1000);
            callTimeRemaining = DEFAULT_CALL_TIME - elapsedSeconds;
          }
          
          newTimers[`player_${playerId}_calltime`] = {
            type: 'countdown',
            callTimeRemaining: callTimeRemaining,
            endsAt: player.call_time_ends_at,
            status: 'call_time_active',
            isOverdue: callTimeRemaining <= 0,
          };
        }
        // ✅ PLAYER PLAYING: COUNTDOWN from 120 minutes
        else if (player.player_status === 'playing') {
          // Calculate elapsed time since seated
          let elapsedSeconds = 0;
          
          if (player.seated_at) {
            const seatedAt = new Date(player.seated_at);
            const elapsedMs = now - seatedAt;
            elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
          }
          
          // Add any previously accumulated time (from breaks, etc.)
          const accumulatedSeconds = parseInt(player.total_played_seconds) || 
                                     parseInt(player.played_time_before_break) || 0;
          
          // Total played time
          const totalPlayedSeconds = accumulatedSeconds + elapsedSeconds;
          
          // COUNTDOWN: Remaining time until minimum play time
          const remainingSeconds = minimumPlaySeconds - totalPlayedSeconds;
          
          newTimers[`player_${playerId}_playing`] = {
            type: 'countdown',
            playedTime: totalPlayedSeconds,
            remainingTime: remainingSeconds,
            minimumPlaySeconds: minimumPlaySeconds,
            canCallTime: remainingSeconds <= 0,
            status: 'playing',
          };
        }
      });
    });

    return newTimers;
  }, [tables, dealers, tick]); // tick ensures updates every second

  // =================== HELPER FUNCTIONS ===================

  /**
   * Get player timer display value
   */
  const getPlayerTimer = useCallback(
    (tablePlayerId, playerStatus) => {
      if (playerStatus === 'on_break') {
        const breakTimer = timers[`player_${tablePlayerId}_break`];
        const playedTimer = timers[`player_${tablePlayerId}_played`];
        return {
          breakRemaining: breakTimer?.breakRemaining || 0,
          playedTime: playedTimer?.playedTime || 0,
          remainingTime: playedTimer?.remainingTime || 0,
          isExpired: breakTimer?.isExpired || false,
          type: 'break',
        };
      }

      if (playerStatus === 'call_time_active') {
        const callTimeTimer = timers[`player_${tablePlayerId}_calltime`];
        return {
          callTimeRemaining: callTimeTimer?.callTimeRemaining || 0,
          isOverdue: callTimeTimer?.isOverdue || false,
          type: 'calltime',
        };
      }

      if (playerStatus === 'playing') {
        const playingTimer = timers[`player_${tablePlayerId}_playing`];
        return {
          playedTime: playingTimer?.playedTime || 0,
          remainingTime: playingTimer?.remainingTime || 0,
          minimumPlaySeconds: playingTimer?.minimumPlaySeconds || DEFAULT_MIN_PLAY_TIME,
          canCallTime: playingTimer?.canCallTime || false,
          type: 'playing',
        };
      }

      return { playedTime: 0, remainingTime: 0, type: 'unknown' };
    },
    [timers]
  );

  /**
   * Get dealer timer display value
   */
  const getDealerTimer = useCallback(
    (dealerId, dealerStatus) => {
      if (dealerStatus === 'on_break') {
        const breakTimer = timers[`dealer_${dealerId}_break`];
        return {
          breakRemaining: breakTimer?.breakRemaining || 0,
          isExpired: breakTimer?.isExpired || false,
          type: 'break',
        };
      }

      if (dealerStatus === 'on_table') {
        const shiftTimer = timers[`dealer_${dealerId}_shift`];
        return {
          shiftRemaining: shiftTimer?.shiftRemaining || 0,
          isEnding: shiftTimer?.isEnding || false,
          isOverdue: shiftTimer?.isOverdue || false,
          type: 'shift',
        };
      }

      return { type: 'available' };
    },
    [timers]
  );

  /**
   * Format seconds to HH:MM:SS
   */
  const formatDuration = useCallback((totalSeconds) => {
    if (totalSeconds === undefined || totalSeconds === null) return '00:00:00';

    const absSeconds = Math.abs(Math.floor(totalSeconds));
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const seconds = absSeconds % 60;

    const formatted = [hours, minutes, seconds]
      .map((v) => v.toString().padStart(2, '0'))
      .join(':');

    return totalSeconds < 0 ? `-${formatted}` : formatted;
  }, []);

  /**
   * Format seconds to MM:SS (short format)
   */
  const formatShortDuration = useCallback((totalSeconds) => {
    if (totalSeconds === undefined || totalSeconds === null) return '00:00';

    const absSeconds = Math.abs(Math.floor(totalSeconds));
    const minutes = Math.floor(absSeconds / 60);
    const seconds = absSeconds % 60;

    const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    return totalSeconds < 0 ? `-${formatted}` : formatted;
  }, []);

  return {
    timers,
    getPlayerTimer,
    getDealerTimer,
    formatDuration,
    formatShortDuration,
  };
};

export default useFloorManagerTimers;