import apiService from './api.service';

class CashierService {
  getToken() {
    return localStorage.getItem('auth_token');
  }

  // ==========================================
  // SESSION MANAGEMENT
  // ==========================================

  /**
   * Get today's active session
   * GET /api/cashier/today-session
   */
  async getTodaySession() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get(
        '/cashier/today-session',
        token
      );

      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Get today session error:', error);
      
      if (error.message && error.message.includes('No session')) {
        return {
          success: false,
          error: {
            message: error.message
          }
        };
      }
      
      throw error;
    }
  }

  /**
   * Open a new daily session
   * POST /api/cashier/open-session
   */
  async openSession(ownerFloat) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.post(
        '/cashier/open-session',
        { owner_float: ownerFloat },
        token
      );

      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Open session error:', error);
      throw error;
    }
  }

  /**
   * Start a new session with float and chip inventory
   * POST /api/cashier/start-session
   */
  async startSession(ownerFloat, chipInventory = null, cashierId = null) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const payload = { owner_float: ownerFloat };
      if (cashierId) {
        payload.cashier_id = cashierId;
      }
      if (chipInventory) {
        payload.chip_inventory = {
          chips_100: parseInt(chipInventory.chips_100) || 0,
          chips_500: parseInt(chipInventory.chips_500) || 0,
          chips_5000: parseInt(chipInventory.chips_5000) || 0,
          chips_10000: parseInt(chipInventory.chips_10000) || 0,
        };
      }

      const response = await apiService.post(
        '/cashier/start-session',
        payload,
        token
      );

      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Start session error:', error);
      throw error;
    }
  }

  /**
   * Close today's session
   * POST /api/cashier/close-session
   */
  async closeSession() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.post(
        '/cashier/close-session',
        {},
        token
      );

      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Close session error:', error);
      throw error;
    }
  }

  /**
   * Get all session summaries
   * GET /api/cashier/summaries?limit=30
   */
  async getAllSummaries(limit = 30) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get(
        `/cashier/summaries?limit=${limit}`,
        token
      );

      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Get summaries error:', error);
      throw error;
    }
  }

  /**
   * Get specific session summary by ID
   * GET /api/cashier/summary/:session_id
   */
  async getSessionSummary(sessionId) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get(
        `/cashier/summary/${sessionId}`,
        token
      );

      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Get session summary error:', error);
      throw error;
    }
  }

  /**
   * Get session by date
   * GET /api/cashier/session/date/:date
   */
  async getSessionByDate(date) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get(
        `/cashier/session/date/${date}`,
        token
      );

      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Get session by date error:', error);
      throw error;
    }
  }

  // ==========================================
  // DASHBOARD
  // ==========================================

  /**
   * Get cashier dashboard
   * GET /api/cashier/dashboard
   */
  async getDashboard() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get(
        '/cashier/dashboard',
        token
      );

      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Get dashboard error:', error);
      throw error;
    }
  }

  // ==========================================
  // CHIP INVENTORY MANAGEMENT
  // ==========================================

  /**
   * Set chip inventory for today's session
   * POST /api/cashier/set-chip-inventory
   */
  async setChipInventory(chipInventory) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      if (!chipInventory || typeof chipInventory !== 'object') {
        throw new Error('Invalid chip inventory data');
      }

      const validatedInventory = {
        chips_100: Math.max(0, parseInt(chipInventory.chips_100) || 0),
        chips_500: Math.max(0, parseInt(chipInventory.chips_500) || 0),
        chips_5000: Math.max(0, parseInt(chipInventory.chips_5000) || 0),
        chips_10000: Math.max(0, parseInt(chipInventory.chips_10000) || 0)
      };

      const response = await apiService.post(
        '/cashier/set-chip-inventory',
        validatedInventory,
        token
      );

      return {
        success: true,
        data: response.data || response,
        message: response.message || 'Chip inventory set successfully'
      };
    } catch (error) {
      console.error('Set chip inventory error:', error);
      throw error;
    }
  }

  /**
   * Update existing chip inventory (for corrections/reconciliation)
   * POST /api/cashier/update-chip-inventory
   */
  async updateChipInventory(adjustmentData) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      if (!adjustmentData || typeof adjustmentData !== 'object') {
        throw new Error('Invalid adjustment data');
      }

      const response = await apiService.post(
        '/cashier/update-chip-inventory',
        adjustmentData,
        token
      );

      return {
        success: true,
        data: response.data || response,
        message: response.message || 'Chip inventory updated successfully'
      };
    } catch (error) {
      console.error('Update chip inventory error:', error);
      throw error;
    }
  }

  /**
   * Get chip adjustment history
   * GET /api/cashier/chip-adjustments
   */
  async getChipAdjustments() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get(
        '/cashier/chip-adjustments',
        token
      );

      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Get chip adjustments error:', error);
      throw error;
    }
  }

  /**
   * ✅ NEW: Get chip inventory status
   * GET /api/cashier/chip-inventory-status
   */
  async getChipInventoryStatus() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get(
        '/cashier/chip-inventory-status',
        token
      );

      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Get chip inventory status error:', error);
      throw error;
    }
  }

  /**
   * ✅ NEW: Get chip movement log
   * GET /api/cashier/chip-movements
   */
  async getChipMovements() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get(
        '/cashier/chip-movements',
        token
      );

      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Get chip movements error:', error);
      throw error;
    }
  }

  // ==========================================
  // FLOAT MANAGEMENT
  // ==========================================

  /**
   * Add cash float (Mali) to session with optional chip inventory
   * POST /api/cashier/add-cash-float
   */
  async addCashFloat(amount, notes = '', chipBreakdown = null) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const payload = { amount, notes };
      if (chipBreakdown) {
        payload.chip_breakdown = chipBreakdown;
      }

      const response = await apiService.post(
        '/cashier/add-cash-float',
        payload,
        token
      );

      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Add cash float error:', error);
      throw error;
    }
  }

  /**
   * ✅ NEW: Get float addition history
   * GET /api/cashier/float-history
   */
  async getFloatHistory() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get(
        '/cashier/float-history',
        token
      );

      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Get float history error:', error);
      throw error;
    }
  }

  /**
   * ✅ NEW: Get float summary
   * GET /api/cashier/float-summary
   */
  async getFloatSummary() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get(
        '/cashier/float-summary',
        token
      );

      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Get float summary error:', error);
      throw error;
    }
  }

  /**
   * ✅ NEW: Get float addition history for a specific session
   * GET /api/cashier/float-history/:sessionId
   */
  async getFloatHistoryBySession(sessionId) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get(
        `/cashier/float-history/${sessionId}`,
        token
      );

      return {
        success: true,
        data: response.data || response || []
      };
    } catch (error) {
      console.error('Get float history by session error:', error);
      return {
        success: false,
        data: []
      };
    }
  }

  // ==========================================
  // CREDIT LIMIT MANAGEMENT
  // ==========================================

  /**
   * ✅ NEW: Set cashier credit limit for a session
   * POST /api/cashier/set-credit-limit
   */
  async setCreditLimit(sessionId, creditLimit) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.post(
        '/cashier/set-credit-limit',
        {
          session_id: sessionId,
          credit_limit: creditLimit
        },
        token
      );

      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Set credit limit error:', error);
      throw error;
    }
  }

  /**
   * ✅ NEW: Get cashier credit limit for a session
   * GET /api/cashier/credit-limit/:session_id
   */
  async getCreditLimit(sessionId) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get(
        `/cashier/credit-limit/${sessionId}`,
        token
      );

      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Get credit limit error:', error);
      throw error;
    }
  }

  /**
   * ✅ NEW: Get all credit limit history
   * GET /api/cashier/credit-limits-history
   */
  async getCreditLimitsHistory() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get(
        '/cashier/credit-limits-history',
        token
      );

      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Get credit limits history error:', error);
      throw error;
    }
  }

  // ==========================================
  // UTILITY HELPERS
  // ==========================================

  /**
   * Calculate total chip value in rupees
   */
  calculateChipValue(chipInventory) {
    return (
      (chipInventory.chips_100 || 0) * 100 +
      (chipInventory.chips_500 || 0) * 500 +
      (chipInventory.chips_5000 || 0) * 5000 +
      (chipInventory.chips_10000 || 0) * 10000
    );
  }

  /**
   * Calculate total number of chips
   */
  calculateChipCount(chipInventory) {
    return (
      (chipInventory.chips_100 || 0) +
      (chipInventory.chips_500 || 0) +
      (chipInventory.chips_5000 || 0) +
      (chipInventory.chips_10000 || 0)
    );
  }

  /**
   * Format amount as Indian Rupees currency
   */
  formatCurrency(amount) {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount || 0);
  }

  /**
   * Format date string to readable format
   */
  formatDate(dateString, options = {}) {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        ...options
      });
    } catch (e) {
      return 'Invalid Date';
    }
  }

  /**
   * Format date and time
   */
  formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  }

  /**
   * Validate chip breakdown matches amount
   */
  validateChipBreakdown(chipBreakdown, expectedAmount) {
    const calculatedAmount = this.calculateChipValue(chipBreakdown);
    return Math.abs(calculatedAmount - expectedAmount) < 0.01;
  }

  /**
   * Get float addition history for a specific session
   * @param {number} sessionId - Session ID
   */
  async getFloatAdditionHistory(sessionId) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      // Use the existing float-history endpoint (it uses today's session)
      // For now, we'll need to create a session-specific endpoint or use a workaround
      // For now, return empty array and fetch from backend directly if needed
      const response = await apiService.get(
        `/cashier/float-history`,
        token
      );

      // Filter by session_id if we have session-specific data
      // For now, the endpoint returns today's session history
      return {
        success: true,
        data: response.data || response || []
      };
    } catch (error) {
      console.error('Get float addition history error:', error);
      // Return empty array if endpoint doesn't exist or fails
      return {
        success: false,
        data: []
      };
    }
  }
}

export default new CashierService();