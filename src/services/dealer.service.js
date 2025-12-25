// services/dealer.service.js
// Dealer Management & Tips API Service

import api from './api.service';

const getToken = () => localStorage.getItem('auth_token');

const dealerService = {
  // ==========================================
  // DEALER CRUD
  // ==========================================
  
  createDealer: async (data) => {
    const token = getToken();
    const response = await api.post('/dealers', data, token);
    return response;
  },

  getAllDealers: async (filters = {}) => {
    const token = getToken();
    const params = new URLSearchParams();
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active);
    
    const response = await api.get(`/dealers?${params.toString()}`, token);
    return response;
  },

  getDealer: async (dealerId) => {
    const token = getToken();
    const response = await api.get(`/dealers/${dealerId}`, token);
    return response;
  },

  updateDealer: async (dealerId, data) => {
    const token = getToken();
    const response = await api.put(`/dealers/${dealerId}`, data, token);
    return response;
  },

  deactivateDealer: async (dealerId) => {
    const token = getToken();
    const response = await api.put(`/dealers/${dealerId}/deactivate`, {}, token);
    return response;
  },

  activateDealer: async (dealerId) => {
    const token = getToken();
    const response = await api.put(`/dealers/${dealerId}/activate`, {}, token);
    return response;
  },

  // ==========================================
  // TIPS
  // ==========================================
  
  recordDealerTip: async (data) => {
    const token = getToken();
    const response = await api.post('/dealers/tips', data, token);
    return response;
  },

  getDealerTipsForSession: async (sessionId) => {
    const token = getToken();
    const response = await api.get(`/dealers/tips/session/${sessionId}`, token);
    return response;
  },

  getDealerTipsSummary: async (dealerId, startDate = null, endDate = null) => {
    const token = getToken();
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await api.get(`/dealers/${dealerId}/tips/summary?${params.toString()}`, token);
    return response;
  }
};

export default dealerService;
