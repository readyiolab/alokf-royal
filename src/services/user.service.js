// services/user.service.js
// User Management Service - For Admin

import api from './api.service';

const getToken = () => {
  return localStorage.getItem('auth_token');
};

const userService = {
  /**
   * Create a new user (cashier or floor_manager)
   */
  createUser: async (data) => {
    // Try cashier endpoint first, fallback to admin endpoint
    try {
      const response = await api.post('/cashier/cashiers', data, getToken());
      return response;
    } catch (err) {
      // Fallback to admin endpoint if cashier endpoint fails
      const response = await api.post('/admin/users', data, getToken());
      return response;
    }
  },

  /**
   * Get all users (cashiers and floor managers)
   */
  getAllUsers: async (role = null) => {
    // Try cashier endpoint first (always returns cashiers only), fallback to admin endpoint
    try {
      const response = await api.get('/cashier/cashiers', getToken());
      return response;
    } catch (err) {
      // Fallback to admin endpoint if cashier endpoint fails
      const adminEndpoint = role ? `/admin/users?role=${role}` : '/admin/users';
      const response = await api.get(adminEndpoint, getToken());
      return response;
    }
  },

  /**
   * Get user by ID
   */
  getUserById: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`, getToken());
    return response;
  },

  /**
   * Update user
   */
  updateUser: async (userId, data) => {
    // Try cashier endpoint first, fallback to admin endpoint
    try {
      const response = await api.put(`/cashier/cashiers/${userId}`, data, getToken());
      return response;
    } catch (err) {
      // Fallback to admin endpoint if cashier endpoint fails
      const response = await api.put(`/admin/users/${userId}`, data, getToken());
      return response;
    }
  },

  /**
   * Reset user password
   */
  resetPassword: async (userId) => {
    const response = await api.post(`/admin/users/${userId}/reset-password`, {}, getToken());
    return response;
  },

  /**
   * Deactivate user
   */
  deactivateUser: async (userId) => {
    // Try cashier endpoint first, fallback to admin endpoint
    try {
      const response = await api.post(`/cashier/cashiers/${userId}/deactivate`, {}, getToken());
      return response;
    } catch (err) {
      // Fallback to admin endpoint if cashier endpoint fails
      const response = await api.post(`/admin/users/${userId}/deactivate`, {}, getToken());
      return response;
    }
  },

  /**
   * Activate user
   */
  activateUser: async (userId) => {
    // Try cashier endpoint first, fallback to admin endpoint
    try {
      const response = await api.post(`/cashier/cashiers/${userId}/activate`, {}, getToken());
      return response;
    } catch (err) {
      // Fallback to admin endpoint if cashier endpoint fails
      const response = await api.post(`/admin/users/${userId}/activate`, {}, getToken());
      return response;
    }
  },

  /**
   * Delete user (admin only)
   */
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`, getToken());
    return response;
  }
};

export default userService;
