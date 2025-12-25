// services/credit.service.js
import apiService from './api.service';

class CreditService {
  /**
   * Retrieve the auth token from localStorage
   */
  getToken() {
    return localStorage.getItem('auth_token');
  }

  // ------------------------------------------------------------------
  // CREATE CREDIT REQUEST (Smart logic - auto-approve or send to admin)
  // ------------------------------------------------------------------
  async createCreditRequest(data) {
    const token = this.getToken();
    try {
      const response = await apiService.post('/credit/request', data, token);
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // ------------------------------------------------------------------
  // ADMIN: Get pending credit requests
  // ------------------------------------------------------------------
  async getPendingRequests(sessionId = null) {
    const token = this.getToken();
    try {
      const endpoint = sessionId
        ? `/credit/pending?session_id=${sessionId}`
        : '/credit/pending';

      const response = await apiService.get(endpoint, token);
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // ------------------------------------------------------------------
  // ADMIN: Get ALL credit requests (pending, approved, rejected)
  // ------------------------------------------------------------------
  async getAllRequests(sessionId = null) {
    const token = this.getToken();
    try {
      const endpoint = sessionId
        ? `/credit/all?session_id=${sessionId}`
        : '/credit/all';

      const response = await apiService.get(endpoint, token);
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // ------------------------------------------------------------------
  // Get auto-approved credit requests
  // ------------------------------------------------------------------
  async getAutoApprovedRequests(sessionId = null) {
    const token = this.getToken();
    try {
      const endpoint = sessionId
        ? `/credit/auto-approved?session_id=${sessionId}`
        : '/credit/auto-approved';

      const response = await apiService.get(endpoint, token);
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // ------------------------------------------------------------------
  // ADMIN: Approve a credit request
  // ------------------------------------------------------------------
  async approveCreditRequest(requestId, approvalNotes = null) {
    const token = this.getToken();
    try {
      const response = await apiService.post(
        `/credit/approve/${requestId}`,
        { approval_notes: approvalNotes },
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // ------------------------------------------------------------------
  // ADMIN: Reject a credit request
  // ------------------------------------------------------------------
  async rejectCreditRequest(requestId, rejectionNotes) {
    const token = this.getToken();
    try {
      const response = await apiService.post(
        `/credit/reject/${requestId}`,
        { rejection_notes: rejectionNotes }, // fixed key name
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // ------------------------------------------------------------------
  // Get all credit requests for a specific session
  // ------------------------------------------------------------------
  async getSessionRequests(sessionId) {
    const token = this.getToken();
    try {
      const response = await apiService.get(`/credit/session/${sessionId}`, token);
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // ------------------------------------------------------------------
  // Get details of a single credit request
  // ------------------------------------------------------------------
  async getRequestDetails(requestId) {
    const token = this.getToken();
    try {
      const response = await apiService.get(`/credit/${requestId}`, token);
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // ------------------------------------------------------------------
  // Get credit statistics for a session
  // ------------------------------------------------------------------
  async getCreditStats(sessionId) {
    const token = this.getToken();
    try {
      const response = await apiService.get(`/credit/stats/session/${sessionId}`, token);
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // ------------------------------------------------------------------
  // UI Helpers
  // ------------------------------------------------------------------
  getRequestStatusBadge(status) {
    const badges = {
      pending: { label: 'Pending', variant: 'default', color: 'yellow' },
      approved: { label: 'Approved', variant: 'success', color: 'green' },
      rejected: { label: 'Rejected', variant: 'destructive', color: 'red' },
    };
    return badges[status] || badges.pending;
  }

  getApprovalTypeLabel(approvalType) {
    const labels = {
      instant: '⚡ Auto-Approved',
      admin_approved: '✓ Admin Approved',
      admin_required: '⏳ Awaiting Admin',
    };
    return labels[approvalType] || approvalType;
  }

  formatCreditRequest(request) {
    return {
      ...request,
      statusBadge: this.getRequestStatusBadge(request.request_status),
      approvalTypeLabel: this.getApprovalTypeLabel(request.approval_type),
      formattedAmount: new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(request.requested_amount),
      formattedDate: new Date(request.created_at).toLocaleString('en-IN'),
      isAutoApproved: request.approval_notes?.includes('Auto-approved'),
      isPending: request.request_status === 'pending',
    };
  }

  calculateCreditSummary(requests) {
    const summary = {
      total_requests: requests.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      auto_approved: 0,
      total_amount: 0,
      pending_amount: 0,
      approved_amount: 0,
    };

    requests.forEach((req) => {
      const amount = parseFloat(req.requested_amount || 0);

      summary.total_amount += amount;

      if (req.request_status === 'pending') {
        summary.pending++;
        summary.pending_amount += amount;
      } else if (req.request_status === 'approved') {
        summary.approved++;
        summary.approved_amount += amount;

        if (req.approval_notes?.includes('Auto-approved')) {
          summary.auto_approved++;
        }
      } else if (req.request_status === 'rejected') {
        summary.rejected++;
      }
    });

    return summary;
  }

  // ------------------------------------------------------------------
  // ✅ NEW: Get cashier credit limit for a session
  // ------------------------------------------------------------------
  async getCreditLimit(sessionId) {
    const token = this.getToken();
    try {
      const response = await apiService.get(`/cashier/credit-limit/${sessionId}`, token);
      return response?.data || response;
    } catch (error) {
      console.error('Error getting credit limit:', error);
      throw apiService.handleError(error);
    }
  }

  // ------------------------------------------------------------------
  // ✅ NEW: Set/update cashier credit limit for a session
  // ------------------------------------------------------------------
  async setCreditLimit(sessionId, creditLimit) {
    const token = this.getToken();
    try {
      const response = await apiService.post(
        '/cashier/set-credit-limit',
        {
          session_id: sessionId,
          credit_limit: creditLimit
        },
        token
      );
      return response?.data || response;
    } catch (error) {
      console.error('Error setting credit limit:', error);
      throw apiService.handleError(error);
    }
  }

  // ------------------------------------------------------------------
  // ✅ NEW: Get credit limits history (Admin only)
  // ------------------------------------------------------------------
  async getCreditLimitsHistory() {
    const token = this.getToken();
    try {
      const response = await apiService.get('/cashier/credit-limits-history', token);
      return response?.data || response;
    } catch (error) {
      console.error('Error getting credit limits history:', error);
      throw apiService.handleError(error);
    }
  }

  // ------------------------------------------------------------------
  // ✅ NEW: Get player chip holdings in current session
  // ------------------------------------------------------------------
  async getPlayerChipHoldings(sessionId) {
    const token = this.getToken();
    try {
      const endpoint = sessionId
        ? `/credit/player-chip-holdings?session_id=${sessionId}`
        : '/credit/player-chip-holdings';
      const response = await apiService.get(endpoint, token);
      return response?.data || response || [];
    } catch (error) {
      console.error('Error getting player chip holdings:', error);
      throw apiService.handleError(error);
    }
  }

  // ------------------------------------------------------------------
  // ✅ NEW: Get single player's chip holding details
  // ------------------------------------------------------------------
  async getPlayerChipDetail(playerId, sessionId) {
    const token = this.getToken();
    try {
      const response = await apiService.get(
        `/credit/player-chips/${playerId}?session_id=${sessionId}`,
        token
      );
      return response?.data || response;
    } catch (error) {
      console.error('Error getting player chip detail:', error);
      throw apiService.handleError(error);
    }
  }

  // ------------------------------------------------------------------
  // ✅ NEW: Get player credit status (outstanding credit, limit, etc.)
  // ------------------------------------------------------------------
  async getPlayerCreditStatus(playerId) {
    const token = this.getToken();
    try {
      const response = await apiService.get(`/players/${playerId}/credit-status`, token);
      return response?.data || response;
    } catch (error) {
      console.error('Error getting player credit status:', error);
      throw apiService.handleError(error);
    }
  }
}

// Export a singleton instance
export default new CreditService();