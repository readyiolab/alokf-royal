import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import adminService from '../services/admin.service';
import cashierService from '../services/cashier.service';

const SessionContext = createContext();

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider = ({ children }) => {
  const { token, user } = useAuth();
  
  const [sessionStatus, setSessionStatus] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState('');
  
  // ✅ ADD: Force update counter to trigger re-renders
  const [updateCounter, setUpdateCounter] = useState(0);

  // Check session status function
  const checkSessionStatus = useCallback(async () => {
    if (!token) {
      console.log('❌ No token available, skipping session check');
      setIsLoadingSession(false);
      setSessionStatus(null);
      setDashboard(null);
      return null;
    }

    console.log('🔍 Checking session status...');
    console.log('👤 User Role:', user?.role);
    setIsLoadingSession(true);
    
    try {
      let response;
      let dashboardResponse = null;
      
      if (user?.role === 'admin') {
        console.log('📞 Calling ADMIN session status endpoint');
        response = await adminService.getCurrentSessionStatus();
      } else if (user?.role === 'cashier' || user?.role === 'floor_manager') {
        console.log('📞 Calling CASHIER session status endpoint');
        
        // ✅ Fetch both session AND dashboard
        const [sessionRes, dashRes] = await Promise.all([
          cashierService.getTodaySession(),
          cashierService.getDashboard().catch(() => null)
        ]);
        
        console.log('📦 Raw sessionRes:', JSON.stringify(sessionRes, null, 2));
        console.log('📦 Raw sessionRes.data:', JSON.stringify(sessionRes?.data, null, 2));
        
        response = sessionRes;
        dashboardResponse = dashRes;
        
        // Handle response format from getTodaySession
        if (response?.success && response?.data) {
          const { has_active_session, session } = response.data;
          console.log('🔍 Extracted has_active_session:', has_active_session, 'type:', typeof has_active_session);
          console.log('🔍 Extracted session:', session);
          console.log('🔍 Session is_closed:', session?.is_closed, 'type:', typeof session?.is_closed);
          
          response = {
            has_active_session: has_active_session,
            session: session
          };
        }
        
        // ✅ Set dashboard data - always set to ensure fresh data
        if (dashboardResponse?.success && dashboardResponse?.data) {
          console.log('✅ Dashboard data received');
          // ✅ Only set dashboard if there's an active session
          // If no active session, dashboard should be null/empty
          const hasActive = response?.has_active_session === true || 
                           response?.has_active_session === 'true' || 
                           response?.has_active_session === 1 || 
                           response?.has_active_session === '1';
          if (hasActive) {
            setDashboard(dashboardResponse.data);
          } else {
            // ✅ Clear dashboard if no active session
            setDashboard(null);
          }
        } else {
          // ✅ Always clear dashboard if no data or error
          setDashboard(null);
        }
      } else {
        throw new Error(`Unsupported user role: ${user?.role || 'unknown'}`);
      }
      
      const statusData = response?.has_active_session !== undefined 
        ? response 
        : (response?.data || response);
      
      console.log('📊 Setting sessionStatus:', statusData);
      console.log('📊 has_active_session value:', statusData?.has_active_session, 'type:', typeof statusData?.has_active_session);
      
      // ✅ IMPORTANT: Set state and force update
      setSessionStatus(statusData);
      setSessionError('');
      
      // ✅ Force update counter to trigger re-renders
      setUpdateCounter(prev => prev + 1);
      
      const isActive = statusData?.has_active_session === true || 
                       statusData?.has_active_session === 'true' || 
                       statusData?.has_active_session === 1 || 
                       statusData?.has_active_session === '1';
      console.log('📊 Computed isActive:', isActive);
      
      if (isActive) {
        console.log('🟢 Active session found!');
        console.log('Session ID:', statusData.session?.session_id);
      } else {
        console.log('🔴 No active session');
      }
      
      return statusData;
    } catch (error) {
      console.error('❌ Session check error:', error);
      setSessionError('Failed to check session status');
      setSessionStatus({ has_active_session: false });
      setDashboard(null);
      setUpdateCounter(prev => prev + 1);
      return null;
    } finally {
      setIsLoadingSession(false);
    }
  }, [token, user]);

  // ✅ Refresh function (alias for checkSessionStatus)
  const refresh = useCallback(async () => {
    console.log('🔃 REFRESH called');
    const result = await checkSessionStatus();
    // Force update after refresh
    setUpdateCounter(prev => prev + 1);
    return result;
  }, [checkSessionStatus]);

  // Open session function
  const openSession = useCallback(async (floatAmount) => {
    if (!token) {
      throw new Error('No authentication token available');
    }

    console.log('🚀 Opening session with float:', floatAmount);
    setIsLoadingSession(true);
    
    // ✅ Immediately clear dashboard data when opening new session to ensure fresh start
    setDashboard(null);
    setUpdateCounter(prev => prev + 1);
    
    try {
      const response = await adminService.openSession(floatAmount);
      console.log('✅ Session open API response:', JSON.stringify(response, null, 2));
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('🔄 Refreshing session status after opening...');
      const newStatus = await checkSessionStatus();
      console.log('📊 New status after opening:', newStatus);
      
      // Force update
      setUpdateCounter(prev => prev + 1);
      
      return response;
    } catch (error) {
      console.error('❌ Open session error:', error);
      setSessionError(error.message);
      throw error;
    } finally {
      setIsLoadingSession(false);
    }
  }, [token, checkSessionStatus]);

  // Close session function
  const closeSession = useCallback(async () => {
    if (!token) {
      throw new Error('No authentication token available');
    }

    console.log('🛑 Closing session...');
    setIsLoadingSession(true);
    
    // ✅ Immediately clear dashboard data when closing session
    setDashboard(null);
    setUpdateCounter(prev => prev + 1);
    
    try {
      const response = await adminService.closeSession();
      console.log('✅ Session close API response:', JSON.stringify(response, null, 2));
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('🔄 Refreshing session status after closing...');
      const newStatus = await checkSessionStatus();
      console.log('📊 New status after closing:', newStatus);
      
      // Force update
      setUpdateCounter(prev => prev + 1);
      
      return response;
    } catch (error) {
      console.error('❌ Close session error:', error);
      setSessionError(error.message);
      throw error;
    } finally {
      setIsLoadingSession(false);
    }
  }, [token, checkSessionStatus]);

  // Initialize on mount and when token changes
  useEffect(() => {
    console.log('🔄 SessionProvider Effect - Token:', token ? 'Present ✓' : 'Missing ✗');
    console.log('🔄 SessionProvider Effect - User:', user?.username, '- Role:', user?.role);
    
    if (token && user) {
      checkSessionStatus();
      
      // ❌ REMOVED: Auto-refresh causes UI blinking when modals are open
      // const interval = setInterval(() => {
      //   console.log('⏰ Auto-refreshing session status...');
      //   checkSessionStatus();
      // }, 30000);
      
      // return () => clearInterval(interval);
    } else {
      setIsLoadingSession(false);
      setSessionStatus(null);
      setDashboard(null);
    }
  }, [token, user, checkSessionStatus]);

  
  // ✅ CRITICAL: Include updateCounter in dependencies to force context updates
  const value = useMemo(() => {
    // Compute hasActiveSession more robustly
    const hasActiveSessionValue = sessionStatus?.has_active_session === true || 
                                   sessionStatus?.has_active_session === 'true' || 
                                   sessionStatus?.has_active_session === 1 || 
                                   sessionStatus?.has_active_session === '1';
    
    const contextValue = {
      sessionStatus,
      isLoadingSession,
      sessionError,
      checkSessionStatus,
      openSession,
      closeSession,
      // Convenience aliases
      loading: isLoadingSession,
      session: sessionStatus?.session,
      hasActiveSession: hasActiveSessionValue,
      dashboard,
      refresh,
      refreshSession: refresh,
      // ✅ Add updateCounter so consumers know when to re-render
      _updateCounter: updateCounter,
    };
    
    console.log('🔄 Context value object created - hasActiveSession:', hasActiveSessionValue, 'sessionStatus?.has_active_session:', sessionStatus?.has_active_session, 'updateCounter:', updateCounter);
    
    return contextValue;
  }, [sessionStatus, isLoadingSession, sessionError, checkSessionStatus, openSession, closeSession, dashboard, refresh, updateCounter]);

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export default SessionContext;