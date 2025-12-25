// services/rakeback.service.js
// ✅ FIXED - Now matches working staff.service.js pattern

import api from './api.service';

const getToken = () => localStorage.getItem('auth_token');

const rakebackService = {
  // Get rakeback types
  getRakebackTypes: async () => {
    const token = getToken();
    const response = await api.get('/rakeback/types', token); // ✅ Same as staff
    return response.data || response;
  },

  // Process rakeback - FIXED!
  processRakeback: async (data) => {
    const token = getToken();
    const response = await api.post('/rakeback', data, token); // ✅ Same as staff
    return response.data || response;
  },

  // Get rakebacks for session
  getRakebacksForSession: async (sessionId) => {
    const token = getToken();
    const response = await api.get(`/rakeback/session/${sessionId}`, token); // ✅ Same
    return response.data || response;
  },

  // Get player rakeback history
  getPlayerRakebackHistory: async (playerId) => {
    const token = getToken();
    const response = await api.get(`/rakeback/player/${playerId}`, token); // ✅ Same
    return response.data || response;
  }
};

export default rakebackService;