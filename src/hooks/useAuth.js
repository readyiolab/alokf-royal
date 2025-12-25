import { useState, useEffect, useCallback, useRef } from 'react';
import authService from '../services/auth.service';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  
  // Use ref to prevent infinite loops
  const logoutRef = useRef(null);

  // Initialize auth state from localStorage - RUN ONLY ONCE
  useEffect(() => {
    const initAuth = () => {
      const storedData = authService.getStoredAuthData();
      if (storedData) {
        setToken(storedData.token);
        setUser(storedData.user);
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    initAuth();
  }, []); // Empty dependency array - run only once on mount

  // Set auth data manually (used after login/OTP verification)
  const setAuthData = useCallback((userData, authToken) => {
    authService.storeAuthData(authToken, userData); // ✅ Store in localStorage
    setUser(userData);
    setToken(authToken);
    setIsAuthenticated(true);
  }, []);

  // Player request OTP
  const requestPlayerOTP = useCallback(async (phoneNumber) => {
    try {
      setLoading(true);
      return await authService.requestPlayerOTP(phoneNumber);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Player verify OTP
  const verifyPlayerOTP = useCallback(async (phoneNumber, otpCode) => {
    try {
      setLoading(true);
      const response = await authService.verifyPlayerOTP(phoneNumber, otpCode);
      
      if (response.token && response.player) {
        const userData = { 
          ...response.player, 
          player_id: response.player.id,
          role: 'player' // ✅ Ensure role is set
        };
        authService.storeAuthData(response.token, userData); // ✅ Store in localStorage
        setToken(response.token);
        setUser(userData);
        setIsAuthenticated(true);
      }
      
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function - ✅ FIXED: No dependencies
  const logout = useCallback(async () => {
    try {
      // Get current token without dependency
      const currentToken = logoutRef.current || token;
      if (currentToken) {
        await authService.logout(currentToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authService.clearAuthData();
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []); // ✅ EMPTY dependency array - prevents unnecessary recreations

  // Update ref when token changes
  useEffect(() => {
    logoutRef.current = token;
  }, [token]);

  // Check if user has specific role
  const hasRole = useCallback((allowedRoles) => {
    if (!user) return false;
    
    const userRole = user.role || (user.player_id ? 'player' : null);
    
    if (!userRole) return false;
    
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(userRole);
    }
    
    return userRole === allowedRoles;
  }, [user]);

  // Get user role
  const getUserRole = useCallback(() => {
    if (!user) return null;
    return user.role || (user.player_id ? 'player' : null);
  }, [user]);

  // Refresh profile - ✅ FIXED: No logout dependency
  const refreshProfile = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await authService.getProfile(token);
      if (response.user || response.player) {
        const userData = response.user || response.player;
        setUser(userData);
        authService.storeAuthData(token, userData);
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      // If unauthorized, call logout directly without dependency
      if (error.message?.includes('401')) {
        authService.clearAuthData();
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    }
  }, [token]); // ✅ Only token dependency - not logout

  return {
    isAuthenticated,
    user,
    token,
    loading,
    setAuthData,
    requestPlayerOTP,
    verifyPlayerOTP,
    logout,
    hasRole,
    getUserRole,
    refreshProfile
  };
};