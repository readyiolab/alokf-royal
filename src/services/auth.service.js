import apiService from './api.service';

class AuthService {
  // Staff login (Admin/Cashier)
  async login(email, password) {
    try {
      const response = await apiService.post('/auth/login', {
        email,
        password
      });
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Verify OTP for staff
  async verifyOTP(userId, otp) {
    try {
      const response = await apiService.post('/auth/verify-otp', {
        user_id: userId,
        otp
      });
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Resend OTP for staff
  async resendOTP(userId) {
    try {
      const response = await apiService.post('/auth/resend-otp', {
        user_id: userId
      });
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Player request OTP
  async requestPlayerOTP(phoneNumber) {
    try {
      const response = await apiService.post('/player/auth/request-otp', {
        phone_number: phoneNumber
      });
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Player verify OTP
  async verifyPlayerOTP(phoneNumber, otpCode) {
    try {
      const response = await apiService.post('/player/auth/verify-otp', {
        phone_number: phoneNumber,
        otp_code: otpCode
      });
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Get user profile
  async getProfile(token) {
    try {
      const response = await apiService.get('/auth/profile', token);
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Logout
  async logout(token) {
    try {
      await apiService.post('/auth/logout', {}, token);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Store auth data
  storeAuthData(token, user) {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(user));
  }

  // Get stored auth data
  getStoredAuthData() {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user_data');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        return { token, user };
      } catch (error) {
        this.clearAuthData();
        return null;
      }
    }
    
    return null;
  }

  // Clear auth data
  clearAuthData() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('auth_token');
  }

  // Get current user role
  getUserRole() {
    const userStr = localStorage.getItem('user_data');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.role || (user.player_id ? 'player' : null);
      } catch (error) {
        return null;
      }
    }
    return null;
  }
}

export default new AuthService();