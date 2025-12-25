// services/expense.service.js
// Expense Management API Service

import api from './api.service';

// Get token helper
const getToken = () => localStorage.getItem('auth_token');

const expenseService = {
  // ==========================================
  // PLAYER EXPENSES
  // ==========================================
  
  recordPlayerExpense: async (data) => {
    const response = await api.post('/expenses/player', data, getToken());
    return response.data;
  },

  getPlayerExpensesForSession: async (sessionId) => {
    const response = await api.get(`/expenses/player/session/${sessionId}`, getToken());
    return response.data;
  },

  // ==========================================
  // CLUB EXPENSES
  // ==========================================
  
  recordClubExpense: async (data) => {
    const response = await api.post('/expenses/club', data, getToken());
    return response.data;
  },

  getClubExpensesForSession: async (sessionId) => {
    const response = await api.get(`/expenses/club/session/${sessionId}`, getToken());
    return response.data;
  },

  // ==========================================
  // SUMMARY
  // ==========================================
  
  getExpenseSummary: async (sessionId) => {
    const response = await api.get(`/expenses/summary/${sessionId}`, getToken());
    return response.data;
  }
};

export default expenseService;
