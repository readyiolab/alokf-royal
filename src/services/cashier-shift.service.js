// services/cashier-shift.service.js
// Cashier Shift Management Service

import apiService from './api.service';

class CashierShiftService {
  getToken() {
    return localStorage.getItem('auth_token');
  }

  // ==========================================
  // SHIFT MANAGEMENT
  // ==========================================

  /**
   * Get session cashiers info (for header display: "3/2 cashiers")
   * GET /api/cashier/shift/session-info
   */
  async getSessionCashiersInfo() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get('/cashier/shift/session-info', token);
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Get session cashiers info error:', error);
      throw error;
    }
  }

  /**
   * Start a cashier shift
   * POST /api/cashier/shift/start
   * @param {boolean} isOpener - Whether this cashier is opening the session
   * @param {number} cashierId - Optional cashier ID to start shift for (defaults to logged-in user)
   */
  async startShift(isOpener = false, cashierId = null) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const payload = { is_opener: isOpener };
      if (cashierId) {
        payload.cashier_id = cashierId;
      }

      const response = await apiService.post(
        '/cashier/shift/start',
        payload,
        token
      );
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Start shift error:', error);
      throw error;
    }
  }

  /**
   * Get active shift for current cashier
   * GET /api/cashier/shift/active
   */
  async getActiveShift() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get('/cashier/shift/active', token);
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Get active shift error:', error);
      throw error;
    }
  }

  /**
   * End a cashier shift
   * POST /api/cashier/shift/end
   */
  async endShift(shiftId, handoverNotes = null) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.post(
        '/cashier/shift/end',
        {
          shift_id: shiftId,
          handover_notes: handoverNotes
        },
        token
      );
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('End shift error:', error);
      throw error;
    }
  }

  /**
   * Get all shifts for current session
   * GET /api/cashier/shift/all
   */
  async getAllShifts() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get('/cashier/shift/all', token);
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Get all shifts error:', error);
      throw error;
    }
  }

  /**
   * Download shift report CSV
   * GET /api/cashier/shift/:shiftId/csv
   */
  async downloadShiftReportCSV(shiftId) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const API_BASE_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:5000/api'
        : 'https://royalflush.red/api';

      const url = `${API_BASE_URL}/cashier/shift/${shiftId}/csv`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('Download shift report CSV error:', error);
      throw error;
    }
  }
}

export default new CashierShiftService();

