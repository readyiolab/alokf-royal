import { useState } from 'react';
import cashierService from '../services/cashier.service';

export const useFloatHistory = () => {
  const [floatHistory, setFloatHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFloatHistory = async (sessionId) => {
    if (!sessionId) {
      console.warn('No session ID provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const historyResult = await cashierService.getFloatHistory(sessionId);
      const additions = historyResult?.data || [];

      const summary = {
        total_additions: additions.length,
        total_cash_added: additions.reduce(
          (sum, a) => sum + Number(a.float_amount || 0),
          0
        ),
        total_chips_added: additions.reduce(
          (sum, a) =>
            sum +
            (a.chips_100 || 0) * 100 +
            (a.chips_500 || 0) * 500 +
            (a.chips_5000 || 0) * 5000 +
            (a.chips_10000 || 0) * 10000,
          0
        ),
      };

      setFloatHistory({ additions, summary });
      return { additions, summary };
    } catch (err) {
      console.error('Error fetching float history:', err);
      setError(err);
      setFloatHistory({ additions: [], summary: {} });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFloatHistory(null);
    setError(null);
    setLoading(false);
  };

  return {
    floatHistory,
    loading,
    error,
    fetchFloatHistory,
    reset,
  };
};