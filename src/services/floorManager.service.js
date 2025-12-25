// ============================================
// FILE: services/floorManager.service.js
// COMPLETE CORRECTED VERSION
// All endpoints fixed, duplicates removed
// ============================================

import apiService from './api.service';

const API_ENDPOINT = '/floor-manager';

class FloorManagerService {
  // =============================================
  // TABLE OPERATIONS
  // =============================================

  /**
   * CREATE TABLE
   * POST /api/floor-manager/tables
   */
  async createTable(data, token) {
    try {
      return await apiService.post(`${API_ENDPOINT}/tables`, data, token);
    } catch (error) {
      console.error('Error creating table:', error);
      throw error;
    }
  }

  /**
   * GET ALL ACTIVE TABLES FOR SESSION
   * GET /api/floor-manager/tables?sessionId=xxx
   */
  async getAllTables(sessionId, token) {
    try {
      return await apiService.get(
        `${API_ENDPOINT}/tables?sessionId=${sessionId}`,
        token
      );
    } catch (error) {
      console.error('Error fetching tables:', error);
      throw error;
    }
  }

  /**
   * GET SINGLE TABLE
   * GET /api/floor-manager/tables/:tableId
   */
  async getTable(tableId, token) {
    try {
      return await apiService.get(`${API_ENDPOINT}/tables/${tableId}`, token);
    } catch (error) {
      console.error('Error fetching table:', error);
      throw error;
    }
  }

  /**
   * CLOSE TABLE
   * PUT /api/floor-manager/tables/:tableId/close
   */
  async closeTable(tableId, data, token) {
    try {
      return await apiService.put(
        `${API_ENDPOINT}/tables/${tableId}/close`,
        data,
        token
      );
    } catch (error) {
      console.error('Error closing table:', error);
      throw error;
    }
  }

  // =============================================
  // DEALER OPERATIONS
  // =============================================

  /**
   * GET ALL DEALERS WITH SHIFT INFO
   * GET /api/floor-manager/dealers?sessionId=xxx
   * Returns dealers with shift_ends_at and break_ends_at for timer display
   */
  async getAllDealers(sessionId, token) {
    try {
      const response = await apiService.get(
        `${API_ENDPOINT}/dealers?sessionId=${sessionId}`,
        token
      );
      // Backend returns array directly or wrapped
      return Array.isArray(response)
        ? response
        : response?.data || response?.dealers || response?.message || [];
    } catch (error) {
      console.error('Error fetching dealers:', error);
      throw error;
    }
  }

  /**
   * CREATE NEW DEALER
   * POST /api/floor-manager/dealers
   */
  async createDealer(data, token) {
    try {
      return await apiService.post(`${API_ENDPOINT}/dealers`, data, token);
    } catch (error) {
      console.error('Error creating dealer:', error);
      throw error;
    }
  }

  /**
   * GET SINGLE DEALER
   * GET /api/dealers/:dealerId
   */
  async getDealer(dealerId, token) {
    try {
      return await apiService.get(`/dealers/${dealerId}`, token);
    } catch (error) {
      console.error('Error fetching dealer:', error);
      throw error;
    }
  }

  /**
   * GET AVAILABLE DEALERS
   * GET /api/dealers/available?sessionId=xxx
   */
  async getAvailableDealers(sessionId, token) {
    try {
      return await apiService.get(
        `/dealers/available?sessionId=${sessionId}`,
        token
      );
    } catch (error) {
      console.error('Error fetching available dealers:', error);
      throw error;
    }
  }

  /**
   * ASSIGN DEALER TO TABLE
   * POST /api/floor-manager/tables/assign-dealer
   */
  async assignDealerToTable(data, token) {
    try {
      return await apiService.post(
        `${API_ENDPOINT}/tables/assign-dealer`,
        data,
        token
      );
    } catch (error) {
      console.error('Error assigning dealer to table:', error);
      throw error;
    }
  }

