import { useState, useEffect, useCallback } from 'react';
import cashierService from '../services/cashier.service';

export const useSession = () => {
  const [session, setSession] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasActiveSession, setHasActiveSession] = useState(false);

  const fetchSessionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both session and dashboard data
      const [sessionResponse, dashboardResponse] = await Promise.all([
        cashierService.getTodaySession().catch(err => ({ success: false, error: err })),
        cashierService.getDashboard().catch(err => ({ success: false, error: err }))
      ]);

      console.log('Session Response:', sessionResponse);
      console.log('Dashboard Response:', dashboardResponse);

      // Handle session data
      if (sessionResponse.success && sessionResponse.data) {
        const sessionData = sessionResponse.data;
        // API returns: { has_active_session: bool, session: {...} }
        const actualSession = sessionData.session || sessionData;
        // More robust check for has_active_session
        const hasActiveFlag = sessionData.has_active_session;
        const isActive = hasActiveFlag === true || hasActiveFlag === 'true' || hasActiveFlag === 1 || hasActiveFlag === '1';
        
        console.log('Session Data:', sessionData);
        console.log('has_active_session value:', hasActiveFlag, 'type:', typeof hasActiveFlag);
        console.log('Setting hasActiveSession:', isActive);
        setSession(actualSession);
        // Use has_active_session flag from API response (backend now handles all edge cases)
        setHasActiveSession(isActive);
      } else {
        setSession(null);
        setHasActiveSession(false);
        
        // Only set error if it's not a "no session" error
        if (sessionResponse.error && !sessionResponse.error.message?.includes('No session')) {
          setError(sessionResponse.error.message);
        }
      }

      // Handle dashboard data
      if (dashboardResponse.success && dashboardResponse.data) {
        setDashboard(dashboardResponse.data);
      } else {
        setDashboard(null);
        
        // Only set error if it's not a "no session" error
        if (dashboardResponse.error && !dashboardResponse.error.message?.includes('No session')) {
          setError(dashboardResponse.error.message);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Session fetch error:', err);
      setError(err.message || 'Failed to load session data');
      setSession(null);
      setDashboard(null);
      setHasActiveSession(false);
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    // Force fresh data fetch without caching
    await fetchSessionData();
  }, [fetchSessionData]);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);


  return {
    session,
    dashboard,
    loading,
    error,
    hasActiveSession,
    refresh,
    refreshSession: refresh // Alias for backward compatibility
  };
};