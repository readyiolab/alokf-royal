import { useState, useEffect, useCallback } from 'react';

/**
 * ✅ COUNTDOWN TIMER HOOK
 * Manages play time, break time, call time, and shift countdowns
 * Supports pause/resume functionality
 */
export const useCountdownTimer = () => {
  const [timers, setTimers] = useState({});

  /**
   * Start a new timer
   * @param {string} timerId - unique timer ID
   * @param {number} totalSeconds - total duration in seconds
   * @param {string} type - 'playTime' | 'breakTime' | 'callTime' | 'shiftTime'
   * @param {Function} onComplete - callback when timer completes
   */
  const startTimer = useCallback((timerId, totalSeconds, type, onComplete = null) => {
    setTimers(prev => ({
      ...prev,
      [timerId]: {
        totalSeconds,
        remainingSeconds: totalSeconds,
        elapsedSeconds: 0,
        type,
        status: 'running', // 'running' | 'paused' | 'completed'
        pausedAt: null,
        pausedRemaining: 0,
        startTime: Date.now(),
        onComplete
      }
    }));
  }, []);

  /**
   * Pause timer
   */
  const pauseTimer = useCallback((timerId) => {
    setTimers(prev => {
      if (!prev[timerId]) return prev;
      return {
        ...prev,
        [timerId]: {
          ...prev[timerId],
          status: 'paused',
          pausedAt: Date.now(),
          pausedRemaining: prev[timerId].remainingSeconds
        }
      };
    });
  }, []);

  /**
   * Resume timer from where it was paused
   */
  const resumeTimer = useCallback((timerId) => {
    setTimers(prev => {
      if (!prev[timerId]) return prev;
      return {
        ...prev,
        [timerId]: {
          ...prev[timerId],
          status: 'running',
          startTime: Date.now() - (prev[timerId].totalSeconds - prev[timerId].pausedRemaining) * 1000,
          pausedAt: null
        }
      };
    });
  }, []);

  /**
   * Stop timer completely
   */
  const stopTimer = useCallback((timerId) => {
    setTimers(prev => {
      const newTimers = { ...prev };
      delete newTimers[timerId];
      return newTimers;
    });
  }, []);

  /**
   * Update timer - called every second
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => {
        const updated = { ...prev };
        let hasChanges = false;

        Object.keys(updated).forEach(timerId => {
          const timer = updated[timerId];

          if (timer.status === 'running') {
            const elapsedMs = Date.now() - timer.startTime;
            const elapsedSeconds = Math.floor(elapsedMs / 1000);
            const remainingSeconds = Math.max(0, timer.totalSeconds - elapsedSeconds);

            updated[timerId] = {
              ...timer,
              elapsedSeconds,
              remainingSeconds
            };

            hasChanges = true;

            // Timer completed
            if (remainingSeconds === 0 && timer.remainingSeconds > 0) {
              updated[timerId].status = 'completed';
              if (timer.onComplete) {
                timer.onComplete();
              }
            }
          }
        });

        return hasChanges ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Format seconds to readable format (e.g., "2h 15m 30s")
   */
  const formatTime = useCallback((seconds) => {
    if (seconds <= 0) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  }, []);

  /**
   * Get timer by ID
   */
  const getTimer = useCallback((timerId) => {
    return timers[timerId] || null;
  }, [timers]);

  return {
    timers,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    formatTime,
    getTimer
  };
};
