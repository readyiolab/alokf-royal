// src/services/transaction.service.js
import apiService from "./api.service";

class TransactionService {
  // ✅ FIXED: Get player chip balance - CORRECT frontend implementation
  async getPlayerChipBalance(token, playerId) {
    try {
      const response = await apiService.get(
        `/transactions/player/${playerId}/chip-balance`,
        token
      );

      // ✅ Handle response structure
      if (response.success && response.data) {
        return response.data; // Return the balance object
      }

      // ✅ If no data, return zero balance
      return {
        player_id: playerId,
        current_chip_balance: 0,
        stored_chips: 0,
        outstanding_credit: 0,
        total_bought_in: 0,
        total_cashed_out: 0,
        can_cash_out: false,
        must_settle_credit_first: false,
      };
    } catch (error) {
      console.error("Error fetching player chip balance:", error);
      // Return zero balance on error instead of throwing
      return {
        player_id: playerId,
        current_chip_balance: 0,
        stored_chips: 0,
        outstanding_credit: 0,
        total_bought_in: 0,
        total_cashed_out: 0,
        can_cash_out: false,
        must_settle_credit_first: false,
      };
    }
  }

  // ✅ FIXED: Get player transaction history - Handle nested structure
  async getPlayerTransactionHistory(token, playerId, sessionId = null) {
    try {
      let url = `/transactions/player/${playerId}`;
      if (sessionId) {
        url += `?session_id=${sessionId}`;
      }

      const response = await apiService.get(url, token);

      // Handle response structure
      if (response.success && response.data) {
        // If transactions are nested in response.data.transactions
        if (
          response.data.transactions &&
          Array.isArray(response.data.transactions)
        ) {
          return response.data.transactions;
        }
        // If data is diregetPlayerTransactionHistoryctly an array
        if (Array.isArray(response.data)) {
          return response.data;
        }
      }

      return [];
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Get current session transactions
  async getCurrentSessionTransactions(token) {
    try {
      const response = await apiService.get("/transactions", token);

      if (response.success && response.data) {
        // Handle nested structure
        if (
          response.data.transactions &&
          Array.isArray(response.data.transactions)
        ) {
          return response.data.transactions;
        }
        // If data is directly an array
        if (Array.isArray(response.data)) {
          return response.data;
        }
      }

      return [];
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // ✅ FIXED: Get outstanding credits - Handle nested response structure
  async getOutstandingCredits(token) {
    try {
      const response = await apiService.get(
        "/transactions/outstanding-credits",
        token
      );

      // Handle response structure: { success: true, data: { credits: [...] } }
      if (response && response.data) {
        // If data has credits array
        if (response.data.credits && Array.isArray(response.data.credits)) {
          return response.data.credits;
        }
        // If data is directly an array
        if (Array.isArray(response.data)) {
          return response.data;
        }
      }

      // Return empty array as fallback
      return [];
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Create buy-in transaction
  async createBuyIn(token, data) {
    try {
      const response = await apiService.post(
        "/transactions/buy-in",
        data,
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Create cash payout transaction
  async createCashPayout(token, data) {
    try {
      const response = await apiService.post(
        "/transactions/cash-payout",
        data,
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  /**
   * ✅ DEPOSIT CHIPS (New)
   * Player deposits chips for next session without receiving cash
   */
  async depositChips(token, data) {
    try {
      const response = await apiService.post("/transactions/deposit-chips", data, token);
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  /**
   * ✅ DEPOSIT CASH (New)
   * Player deposits cash which goes to secondary wallet
   */
  async depositCash(token, data) {
    try {
      const response = await apiService.post("/transactions/deposit-cash", data, token);
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Create return chips transaction
  async createReturnChips(token, data) {
    try {
      const response = await apiService.post(
        "/transactions/return-chips",
        data,
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  /**
   * ✅ NEW: Adjust player balance (winnings/losses)
   */
  async adjustPlayerBalance(token, data) {
    try {
      const response = await apiService.post(
        "/transactions/adjust-balance",
        data,
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }
  /**
   * ✅ GET PLAYER ADJUSTMENTS
   */
  async getPlayerAdjustments(token, playerId) {
    try {
      const response = await apiService.get(
        `/transactions/player/${playerId}/adjustments`,
        token
      );
      return response.data?.adjustments || [];
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  /**
   * ✅ NEW: Get player adjustment history
   */
  async getPlayerAdjustmentHistory(token, playerId) {
    try {
      const response = await apiService.get(
        `/transactions/player/${playerId}/adjustments`,
        token
      );

      if (response.success && response.data?.adjustments) {
        return response.data.adjustments;
      }

      return [];
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Issue credit
  async issueCredit(token, data) {
    try {
      const response = await apiService.post(
        "/transactions/issue-credit",
        data,
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Settle credit
  async settleCredit(token, data) {
    try {
      const response = await apiService.post(
        "/transactions/settle-credit",
        data,
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Create expense
  async createExpense(token, data) {
    try {
      const response = await apiService.post(
        "/transactions/expense",
        data,
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Get transaction by ID
  async getTransactionById(token, transactionId) {
    try {
      const response = await apiService.get(
        `/transactions/${transactionId}`,
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Get all transactions with filters (Admin only)
  async getAllTransactions(token, filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const url = `/transactions/all${queryParams ? `?${queryParams}` : ""}`;

      const response = await apiService.get(url, token);

      if (response.success && response.data) {
        // Handle nested structure
        if (
          response.data.transactions &&
          Array.isArray(response.data.transactions)
        ) {
          return response.data.transactions;
        }
        // If data is directly an array
        if (Array.isArray(response.data)) {
          return response.data;
        }
      }

      return [];
    } catch (error) {
      throw apiService.handleError(error);
    }
  }

  // Format transaction type for display
  formatTransactionType(type) {
    const types = {
      buy_in: "Buy In",
      cash_payout: "Cash Payout",
      return_chips: "Return Chips",
      issue_credit: "Issue Credit",
      settle_credit: "Settle Credit",
      expense: "Expense",
    };
    return types[type] || type;
  }

  // Get transaction color class
  getTransactionColorClass(type) {
    const colors = {
      buy_in: "text-green-600",
      cash_payout: "text-red-600",
      return_chips: "text-blue-600",
      issue_credit: "text-yellow-600",
      settle_credit: "text-green-600",
      expense: "text-orange-600",
    };
    return colors[type] || "text-gray-600";
  }

  // Get transaction badge variant
  getTransactionBadgeVariant(type) {
    const variants = {
      buy_in: "default",
      cash_payout: "destructive",
      return_chips: "secondary",
      deposit_chips: "secondary",
      redeem_stored: "default",
      issue_credit: "default",
      settle_credit: "default",
      expense: "secondary",
    };
    return variants[type] || "secondary";
  }

  /**
   * ✅ GET PLAYER'S STORED CHIPS BALANCE
   * Returns the global stored balance from player record
   */
  async getPlayerStoredBalance(token, playerId) {
    try {
      const response = await apiService.get(
        `/transactions/player/${playerId}/stored-balance`,
        token
      );
      if (response.success && response.data) {
        return response.data;
      }
      return { stored_chips: 0 };
    } catch (error) {
      console.error("Error fetching stored balance:", error);
      return { stored_chips: 0 };
    }
  }

  /**
   * ✅ GET PLAYER'S CASH DEPOSITS BALANCE
   * Returns the total cash deposits made by player
   */
  async getPlayerCashDeposits(token, playerId) {
    try {
      const response = await apiService.get(
        `/transactions/player/${playerId}/cash-deposits`,
        token
      );
      if (response.success && response.data) {
        return response.data;
      }
      return { cash_deposits: 0 };
    } catch (error) {
      console.error("Error fetching cash deposits:", error);
      return { cash_deposits: 0 };
    }
  }

  /**
   * ✅ REDEEM STORED CHIPS (Use stored balance for buy-in)
   * Player uses their stored chip balance to get chips
   */
  async redeemStoredChips(token, data) {
    try {
      const response = await apiService.post(
        "/transactions/redeem-stored",
        data,
        token
      );
      return response;
    } catch (error) {
      throw apiService.handleError(error);
    }
  }
}

export default new TransactionService();