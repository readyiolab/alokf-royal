import apiService from './api.service';

class PlayerService {
  /**
   * Retrieve the authentication token from localStorage
   */
  getToken() {
    return localStorage.getItem('auth_token');
  }

  
  // Create player
async createPlayer(data) {
  try {
    const token = this.getToken();
    const response = await apiService.post('/players', data, token);
    
    // ✅ Return the actual player data
    return response.data || response;
  } catch (error) {
    // ✅ Extract and throw error message properly
    throw apiService.handleError(error);
  }
}

  // Get all players
  async getAllPlayers() {
    try {
      const token = this.getToken();
      const response = await apiService.get('/players', token);

      // Extract players array if available
      if (response.success && response.data?.players) {
        return response.data.players;
      }

      // Fallback to empty array
      return response.data?.players || [];
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Get all players WITH KYC documents
  async getAllPlayersWithKYC() {
    try {
      const token = this.getToken();
      const response = await apiService.get('/players/kyc-data/all', token);

      // Extract players array if available
      if (response.success && response.data?.players) {
        return response.data.players;
      }

      // Fallback to empty array
      return response.data?.players || [];
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Search players
  async searchPlayers(query) {
    try {
      const token = this.getToken();
      const response = await apiService.get(
        `/players/search?q=${encodeURIComponent(query)}`,
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Get player by phone
  async getPlayerByPhone(phoneNumber) {
    try {
      const token = this.getToken();
      const response = await apiService.get(
        `/players/phone/${phoneNumber}`,
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Get player by ID
  async getPlayerById(playerId) {
    try {
      const token = this.getToken();
      const response = await apiService.get(`/players/${playerId}`, token);
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Update player
  async updatePlayer(playerId, data) {
    try {
      const token = this.getToken();
      const response = await apiService.put(
        `/players/${playerId}`,
        data,
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Get player stats
  async getPlayerStats(playerId) {
    try {
      const token = this.getToken();
      const response = await apiService.get(
        `/players/${playerId}/stats`,
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Format player status badge (utility method - no token needed)
  getPlayerStatusBadge(isActive, isBlacklisted) {
    if (isBlacklisted) {
      return { label: 'Blacklisted', variant: 'destructive' };
    }
    if (!isActive) {
      return { label: 'Inactive', variant: 'secondary' };
    }
    return { label: 'Active', variant: 'default' };
  }

  // ✅ Set player credit limit
  async setPlayerCreditLimit(playerId, creditLimit) {
    try {
      const token = this.getToken();
      const response = await apiService.post(
        `/players/${playerId}/credit-limit`,
        { credit_limit: creditLimit },
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // ✅ Get player credit status
  async getPlayerCreditStatus(playerId, sessionId = null) {
    try {
      const token = this.getToken();
      const url = sessionId 
        ? `/players/${playerId}/credit-status?session_id=${sessionId}`
        : `/players/${playerId}/credit-status`;
      const response = await apiService.get(url, token);
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // ✅ Toggle house player status
  async toggleHousePlayer(playerId) {
    try {
      const token = this.getToken();
      const response = await apiService.post(
        `/players/${playerId}/toggle-house-player`,
        {},
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // ✅ Blacklist/Block player
  async blacklistPlayer(playerId, reason) {
    try {
      const token = this.getToken();
      const response = await apiService.post(
        `/players/${playerId}/blacklist`,
        { reason },
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // ✅ Unblacklist/Unblock player
  async unblacklistPlayer(playerId) {
    try {
      const token = this.getToken();
      const response = await apiService.post(
        `/players/${playerId}/unblacklist`,
        {},
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // ✅ Get player notes
  async getPlayerNotes(playerId) {
    try {
      const token = this.getToken();
      const response = await apiService.get(
        `/players/${playerId}/notes`,
        token
      );
      return response.data || response || [];
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // ✅ Get player bonus
  async getPlayerBonus(playerId) {
    try {
      const token = this.getToken();
      const response = await apiService.get(
        `/players/${playerId}/bonus`,
        token
      );
      return response.data || response || { total_bonus: 0, total_claims: 0 };
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // ✅ Add player note
  async addPlayerNote(playerId, noteData) {
    try {
      const token = this.getToken();
      const response = await apiService.post(
        `/players/${playerId}/notes`,
        noteData,
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }
}

export default new PlayerService();