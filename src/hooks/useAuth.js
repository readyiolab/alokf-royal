import { useState, useEffect, useCallback, useRef } from 'react';
import authService from '../services/auth.service';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  
  const logoutRef = useRef(null);

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
  }, []);

  const setAuthData = useCallback((userData, authToken) => {
    authService.storeAuthData(authToken, userData);
    setUser(userData);
    setToken(authToken);
    setIsAuthenticated(true);
  }, []);

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

  const verifyPlayerOTP = useCallback(async (phoneNumber, otpCode) => {
    try {
      setLoading(true);
      const response = await authService.verifyPlayerOTP(phoneNumber, otpCode);
      
      if (response.token && response.player) {
        const userData = { 
          ...response.player, 
          player_id: response.player.id,
          role: 'player'
        };
        authService.storeAuthData(response.token, userData);
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

  // ✅ FIXED: Use window.location.href instead of navigate
  const logout = useCallback(async () => {
    try {
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
      
      // ✅ Force redirect to login page
      window.location.href = '/login';
    }
  }, []); // Empty dependency array

  useEffect(() => {
    logoutRef.current = token;
  }, [token]);

  const hasRole = useCallback((allowedRoles) => {
    if (!user) return false;
    
    const userRole = user.role || (user.player_id ? 'player' : null);
    
    if (!userRole) return false;
    
    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(userRole);
    }
    
    return userRole === allowedRoles;
  }, [user]);

  const getUserRole = useCallback(() => {
    if (!user) return null;
    return user.role || (user.player_id ? 'player' : null);
  }, [user]);

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
      if (error.message?.includes('401')) {
        authService.clearAuthData();
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        window.location.href = '/login';
      }
    }
  }, [token]);

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