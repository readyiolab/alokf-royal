import apiService from './api.service';

class AdminService {
  // Get token from localStorage
  getToken() {
    return localStorage.getItem('auth_token');
  }

  // ==================== SESSION MANAGEMENT ====================

  async openSession(ownerFloat) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.post(
        '/admin/session/open',
        { owner_float: ownerFloat },
        token  // ✅ PASS TOKEN HERE
      );
      return response;
    } catch (error) {
      console.error('Open session error:', error);
      throw apiService.handleError(error);
    }
  }

  async closeSession() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.post(
        '/admin/session/close',
        {},
        token  // ✅ PASS TOKEN HERE
      );
      return response;
    } catch (error) {
      console.error('Close session error:', error);
      throw apiService.handleError(error);
    }
  }

  async getCurrentSessionStatus() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get(
        '/admin/session/status',
        token  // ✅ PASS TOKEN HERE
      );
      return response;
    } catch (error) {
      console.error('Get session status error:', error);
      throw apiService.handleError(error);
    }
  }

  async getAllSessionSummaries(limit = 30) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get(
        `/admin/session/summaries?limit=${limit}`,
        token  // ✅ PASS TOKEN HERE
      );
      // ✅ Extract data array from response
      return response.data || response || [];
    } catch (error) {
      console.error('Get session summaries error:', error);
      throw apiService.handleError(error);
    }
  }

  async getSessionSummary(sessionId) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get(
        `/admin/session/summary/${sessionId}`,
        token  // ✅ PASS TOKEN HERE
      );
      return response;
    } catch (error) {
      console.error('Get session summary error:', error);
      throw apiService.handleError(error);
    }
  }

  async getSessionSummaryData(sessionId) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token. Please login first.');
      }

      const response = await apiService.get(
        `/admin/session/${sessionId}/summary-data`,
        token  // ✅ PASS TOKEN HERE
      );
      return response;
    } catch (error) {
      console.error('Get session summary data error:', error);
      throw apiService.handleError(error);
    }
  }

  // ==================== HELPER METHODS ====================

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  calculateSessionPerformance(session) {
    const profitLoss = session.closing_float - session.opening_float;
    const profitMargin = (profitLoss / session.opening_float) * 100;
    const utilizationRate = ((session.opening_float - (session.closing_float - profitLoss)) / session.opening_float) * 100;
    
    return {
      profitLoss,
      profitMargin,
      utilizationRate: Math.min(100, Math.max(0, utilizationRate)),
      isProfitable: profitLoss > 0,
      performanceRating: this.getPerformanceRating(profitMargin)
    };
  }

  getPerformanceRating(profitMargin) {
    if (profitMargin >= 20) return { label: 'Excellent', color: 'green' };
    if (profitMargin >= 10) return { label: 'Good', color: 'blue' };
    if (profitMargin >= 5) return { label: 'Average', color: 'yellow' };
    if (profitMargin >= 0) return { label: 'Below Average', color: 'orange' };
    return { label: 'Loss', color: 'red' };
  }

  formatSession(session) {
    const performance = this.calculateSessionPerformance(session);
    
    return {
      ...session,
      formattedDate: new Date(session.session_date).toLocaleDateString('en-IN'),
      formattedOpeningFloat: this.formatCurrency(session.opening_float),
      formattedClosingFloat: this.formatCurrency(session.closing_float),
      formattedProfitLoss: this.formatCurrency(performance.profitLoss),
      formattedDeposits: this.formatCurrency(session.total_deposits),
      formattedWithdrawals: this.formatCurrency(session.total_withdrawals),
      formattedExpenses: this.formatCurrency(session.total_expenses),
      performance,
      isOpen: !session.is_closed,
      isClosed: session.is_closed === 1
    };
  }

  calculateDashboardMetrics(summaries) {
    const metrics = {
      totalSessions: summaries.length,
      totalRevenue: 0,
      totalProfit: 0,
      averageProfit: 0,
      profitableSessions: 0,
      totalPlayers: 0,
      averagePlayers: 0
    };

    summaries.forEach(session => {
      const profitLoss = session.closing_float - session.opening_float;
      
      metrics.totalRevenue += session.total_deposits || 0;
      metrics.totalProfit += profitLoss;
      metrics.totalPlayers += session.total_players || 0;
      
      if (profitLoss > 0) {
        metrics.profitableSessions++;
      }
    });

    if (metrics.totalSessions > 0) {
      metrics.averageProfit = metrics.totalProfit / metrics.totalSessions;
      metrics.averagePlayers = metrics.totalPlayers / metrics.totalSessions;
    }

    metrics.profitabilityRate = (metrics.profitableSessions / metrics.totalSessions) * 100;

    return metrics;
  }

  getTrendData(summaries, metric = 'profit') {
    return summaries.map(session => {
      let value;
      
      switch (metric) {
        case 'profit':
          value = session.closing_float - session.opening_float;
          break;
        case 'revenue':
          value = session.total_deposits;
          break;
        case 'players':
          value = session.total_players;
          break;
        case 'transactions':
          value = session.total_transactions;
          break;
        default:
          value = 0;
      }

      return {
        date: new Date(session.session_date).toLocaleDateString('en-IN', { 
          month: 'short', 
          day: 'numeric' 
        }),
        value,
        fullDate: session.session_date
      };
    });
  }

  validateSessionCanClose(sessionData) {
    const issues = [];

    if (sessionData.pending_credit_requests > 0) {
      issues.push({
        type: 'error',
        message: `${sessionData.pending_credit_requests} pending credit requests need approval`
      });
    }

    if (sessionData.chips_in_circulation > 0) {
      issues.push({
        type: 'error',
        message: `${sessionData.chips_in_circulation} chips still in circulation`
      });
    }

    if (sessionData.outstanding_credit > 0) {
      issues.push({
        type: 'warning',
        message: `Outstanding credit: ${this.formatCurrency(sessionData.outstanding_credit)}`
      });
    }

    return {
      canClose: issues.filter(i => i.type === 'error').length === 0,
      issues
    };
  }
}

export default new AdminService();