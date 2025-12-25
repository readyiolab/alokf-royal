import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const { token, user } = useAuth(); // ✅ Get user to check role
  
  const [sessionStatus, setSessionStatus] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState('');

  // Check session status function
  const checkSessionStatus = useCallback(async () => {
    if (!token) {
      console.log('❌ No token available, skipping session check');
      setIsLoadingSession(false);
      setSessionStatus(null);
      return null;
    }

    console.log('🔍 Checking session status...');
    console.log('👤 User Role:', user?.role);
    setIsLoadingSession(true);
    
    try {
      let response;
      
      // ✅ FIX: Support admin, cashier, AND floor_manager roles
      if (user?.role === 'admin') {
        console.log('📞 Calling ADMIN session status endpoint');
        response = await adminService.getCurrentSessionStatus();
      } else if (user?.role === 'cashier') {
        console.log('📞 Calling CASHIER session status endpoint');
        response = await cashierService.getTodaySession();
        
        // ✅ Handle response format from getTodaySession
        if (response?.success && response?.data) {
          // Extract the has_active_session and session from response
          const { has_active_session, session } = response.data;
          response = {
            has_active_session: has_active_session,
            session: session
          };
        }
      } else if (user?.role === 'floor_manager') {
        // ✅ NEW: Floor manager uses cashier session endpoint
        console.log('📞 Calling CASHIER session status endpoint (for Floor Manager)');
        response = await cashierService.getTodaySession();
        
        // ✅ Handle response format from getTodaySession
        if (response?.success && response?.data) {
          const { has_active_session, session } = response.data;
          response = {
            has_active_session: has_active_session,
            session: session
          };
        }
      } else {
        // ✅ Better error message with actual role
        throw new Error(`Unsupported user role: ${user?.role || 'unknown'}`);
      }
      
      
      
      // ✅ Handle both formats: {has_active_session, session} or {success, data: {has_active_session, session}}
      const statusData = response?.has_active_session !== undefined 
        ? response 
        : (response?.data || response);
      
      setSessionStatus(statusData);
      setSessionError('');
      
      if (statusData?.has_active_session) {
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
      return null;
    } finally {
      setIsLoadingSession(false);
    }
  }, [token, user]);

  // Open session function
  const openSession = useCallback(async (floatAmount) => {
    if (!token) {
      throw new Error('No authentication token available');
    }

    console.log('🚀 Opening session with float:', floatAmount);
    setIsLoadingSession(true);
    
    try {
      const response = await adminService.openSession(floatAmount);
      console.log('✅ Session open API response:', JSON.stringify(response, null, 2));
      
      // Wait for backend to process
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh session status
      console.log('🔄 Refreshing session status after opening...');
      const newStatus = await checkSessionStatus();
      console.log('📊 New status after opening:', newStatus);
      
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
    
    try {
      const response = await adminService.closeSession();
      console.log('✅ Session close API response:', JSON.stringify(response, null, 2));
      
      // Wait for backend to process
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh session status
      console.log('🔄 Refreshing session status after closing...');
      const newStatus = await checkSessionStatus();
      console.log('📊 New status after closing:', newStatus);
      
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
      // Initial check
      checkSessionStatus();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        console.log('⏰ Auto-refreshing session status...');
        checkSessionStatus();
      }, 30000);
      
      return () => clearInterval(interval);
    } else {
      setIsLoadingSession(false);
      setSessionStatus(null);
    }
  }, [token, user, checkSessionStatus]);

  
  const value = {
    sessionStatus,
    isLoadingSession,
    sessionError,
    checkSessionStatus,
    openSession,
    closeSession,
    // Convenience aliases
    loading: isLoadingSession,
    session: sessionStatus?.session,
    hasActiveSession: sessionStatus?.has_active_session || false,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export default SessionContext;