  /**
   * REMOVE DEALER FROM TABLE
   * DELETE /api/floor-manager/tables/:tableId/dealer
   */
  async removeDealerFromTable(tableId, token) {
    try {
      return await apiService.delete(
        `${API_ENDPOINT}/tables/${tableId}/dealer`,
        token
      );
    } catch (error) {
      console.error('Error removing dealer from table:', error);
      throw error;
    }
  }

  /**
   * SEND DEALER ON BREAK
   * PUT /api/dealers/:dealerId/break
   */
  async sendDealerOnBreak(dealerId, token) {
    try {
      return await apiService.put(
        `${API_ENDPOINT}/dealers/${dealerId}/break`,
        {},
        token
      );
    } catch (error) {
      console.error('Error sending dealer on break:', error);
      throw error;
    }
  }

  /**
   * MARK DEALER AS AVAILABLE
   * PUT /api/dealers/:dealerId/available
   */
  async markDealerAvailable(dealerId, token) {
    try {
      return await apiService.put(
        `${API_ENDPOINT}/dealers/${dealerId}/available`,
        {},
        token
      );
    } catch (error) {
      console.error('Error marking dealer available:', error);
      throw error;
    }
  }

  /**
   * RECORD DEALER TIP
   * POST /api/dealers/tips
   */
  async recordDealerTip(data, token) {
    try {
      return await apiService.post('/dealers/tips', data, token);
    } catch (error) {
      console.error('Error recording dealer tip:', error);
      throw error;
    }
  }

  /**
   * GET DEALER TIPS FOR SESSION
   * GET /api/dealers/tips/session/:sessionId
   */
  async getDealerTipsForSession(sessionId, token) {
    try {
      return await apiService.get(
        `/dealers/tips/session/${sessionId}`,
        token
      );
    } catch (error) {
      console.error('Error fetching dealer tips for session:', error);
      throw error;
    }
  }

  /**
   * GET DEALER TIPS SUMMARY
   * GET /api/dealers/:dealerId/tips/summary
   */
  async getDealerTipsSummary(dealerId, token) {
    try {
      return await apiService.get(
        `/dealers/${dealerId}/tips/summary`,
        token
      );
    } catch (error) {
      console.error('Error fetching dealer tips summary:', error);
      throw error;
    }
  }

  // =============================================
  // PLAYER OPERATIONS
  // =============================================

  /**
   * ADD PLAYER TO TABLE
   * POST /api/floor-manager/tables/add-player
   */
  async addPlayerToTable(data, token) {
    try {
      return await apiService.post(
        `${API_ENDPOINT}/tables/add-player`,  // ✅ Changed from /add-player to /tables/add-player
        data,
        token
      );
    } catch (error) {
      console.error('Error adding player to table:', error);
      throw error;
    }
  }

  /**
   * REMOVE PLAYER FROM TABLE
   * DELETE /api/floor-manager/players/:tablePlayerId?reason=xxx
   */
  async removePlayer(tablePlayerId, reason, token) {
    try {
      const reasonParam = reason
        ? `?reason=${encodeURIComponent(reason)}`
        : '';
      return await apiService.delete(
        `${API_ENDPOINT}/players/${tablePlayerId}${reasonParam}`,
        token
      );
    } catch (error) {
      console.error('Error removing player:', error);
      throw error;
    }
  }

  /**
   * SET PLAYER ON BREAK
   * PUT /api/floor-manager/players/:tablePlayerId/break
   */
  async setPlayerOnBreak(tablePlayerId, token) {
    try {
      return await apiService.put(
        `${API_ENDPOINT}/players/${tablePlayerId}/break`,
        {},
        token
      );
    } catch (error) {
      console.error('Error setting player on break:', error);
      throw error;
    }
  }

