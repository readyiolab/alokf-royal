import { useState, useCallback, useMemo } from 'react';
import playerService from '../services/player.service';

export const usePlayerSearch = () => {
  const [allPlayers, setAllPlayers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadedAll, setLoadedAll] = useState(false);

  /**
   * Load all players initially
   */
  const loadAllPlayers = useCallback(async (token) => {
    if (loadedAll && allPlayers.length > 0) {
      return; // Already loaded
    }

    try {
      setLoading(true);
      setError('');
      const players = await playerService.getAllPlayers(token);
      const playerList = Array.isArray(players) ? players : [];
      setAllPlayers(playerList);
      setLoadedAll(true);
    } catch (err) {
      setError(err.message || 'Failed to load players');
      setAllPlayers([]);
    } finally {
      setLoading(false);
    }
  }, [loadedAll, allPlayers.length]);

  /**
   * Dynamic filtered search results based on query
   * Searches by: Player Code, Name, Phone Number
   */
  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) {
      return allPlayers; // Show all players when no search query
    }

    const query = searchQuery.toLowerCase().trim();

    return allPlayers.filter(player => {
      // Search by player code (PC00001)
      const code = (player.player_code || '').toLowerCase();
      if (code.includes(query)) return true;

      // Search by player name
      const name = (player.player_name || '').toLowerCase();
      if (name.includes(query)) return true;

      // Search by phone number
      const phone = (player.phone_number || '').toString();
      if (phone.includes(query)) return true;

      return false;
    });
  }, [allPlayers, searchQuery]);

  /**
   * Search for a specific player by phone or code (API call)
   */
  const searchPlayerByAPI = useCallback(async (token, query) => {
    if (!query?.trim()) {
      setError('Please enter phone number or player code');
      return null;
    }

    setSearching(true);
    setError('');

    try {
      let player = null;

      // Try phone search first (10 digits)
      if (/^\d{10}$/.test(query)) {
        try {
          player = await playerService.getPlayerByPhone(token, query);
        } catch (err) {
          // Not found by phone
        }
      }

      // Try player code search (PC00001 format)
      if (!player) {
        try {
          player = await playerService.getPlayer(token, query);
        } catch (err) {
          // Not found by code
        }
      }

      if (!player) {
        setError(`No player found matching: ${query}`);
        return null;
      }

      return player;
    } catch (err) {
      setError(err.message || 'Failed to search player');
      return null;
    } finally {
      setSearching(false);
    }
  }, []);

  /**
   * Select a player for credit transaction
   */
  const selectPlayer = useCallback((player) => {
    setSelectedPlayer(player);
    setSearchQuery(''); // Clear search after selection
    setError('');
  }, []);

  /**
   * Clear selection and search
   */
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSelectedPlayer(null);
    setError('');
  }, []);

  /**
   * Refresh player list
   */
  const refreshPlayers = useCallback(async (token) => {
    setLoadedAll(false);
    await loadAllPlayers(token);
  }, [loadAllPlayers]);

  return {
    // State
    allPlayers,
    filteredPlayers,
    searchQuery,
    setSearchQuery,
    selectedPlayer,
    setSelectedPlayer,
    searching,
    loading,
    error,
    setError,
    loadedAll,

    // Actions
    loadAllPlayers,
    searchPlayerByAPI,
    selectPlayer,
    clearSearch,
    refreshPlayers
  };
};

export default usePlayerSearch;