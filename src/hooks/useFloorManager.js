import { useState, useCallback, useEffect } from 'react';
import floorManagerService from '../services/floorManager.service';
import { useSession } from './useSession';

/**
 * ✅ CUSTOM HOOK: useFloorManager
 * Provides floor manager data and operations
 */
export const useFloorManager = () => {
  const { session, hasActiveSession } = useSession();
  const token = localStorage.getItem('auth_token');

  const [tables, setTables] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [confirmations, setConfirmations] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================================
  // FETCH ALL DATA
  // ============================================

  const fetchAllData = useCallback(async () => {
    if (!hasActiveSession || !session?.session_id) return;

    setLoading(true);
    setError(null);

    try {
      const [tablesData, waitlistData, dealersData, confirmationsData] = await Promise.all([
        floorManagerService.getAllTables(session.session_id, token),
        floorManagerService.getWaitlist(session.session_id, token),
        floorManagerService.getAllDealers(token),
        floorManagerService.getPendingConfirmations(token)
      ]);

      setTables(tablesData.tables || []);
      setWaitlist(waitlistData.waitlist || []);
      setDealers(dealersData.dealers || []);
      setConfirmations(confirmationsData.pending_requests || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch floor manager data');
      console.error('useFloorManager Error:', err);
    } finally {
      setLoading(false);
    }
  }, [session, hasActiveSession, token]);

  // ============================================
  // TABLE OPERATIONS
  // ============================================

  const createTable = useCallback(async (tableData) => {
    try {
      const result = await floorManagerService.createTable(tableData, token);
      await fetchAllData();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [token, fetchAllData]);

  const assignDealer = useCallback(async (tableId, dealerId) => {
    try {
      const result = await floorManagerService.assignDealerToTable(
        { table_id: tableId, dealer_id: dealerId },
        token
      );
      await fetchAllData();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [token, fetchAllData]);

  const removeDealer = useCallback(async (tableId) => {
    try {
      const result = await floorManagerService.removeDealerFromTable(tableId, token);
      await fetchAllData();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [token, fetchAllData]);

  const closeTable = useCallback(async (tableId) => {
    try {
      const result = await floorManagerService.closeTable(tableId, {}, token);
      await fetchAllData();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [token, fetchAllData]);

  // ============================================
  // WAITLIST OPERATIONS
  // ============================================

  const addToWaitlist = useCallback(async (waitlistData) => {
    try {
      const result = await floorManagerService.addToWaitlist(waitlistData, token);
      await fetchAllData();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [token, fetchAllData]);

  const seatFromWaitlist = useCallback(async (waitlistId, tableId, seatNumber) => {
    try {
      const result = await floorManagerService.seatFromWaitlist(
        waitlistId,
        { table_id: tableId, seat_number: seatNumber },
        token
      );
      await fetchAllData();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [token, fetchAllData]);

  const cancelWaitlist = useCallback(async (waitlistId) => {
    try {
      const result = await floorManagerService.cancelWaitlist(waitlistId, token);
      await fetchAllData();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [token, fetchAllData]);

  // ============================================
  // CONFIRMATION OPERATIONS
  // ============================================

  const acceptConfirmation = useCallback(async (requestId, chipBreakdown = null) => {
    try {
      const result = await floorManagerService.acceptConfirmation(
        requestId,
        { chip_breakdown: chipBreakdown },
        token
      );
      await fetchAllData();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [token, fetchAllData]);

  const rejectConfirmation = useCallback(async (requestId, reason = '') => {
    try {
      const result = await floorManagerService.rejectConfirmation(
        requestId,
        { reason },
        token
      );
      await fetchAllData();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [token, fetchAllData]);

  // ============================================
  // DEALER OPERATIONS
  // ============================================

  const getDealerTips = useCallback(async (dealerId) => {
    try {
      return await floorManagerService.getDealerTipsSummary(dealerId, token);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [token]);

  const recordTip = useCallback(async (dealerId, amount, notes = '') => {
    try {
      const result = await floorManagerService.recordDealerTip(
        { dealer_id: dealerId, tip_amount: amount, notes },
        token
      );
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [token]);

  // ============================================
  // REFRESH
  // ============================================

  const refresh = useCallback(async () => {
    await fetchAllData();
  }, [fetchAllData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (hasActiveSession) {
      fetchAllData();
      const interval = setInterval(fetchAllData, 30000);
      return () => clearInterval(interval);
    }
  }, [hasActiveSession, fetchAllData]);

  // ============================================
  // STATS
  // ============================================

  const stats = {
    totalTables: tables.length,
    activePlayers: tables.reduce((sum, t) => sum + (t.players?.length || 0), 0),
    waitingPlayers: waitlist.length,
    pendingConfirmations: confirmations.length
  };

  return {
    // Data
    tables,
    waitlist,
    dealers,
    confirmations,
    stats,
    
    // States
    loading,
    error,
    
    // Table operations
    createTable,
    assignDealer,
    removeDealer,
    closeTable,
    
    // Waitlist operations
    addToWaitlist,
    seatFromWaitlist,
    cancelWaitlist,
    
    // Confirmation operations
    acceptConfirmation,
    rejectConfirmation,
    
    // Dealer operations
    getDealerTips,
    recordTip,
    
    // Refresh
    refresh
  };
};