  /**
   * RESUME PLAYER FROM BREAK
   * PUT /api/floor-manager/players/:tablePlayerId/resume
   */
  async resumePlayerFromBreak(tablePlayerId, token) {
    try {
      return await apiService.put(
        `${API_ENDPOINT}/players/${tablePlayerId}/resume`,
        {},
        token
      );
    } catch (error) {
      console.error('Error resuming player from break:', error);
      throw error;
    }
  }

  /**
   * CALL TIME - Player must play 60 more minutes
   * PUT /api/floor-manager/players/:tablePlayerId/call-time
   */
  async callTime(tablePlayerId, token) {
    try {
      return await apiService.put(
        `${API_ENDPOINT}/players/${tablePlayerId}/call-time`,
        {},
        token
      );
    } catch (error) {
      console.error('Error calling time:', error);
      throw error;
    }
  }

  /**
   * EXTEND CALL TIME
   * PUT /api/floor-manager/players/:tablePlayerId/extend-call-time
   */
  async extendCallTime(tablePlayerId, additionalMinutes, token) {
    try {
      return await apiService.put(
        `${API_ENDPOINT}/players/${tablePlayerId}/extend-call-time`,
        { additional_minutes: additionalMinutes },
        token
      );
    } catch (error) {
      console.error('Error extending call time:', error);
      throw error;
    }
  }

  /**
   * TRANSFER PLAYER TO ANOTHER TABLE
   * PUT /api/floor-manager/players/:tablePlayerId/transfer
   */
  async transferPlayer(tablePlayerId, newTableId, newSeatNumber, token) {
    try {
      return await apiService.put(
        `${API_ENDPOINT}/players/${tablePlayerId}/transfer`,
        { new_table_id: newTableId, new_seat_number: newSeatNumber },
        token
      );
    } catch (error) {
      console.error('Error transferring player:', error);
      throw error;
    }
  }

  /**
   * MARK BUY-IN AS COMPLETED
   * PUT /api/floor-manager/players/:tablePlayerId/mark-buyin-completed
   */
  async markBuyinCompleted(tablePlayerId, token) {
    try {
      return await apiService.put(
        `${API_ENDPOINT}/players/${tablePlayerId}/mark-buyin-completed`,
        {},
        token
      );
    } catch (error) {
      console.error('Error marking buy-in as completed:', error);
      throw error;
    }
  }

  // NOTE: Rebuy functionality has been removed as per requirements

  /**
   * GET PLAYER TIME HISTORY
   * GET /api/floor-manager/players/:tablePlayerId/history
   */
  async getPlayerTimeHistory(tablePlayerId, token) {
    try {
      return await apiService.get(
        `${API_ENDPOINT}/players/${tablePlayerId}/history`,
        token
      );
    } catch (error) {
      console.error('Error fetching player history:', error);
      throw error;
    }
  }

  // =============================================
  // WAITLIST OPERATIONS
  // =============================================

  /**
   * ADD PLAYER TO WAITLIST
   * POST /api/floor-manager/waitlist
   */
  async addToWaitlist(data, token) {
    try {
      return await apiService.post(`${API_ENDPOINT}/waitlist`, data, token);
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      throw error;
    }
  }

  /**
   * GET ALL WAITLIST ENTRIES FOR SESSION
   * GET /api/floor-manager/waitlist?sessionId=xxx
   */
  async getWaitlist(sessionId, token) {
    try {
      return await apiService.get(
        `${API_ENDPOINT}/waitlist?sessionId=${sessionId}`,
        token
      );
    } catch (error) {
      console.error('Error fetching waitlist:', error);
      throw error;
    }
  }

  /**
   * GET WAIT POSITION
   * GET /api/floor-manager/waitlist/:waitlistId
   */
  async getWaitPosition(waitlistId, token) {
    try {
      return await apiService.get(
        `${API_ENDPOINT}/waitlist/${waitlistId}`,
        token
      );
    } catch (error) {
      console.error('Error fetching wait position:', error);
      throw error;
    }
  }

