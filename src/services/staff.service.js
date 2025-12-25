// services/staff.service.js
// Staff Management API Service

import api from './api.service';

const getToken = () => localStorage.getItem('auth_token');

const staffService = {
  // ==========================================
  // STAFF CRUD
  // ==========================================
  
  createStaff: async (data) => {
    const token = getToken();
    const response = await api.post('/staff', data, token);
    return response;
  },

  getAllStaff: async (filters = {}) => {
    const token = getToken();
    const params = new URLSearchParams();
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active);
    if (filters.staff_role) params.append('staff_role', filters.staff_role);
    
    const response = await api.get(`/staff?${params.toString()}`, token);
    return response;
  },

  getStaff: async (staffId) => {
    const token = getToken();
    const response = await api.get(`/staff/${staffId}`, token);
    return response;
  },

  updateStaff: async (staffId, data) => {
    const token = getToken();
    const response = await api.put(`/staff/${staffId}`, data, token);
    return response;
  },

  deleteStaff: async (staffId) => {
    const token = getToken();
    const response = await api.delete(`/staff/${staffId}`, token);
    return response;
  },

  deactivateStaff: async (staffId) => {
    const token = getToken();
    const response = await api.put(`/staff/${staffId}/deactivate`, {}, token);
    return response;
  },

  activateStaff: async (staffId) => {
    const token = getToken();
    const response = await api.put(`/staff/${staffId}/activate`, {}, token);
    return response;
  },

  // ==========================================
  // ATTENDANCE
  // ==========================================
  
  markAttendance: async (staffId, data) => {
    const token = getToken();
    const response = await api.post(`/staff/${staffId}/attendance`, data, token);
    return response;
  },

  getStaffAttendance: async (staffId, month = null) => {
    const token = getToken();
    const params = month ? `?month=${month}` : '';
    const response = await api.get(`/staff/${staffId}/attendance${params}`, token);
    return response;
  },

  getAttendanceByDate: async (date) => {
    const token = getToken();
    const response = await api.get(`/staff/attendance/date/${date}`, token);
    return response;
  },

  // ==========================================
  // SALARY ADVANCES
  // ==========================================
  
  getRemainingBalance: async (staffId) => {
    const token = getToken();
    const response = await api.get(`/staff/${staffId}/balance`, token);
    return response;
  },

  giveSalaryAdvance: async (staffId, data) => {
    const token = getToken();
    const response = await api.post(`/staff/${staffId}/advance`, data, token);
    return response;
  },

  getStaffAdvances: async (staffId, pendingOnly = false) => {
    const token = getToken();
    const params = pendingOnly ? '?pending=true' : '';
    const response = await api.get(`/staff/${staffId}/advances${params}`, token);
    return response;
  },

  getAdvanceHistory: async (staffId) => {
    const token = getToken();
    const response = await api.get(`/staff/${staffId}/advance-history`, token);
    return response;
  },

  // ==========================================
  // SALARY
  // ==========================================
  
  calculateMonthlySalary: async (staffId, month = null) => {
    const token = getToken();
    const params = month ? `?month=${month}` : '';
    const response = await api.get(`/staff/${staffId}/salary/calculate${params}`, token);
    return response;
  },

  processSalaryPayment: async (staffId, data) => {
    const token = getToken();
    const response = await api.post(`/staff/${staffId}/salary/pay`, data, token);
    return response;
  },

  getSalaryHistory: async (staffId) => {
    const token = getToken();
    const response = await api.get(`/staff/${staffId}/salary/history`, token);
    return response;
  }
};

export default staffService;
