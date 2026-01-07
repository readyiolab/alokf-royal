// services/cashbook.service.js
// Daily Cashbook, Chip Ledger, and Credit Register Service

import apiService from './api.service';

class CashbookService {
  getToken() {
    return localStorage.getItem('auth_token');
  }

  // ==========================================
  // DAILY CASHBOOK
  // ==========================================

  /**
   * Get cashbook for today
   * GET /api/cashier/cashbook/today
   */
  async getCashbookToday() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get('/cashier/cashbook/today', token);
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Get cashbook today error:', error);
      throw error;
    }
  }

  /**
   * Get cashbook for specific date
   * GET /api/cashier/cashbook/date/:date
   */
  async getCashbookByDate(date) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get(`/cashier/cashbook/date/${date}`, token);
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Get cashbook by date error:', error);
      throw error;
    }
  }

  /**
   * Get cashbook for date range
   * GET /api/cashier/cashbook/range?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
   */
  async getCashbookRange(startDate, endDate) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get(
        `/cashier/cashbook/range?start_date=${startDate}&end_date=${endDate}`,
        token
      );
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Get cashbook range error:', error);
      throw error;
    }
  }

  /**
   * Export cashbook CSV
   * GET /api/cashier/cashbook/export?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
   */
  async exportCashbookCSV(startDate, endDate) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const API_BASE_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:5000/api'
        : 'https://royalflush.red/api';

      const url = `${API_BASE_URL}/cashier/cashbook/export?start_date=${startDate}&end_date=${endDate}`;
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
      console.error('Export cashbook CSV error:', error);
      throw error;
    }
  }

  /**
   * Email cashbook report
   * POST /api/cashier/cashbook/email
   */
  async emailCashbookReport(startDate, endDate, recipients) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.post(
        '/cashier/cashbook/email',
        {
          start_date: startDate,
          end_date: endDate,
          recipients: Array.isArray(recipients) ? recipients : [recipients]
        },
        token
      );
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Email cashbook report error:', error);
      throw error;
    }
  }

  /**
   * Delete all transactions for a date
   * DELETE /api/cashier/cashbook/delete-all/:date
   */
  async deleteAllTransactionsForDate(date) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.delete(
        `/cashier/cashbook/delete-all/${date}`,
        token
      );
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Delete all transactions error:', error);
      throw error;
    }
  }

  // ==========================================
  // CHIP LEDGER
  // ==========================================

  /**
   * Get chip ledger for today
   * GET /api/cashier/chip-ledger/today
   */
  async getChipLedgerToday() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get('/cashier/chip-ledger/today', token);
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Get chip ledger today error:', error);
      throw error;
    }
  }

  /**
   * Get chip ledger for specific date
   * GET /api/cashier/chip-ledger/date/:date
   */
  async getChipLedgerByDate(date) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get(`/cashier/chip-ledger/date/${date}`, token);
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Get chip ledger by date error:', error);
      throw error;
    }
  }

  /**
   * Export chip ledger CSV
   * GET /api/cashier/chip-ledger/export?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
   */
  async exportChipLedgerCSV(startDate, endDate) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const API_BASE_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:5000/api'
        : 'https://royalflush.red/api';

      const url = `${API_BASE_URL}/cashier/chip-ledger/export?start_date=${startDate}&end_date=${endDate}`;
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
      console.error('Export chip ledger CSV error:', error);
      throw error;
    }
  }

  /**
   * Email chip ledger report
   * POST /api/cashier/chip-ledger/email
   */
  async emailChipLedgerReport(startDate, endDate, recipients) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.post(
        '/cashier/chip-ledger/email',
        {
          start_date: startDate,
          end_date: endDate,
          recipients: Array.isArray(recipients) ? recipients : [recipients]
        },
        token
      );
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Email chip ledger report error:', error);
      throw error;
    }
  }

  // ==========================================
  // CREDIT REGISTER
  // ==========================================

  /**
   * Get credit register for today
   * GET /api/cashier/credit-register/today
   */
  async getCreditRegisterToday() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get('/cashier/credit-register/today', token);
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Get credit register today error:', error);
      throw error;
    }
  }

  /**
   * Get credit register for specific date
   * GET /api/cashier/credit-register/date/:date
   */
  async getCreditRegisterByDate(date) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get(`/cashier/credit-register/date/${date}`, token);
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Get credit register by date error:', error);
      throw error;
    }
  }

  /**
   * Get all outstanding credits
   * GET /api/cashier/credit-register/outstanding
   */
  async getAllOutstandingCredits() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get('/cashier/credit-register/outstanding', token);
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Get all outstanding credits error:', error);
      throw error;
    }
  }

  /**
   * Export credit register CSV
   * GET /api/cashier/credit-register/export?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
   */
  async exportCreditRegisterCSV(startDate, endDate) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const API_BASE_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:5000/api'
        : 'https://royalflush.red/api';

      const url = `${API_BASE_URL}/cashier/credit-register/export?start_date=${startDate}&end_date=${endDate}`;
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
      console.error('Export credit register CSV error:', error);
      throw error;
    }
  }

  /**
   * Email credit register report
   * POST /api/cashier/credit-register/email
   */
  async emailCreditRegisterReport(startDate, endDate, recipients) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.post(
        '/cashier/credit-register/email',
        {
          start_date: startDate,
          end_date: endDate,
          recipients: Array.isArray(recipients) ? recipients : [recipients]
        },
        token
      );
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Email credit register report error:', error);
      throw error;
    }
  }

  // ==========================================
  // EXPENSE REPORT
  // ==========================================

  /**
   * Get expense report for today
   * GET /api/cashier/expenses/today
   */
  async getExpenseReportToday() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get('/cashier/expenses/today', token);
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Get expense report today error:', error);
      throw error;
    }
  }

  /**
   * Get expense report for specific date
   * GET /api/cashier/expenses/date/:date
   */
  async getExpenseReportByDate(date) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get(`/cashier/expenses/date/${date}`, token);
      return {
        success: true,
        data: response.data || response
      };
    } catch (error) {
      console.error('Get expense report by date error:', error);
      throw error;
    }
  }
}

export default new CashbookService();

