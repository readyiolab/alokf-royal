// ============================================
// FILE: services/rakeback.service.js
// Frontend Rakeback Service

// ============================================

import api from './api.service';

const getToken = () => localStorage.getItem('auth_token');

const rakebackService = {
  // ==========================================
  // RAKEBACK TYPES
  // ==========================================
  
  getRakebackTypes: async () => {
    const token = getToken();
    const response = await api.get('/rakeback/types', token);
    return response.data || response;
  },

  // Create new rakeback type
// data: { required_hours, default_amount }
createRakebackType: async (data) => {
  const token = getToken();
  const response = await api.post('/rakeback/types', data, token);
  return response.data || response;
},

// Update rakeback type
// data: { required_hours?, default_amount? }
updateRakebackType: async (typeCode, data) => {
  const token = getToken();
  const response = await api.put(`/rakeback/types/${typeCode}`, data, token);
  return response.data || response;
},

// Delete rakeback type
deleteRakebackType: async (typeCode) => {
  const token = getToken();
  const response = await api.delete(`/rakeback/types/${typeCode}`, token);
  return response.data || response;
},

  // ==========================================
  // PLAYER MANAGEMENT
  // ==========================================

  // Get active seated players with session timers
  getActiveSeatedPlayers: async (sessionId) => {
    const token = getToken();
    const response = await api.get(`/rakeback/active-players?sessionId=${sessionId}`, token);
    return response.data || response;
  },

  // Get eligible players
  getEligiblePlayers: async (sessionId) => {
    const token = getToken();
    const response = await api.get(`/rakeback/eligible?sessionId=${sessionId}`, token);
    return response.data || response;
  },

  // ==========================================
  // RAKEBACK ASSIGNMENT
  // ==========================================

  // Assign rakeback to player
  assignRakeback: async (data) => {
    const token = getToken();
    const response = await api.post('/rakeback/assign', data, token);
    return response.data || response;
  },

  // Cancel rakeback assignment
  cancelAssignment: async (assignmentId) => {
    const token = getToken();
    const response = await api.delete(`/rakeback/assignment/${assignmentId}`, token);
    return response.data || response;
  },

  // ==========================================
  // RAKEBACK PROCESSING
  // ==========================================

  // Process rakeback (give chips when eligible)
  processRakeback: async (data) => {
    const token = getToken();
    const response = await api.post('/rakeback/process', data, token);
    return response.data || response;
  },

  // Update rakeback eligibility (background job)
  updateEligibility: async () => {
    const token = getToken();
    const response = await api.post('/rakeback/update-eligibility', {}, token);
    return response.data || response;
  },

  // ==========================================
  // HISTORY & REPORTS
  // ==========================================

  // Get rakebacks for session
  getRakebacksForSession: async (sessionId) => {
    const token = getToken();
    const response = await api.get(`/rakeback/session/${sessionId}`, token);
    return response.data || response;
  },

  // Get player rakeback history
  getPlayerRakebackHistory: async (playerId) => {
    const token = getToken();
    const response = await api.get(`/rakeback/player/${playerId}`, token);
    return response.data || response;
  },

  // ==========================================
  // HELPER METHODS
  // ==========================================

  // Format session time display
  formatSessionTime: (seconds) => {
    if (!seconds && seconds !== 0) return '00:00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },

  // Calculate progress percentage
  calculateProgress: (elapsedSeconds, requiredHours) => {
    if (!requiredHours || requiredHours <= 0) return 0;
    const requiredSeconds = requiredHours * 3600;
    return Math.min(100, (elapsedSeconds / requiredSeconds) * 100);
  },

  // Check if player is eligible
  isEligible: (elapsedSeconds, requiredHours) => {
    if (!requiredHours || requiredHours <= 0) return false;
    const requiredSeconds = requiredHours * 3600;
    return elapsedSeconds >= requiredSeconds;
  },

  // Calculate remaining time
  calculateRemaining: (elapsedSeconds, requiredHours) => {
    if (!requiredHours || requiredHours <= 0) return { hours: 0, minutes: 0 };
    const requiredSeconds = requiredHours * 3600;
    const remainingSeconds = Math.max(0, requiredSeconds - elapsedSeconds);
    
    return {
      hours: Math.floor(remainingSeconds / 3600),
      minutes: Math.floor((remainingSeconds % 3600) / 60),
      seconds: remainingSeconds % 60,
      totalSeconds: remainingSeconds
    };
  },

  // Format currency in INR
  formatCurrency: (amount) => {
    if (!amount && amount !== 0) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  }
};

export default rakebackService;