  /**
   * SEAT PLAYER FROM WAITLIST
   * PUT /api/floor-manager/waitlist/:waitlistId/seat
   */
  async seatFromWaitlist(waitlistId, data, token) {
    try {
      return await apiService.put(
        `${API_ENDPOINT}/waitlist/${waitlistId}/seat`,
        data,
        token
      );
    } catch (error) {
      console.error('Error seating from waitlist:', error);
      throw error;
    }
  }

  /**
   * CANCEL WAITLIST ENTRY
   * DELETE /api/floor-manager/waitlist/:waitlistId
   */
  async cancelWaitlist(waitlistId, token) {
    try {
      return await apiService.delete(
        `${API_ENDPOINT}/waitlist/${waitlistId}`,
        token
      );
    } catch (error) {
      console.error('Error cancelling waitlist:', error);
      throw error;
    }
  }

  // =============================================
  // BUY-IN CONFIRMATION OPERATIONS
  // =============================================

  /**
   * GET PENDING BUY-IN CONFIRMATIONS
   * GET /api/cashier/confirmations/pending
   */
  async getPendingConfirmations(token) {
    try {
      return await apiService.get(
        '/cashier/confirmations/pending',
        token
      );
    } catch (error) {
      console.error('Error fetching pending confirmations:', error);
      throw error;
    }
  }

  /**
   * ACCEPT BUY-IN CONFIRMATION & ISSUE CHIPS
   * PUT /api/cashier/confirmations/:request_id/accept
   */
  async acceptConfirmation(requestId, data, token) {
    try {
      return await apiService.put(
        `/cashier/confirmations/${requestId}/accept`,
        data,
        token
      );
    } catch (error) {
      console.error('Error accepting confirmation:', error);
      throw error;
    }
  }

  /**
   * REJECT BUY-IN CONFIRMATION
   * PUT /api/cashier/confirmations/:request_id/reject
   */
  async rejectConfirmation(requestId, data, token) {
    try {
      return await apiService.put(
        `/cashier/confirmations/${requestId}/reject`,
        data,
        token
      );
    } catch (error) {
      console.error('Error rejecting confirmation:', error);
      throw error;
    }
  }

  // =============================================
  // HELPER METHODS
  // =============================================

  /**
   * Format duration in minutes to human readable
   */
  formatDuration(minutes) {
    if (!minutes || minutes <= 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  /**
   * Format currency in INR
   */
  formatCurrency(amount) {
    if (!amount && amount !== 0) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Calculate played time from seated timestamp
   */
  calculatePlayedTime(seatedAt) {
    if (!seatedAt)
      return { hours: 0, minutes: 0, totalMinutes: 0 };
    const now = new Date();
    const seated = new Date(seatedAt);
    const diffMs = now - seated;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return { hours, minutes, totalMinutes: diffMinutes };
  }

  /**
   * Get status color for UI display
   */
  getStatusColor(status) {
    const statusColors = {
      playing: 'bg-emerald-100 text-emerald-700',
      on_break: 'bg-orange-100 text-orange-700',
      call_time_active: 'bg-red-100 text-red-700',
      AWAITING_CONFIRMATION: 'bg-yellow-100 text-yellow-700',
      BUYIN_COMPLETED: 'bg-emerald-100 text-emerald-700',
    };
    return statusColors[status] || 'bg-slate-100 text-slate-700';
  }

  /**
   * Format table data for display
   */
  formatTableData(table) {
    if (!table) return null;
    return {
      ...table,
      playerCount: table.players?.length || 0,
      emptySeats: (table.max_seats || 9) - (table.players?.length || 0),
      dealerName: table.dealer?.dealer_name || 'Unassigned',
    };
  }

  /**
   * Format waitlist data for display
   */
  formatWaitlistData(entry) {
    if (!entry) return null;
    return {
      ...entry,
      waitTimeMinutes: entry.wait_time_minutes || 0,
      tableInfo: entry.table_name
        ? `${entry.table_name} (${entry.table_number})`
        : 'Any',
    };
  }

}

export default new FloorManagerService();