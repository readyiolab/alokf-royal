import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Initialize auth state from localStorage - RUN ONLY ONCE
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedData = authService.getStoredAuthData();
        if (storedData && storedData.token && storedData.user) {
          // ✅ Validate token expiration before setting auth state
          try {
            // Decode JWT token to check expiration
            const tokenParts = storedData.token.split('.');
            if (tokenParts.length === 3) {
              const tokenPayload = JSON.parse(atob(tokenParts[1]));
              const currentTime = Date.now() / 1000; // Current time in seconds
              
              // Check if token is expired
              if (tokenPayload.exp && tokenPayload.exp < currentTime) {
                console.log('Token expired, clearing auth data');
                authService.clearAuthData();
                setToken(null);
                setUser(null);
                setIsAuthenticated(false);
                // Redirect to login if not already there
                if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
                  window.location.href = '/login';
                }
                return;
              }
            }
            
            // Token is valid, set auth state
            setToken(storedData.token);
            setUser(storedData.user);
            setIsAuthenticated(true);
          } catch (tokenError) {
            // Invalid token format or expired, clear auth
            console.error('Invalid or expired token:', tokenError);
            authService.clearAuthData();
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
            if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
              window.location.href = '/login';
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.clearAuthData();
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []); // Empty dependency array - run only once on mount

  // Set auth data manually (used after login/OTP verification)
  const setAuthData = useCallback((userData, authToken) => {
    authService.storeAuthData(authToken, userData);
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

  // Player verify OTP - FIXED
  const verifyPlayerOTP = useCallback(async (phoneNumber, otpCode) => {
    try {
      setLoading(true);
      const response = await authService.verifyPlayerOTP(phoneNumber, otpCode);
      
      if (response.token && response.player) {
        const userData = { 
          ...response.player, 
          player_id: response.player.id,
          role: 'player' // Ensure role is set
        };
        
        // Store in localStorage
        authService.storeAuthData(response.token, userData);
        
        // Update state - CRITICAL ORDER
        setToken(response.token);
        setUser(userData);
        setIsAuthenticated(true);
      }
      
      return response;
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Staff login - ADD THIS
  const staffLogin = useCallback(async (email, password) => {
    try {
      setLoading(true);
      const response = await authService.login(email, password);
      
      if (response.token && response.user) {
        const userData = {
          ...response.user,
          role: response.user.role || 'staff'
        };
        
        authService.storeAuthData(response.token, userData);
        setToken(response.token);
        setUser(userData);
        setIsAuthenticated(true);
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Verify OTP for staff - ADD THIS
  const verifyStaffOTP = useCallback(async (userId, otp) => {
    try {
      setLoading(true);
      const response = await authService.verifyOTP(userId, otp);
      
      if (response.token && response.user) {
        const userData = {
          ...response.user,
          role: response.user.role || 'staff'
        };
        
        authService.storeAuthData(response.token, userData);
        setToken(response.token);
        setUser(userData);
        setIsAuthenticated(true);
      }
      
      return response;
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      if (token) {
        await authService.logout(token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authService.clearAuthData();
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
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

  // Refresh profile
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
      // If unauthorized, logout
      if (error.message?.includes('401')) {
        logout();
      }
    }
  }, [token, logout]);

  const value = {
    isAuthenticated,
    user,
    token,
    loading,
    setAuthData,
    requestPlayerOTP,
    verifyPlayerOTP,
    staffLogin,
    verifyStaffOTP,
    logout,
    hasRole,
    getUserRole,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};