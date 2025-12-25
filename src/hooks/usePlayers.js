import { useState, useEffect, useCallback } from 'react';
import playerService from '../services/player.service';

export const usePlayers = (token, autoFetch = true) => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchPlayers = useCallback(async () => {
    if (!token) {
      console.log('No token available, skipping fetch');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await playerService.getAllPlayers(token);
      
      let playersList = [];

      // Handle different response structures
      if (Array.isArray(response)) {
        playersList = response;
      } else if (response?.data?.players && Array.isArray(response.data.players)) {
        playersList = response.data.players;
      } else if (response?.players && Array.isArray(response.players)) {
        playersList = response.players;
      }

      setPlayers(playersList);
      setHasLoaded(true);
      return playersList;
    } catch (err) {
      console.error('Error fetching players:', err);
      setError(err);
      setPlayers([]);
      setHasLoaded(true);
      return [];
    } finally {
      setLoading(false);
    }
  }, [token]);

  const refreshPlayers = useCallback(() => fetchPlayers(), [fetchPlayers]);

  useEffect(() => {
    if (token && autoFetch && !hasLoaded) {
      fetchPlayers();
    }
  }, [token, autoFetch, hasLoaded, fetchPlayers]);

  return {
    players,
    loading,
    error,
    hasLoaded,
    fetchPlayers,
    refreshPlayers,
  };
};