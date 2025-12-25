// hooks/useTransactionForm.js
import { useState } from 'react';
import transactionService from '../services/transaction.service';
import playerService from '../services/player.service';

export const useTransactionForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [playerData, setPlayerData] = useState(null);
  const [searchingPlayer, setSearchingPlayer] = useState(false);

  /**
   * Validate player info - either phone or name+phone required
   */
  const validatePlayerInfo = (playerIdentifier, phoneNumber) => {
    // If identifier is provided (phone or code), use it
    if (!playerIdentifier?.trim()) {
      setError('Player phone number or code is required');
      return false;
    }

    // Phone should be 10 digits
    if (playerIdentifier.length === 10 && !/^\d{10}$/.test(playerIdentifier)) {
      setError('Invalid phone number format (10 digits required)');
      return false;
    }

    return true;
  };

  /**
   * Validate amount
   */
  const validateAmount = (amount) => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Valid amount is required');
      return false;
    }
    return true;
  };

  /**
   * Search for player by phone or code
   * Only returns existing players - doesn't create
   */
  const searchPlayer = async (token, identifier) => {
    if (!identifier?.trim()) {
      setError('Please enter player phone or code');
      return null;
    }

    setSearchingPlayer(true);
    setError('');

    try {
      let player = null;

      // Try to find by phone (10 digits)
      if (/^\d{10}$/.test(identifier)) {
        try {
          player = await playerService.getPlayerByPhone(token, identifier);
        } catch (err) {
          // Player not found by phone, try code
          player = null;
        }
      }

      // If not found by phone, try by player code (PC00001)
      if (!player) {
        try {
          player = await playerService.getPlayer(token, identifier);
        } catch (err) {
          player = null;
        }
      }

      if (!player) {
        setError(`Player not found with phone/code: ${identifier}`);
        return null;
      }

      setPlayerData(player);
      setError('');
      return player;
    } catch (err) {
      setError(err.message || 'Failed to search player');
      return null;
    } finally {
      setSearchingPlayer(false);
    }
  };

  /**
   * Clear form data
   */
  const clearForm = () => {
    setError('');
    setSuccess(false);
    setPlayerData(null);
  };

  return {
    loading,
    setLoading,
    error,
    setError,
    success,
    setSuccess,
    playerData,
    setPlayerData,
    searchingPlayer,
    validatePlayerInfo,
    validateAmount,
    searchPlayer,
    clearForm
  };
};