// ============================================
// FILE: hooks/useFloorManagerData.js
// Data fetching hook for Floor Manager
// Centralizes all API calls and state management
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import floorManagerService from '../services/floorManager.service';
import playerService from '../services/player.service';

export const useFloorManagerData = (session, hasActiveSession, token) => {
  // =================== STATE ===================
  const [tables, setTables] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [confirmations, setConfirmations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIntervalRef = useRef(null);

  // =================== FETCH ALL DATA ===================
  const fetchData = useCallback(async () => {
    if (!hasActiveSession || !session?.session_id) {
      setLoading(false);
      return;
    }

    try {
      // ✅ FIX: Don't fetch confirmations for floor_manager role
      // Floor manager doesn't have permission for this endpoint
      const apiCalls = [
        floorManagerService.getAllTables(session.session_id, token),
        floorManagerService.getWaitlist(session.session_id, token),
        floorManagerService.getAllDealers(session.session_id, token),
        playerService.getAllPlayers(token),
      ];

      // Only fetch confirmations if user has permission (would be used by cashier)
      // For now, skip it entirely since floor_manager gets 403
      
      const [tablesRes, waitlistRes, dealersRes, playersRes] = await Promise.all(apiCalls);

      // ✅ PARSE TABLES
      let tablesList = [];
      if (Array.isArray(tablesRes)) {
        tablesList = tablesRes;
      } else if (tablesRes?.success && Array.isArray(tablesRes?.message)) {
        tablesList = tablesRes.message;
      } else if (tablesRes?.success && Array.isArray(tablesRes?.data)) {
        tablesList = tablesRes.data;
      } else if (tablesRes?.data && Array.isArray(tablesRes.data)) {
        tablesList = tablesRes.data;
      } else if (tablesRes?.tables && Array.isArray(tablesRes.tables)) {
        tablesList = tablesRes.tables;
      }
      
      console.log('Tables API Response:', tablesRes);
      console.log('Parsed tables list:', tablesList);
      
      setTables(tablesList);

      // ✅ PARSE WAITLIST
      let waitlistData = [];
      if (Array.isArray(waitlistRes)) {
        waitlistData = waitlistRes;
      } else if (waitlistRes?.success && Array.isArray(waitlistRes?.message)) {
        waitlistData = waitlistRes.message;
      } else if (waitlistRes?.data && Array.isArray(waitlistRes.data)) {
        waitlistData = waitlistRes.data;
      }
      setWaitlist(waitlistData);

      // ✅ PARSE DEALERS (with deduplication to prevent duplicate key warnings)
      let dealersList = [];
      if (Array.isArray(dealersRes)) {
        dealersList = dealersRes;
      } else if (dealersRes?.success && Array.isArray(dealersRes?.message)) {
        dealersList = dealersRes.message;
      } else if (dealersRes?.success && Array.isArray(dealersRes?.data)) {
        dealersList = dealersRes.data;
      } else if (dealersRes?.data && Array.isArray(dealersRes.data)) {
        dealersList = dealersRes.data;
      } else if (dealersRes?.dealers && Array.isArray(dealersRes.dealers)) {
        dealersList = dealersRes.dealers;
      }
      
      console.log('Dealers API Response:', dealersRes);
      console.log('Parsed dealers list:', dealersList);
      
      // Deduplicate dealers by dealer_id (keep first occurrence)
      const uniqueDealers = dealersList.filter(
        (dealer, index, self) =>
          index === self.findIndex((d) => d.dealer_id === dealer.dealer_id)
      );
      setDealers(uniqueDealers);

      // ✅ PARSE PLAYERS - Handle nested data.players structure
      let playersList = [];
      if (Array.isArray(playersRes)) {
        playersList = playersRes;
      } else if (playersRes?.success && Array.isArray(playersRes?.message)) {
        playersList = playersRes.message;
      } else if (playersRes?.data?.players && Array.isArray(playersRes.data.players)) {
        // Handle { success: true, data: { players: [...], pagination: {...} } }
        playersList = playersRes.data.players;
      } else if (playersRes?.data && Array.isArray(playersRes.data)) {
        playersList = playersRes.data;
      } else if (playersRes?.players && Array.isArray(playersRes.players)) {
        playersList = playersRes.players;
      }
      setAllPlayers(playersList);

      // ✅ CONFIRMATIONS: Set to empty for floor_manager
      // Floor manager doesn't have permission to access confirmations endpoint
      setConfirmations([]);

      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load data');
      console.error('Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.session_id, hasActiveSession, token]);

  // =================== INITIAL FETCH & AUTO-REFRESH ===================
  useEffect(() => {
    if (!hasActiveSession || !session?.session_id) return;

    fetchData();

    // Optional: Auto-refresh every 30 seconds
    // fetchIntervalRef.current = setInterval(fetchData, 30000);

    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }
    };
  }, [session?.session_id, hasActiveSession, fetchData]);

  // =================== COMPUTED VALUES ===================
  
  // Available dealers (not assigned to any table)
  const availableDealers = dealers.filter((d) => {
    const isAssigned = tables.some((t) => t.dealer?.dealer_id === d.dealer_id);
    return !isAssigned && d.dealer_status === 'available';
  });

  // Total players across all tables
  const totalPlayers = tables.reduce(
    (sum, t) => sum + (t.players?.length || 0),
    0
  );

  // Total seats across all tables
  const totalSeats = tables.reduce((sum, t) => sum + (t.max_seats || 9), 0);

  // Dealers on break
  const dealersOnBreak = dealers.filter((d) => d.dealer_status === 'on_break');

  // Assigned dealers
  const assignedDealers = dealers.filter((d) =>
    tables.some((t) => t.dealer?.dealer_id === d.dealer_id)
  );

  // Get unseated players (for add player modal)
  // Returns all unseated players if no query, or filtered list if query exists
  const getUnseatedPlayers = useCallback((searchQuery = '') => {
    // Get seated player IDs
    const seatedPlayerIds = new Set();
    tables.forEach((table) => {
      if (table.players) {
        table.players.forEach((p) => seatedPlayerIds.add(p.player_id));
      }
    });

    // Get all unseated players
    const unseatedPlayers = allPlayers.filter(
      (player) => !seatedPlayerIds.has(player.player_id)
    );

    // If no search query, return all unseated players
    const query = (searchQuery || '').toLowerCase().trim();
    if (!query) {
      return unseatedPlayers;
    }

    // Filter by search query
    return unseatedPlayers.filter((player) => {
      const code = (player.player_code || '').toLowerCase();
      const name = (player.player_name || '').toLowerCase();
      const phone = (player.phone_number || '').toString();

      return (
        code.includes(query) ||
        name.includes(query) ||
        phone.includes(query)
      );
    });
  }, [allPlayers, tables]);

  return {
    // Data
    tables,
    waitlist,
    dealers,
    allPlayers,
    confirmations,
    
    // Status
    loading,
    error,
    
    // Computed
    availableDealers,
    totalPlayers,
    totalSeats,
    dealersOnBreak,
    assignedDealers,
    
    // Functions
    fetchData,
    getUnseatedPlayers,
  };
};

export default useFloorManagerData;