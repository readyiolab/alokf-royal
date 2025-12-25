// ============================================
// API SERVICE
// ============================================
const API_BASE_URL = 'http://localhost:5000/api';

const apiService = {
  // Admin/Cashier Login
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },

  // Verify OTP for Admin/Cashier
  async verifyOTP(userId, otp) {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, otp })
    });
    if (!response.ok) throw new Error('OTP verification failed');
    return response.json();
  },

  // Resend OTP
  async resendOTP(userId) {
    const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    if (!response.ok) throw new Error('Failed to resend OTP');
    return response.json();
  },

  // Player Request OTP
  async requestPlayerOTP(phoneNumber) {
    const response = await fetch(`${API_BASE_URL}/player/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneNumber })
    });
    if (!response.ok) throw new Error('Failed to request OTP');
    return response.json();
  },

  // Player Verify OTP
  async verifyPlayerOTP(phoneNumber, otp) {
    const response = await fetch(`${API_BASE_URL}/player/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneNumber, otp_code: otp })
    });
    if (!response.ok) throw new Error('OTP verification failed');
    return response.json();
  },

  // Get Profile
  async getProfile(token) {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  },

  // Logout
  async logout(token) {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }
};
