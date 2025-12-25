import { useState } from 'react';
import transactionService from '../services/transaction.service';

export const usePlayerTransactions = (token) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPlayerTransactions = async (playerId) => {
    if (!playerId) {
      console.error('fetchPlayerTransactions: playerId is undefined');
      setTransactions([]);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const data = await transactionService.getPlayerTransactionHistory(
        token,
        playerId
      );
      setTransactions(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err);
      setTransactions([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setTransactions([]);
    setError(null);
    setLoading(false);
  };

  return {
    transactions,
    loading,
    error,
    fetchPlayerTransactions,
    reset,
  };
};