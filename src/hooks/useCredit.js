import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import creditService from '../services/credit.service';

export const useCredit = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createCreditRequest = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await creditService.createCreditRequest(token, data);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const approveRequest = useCallback(async (requestId, notes) => {
    setLoading(true);
    setError(null);
    try {
      const result = await creditService.approveCreditRequest(token, requestId, notes);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const rejectRequest = useCallback(async (requestId, notes) => {
    setLoading(true);
    setError(null);
    try {
      const result = await creditService.rejectCreditRequest(token, requestId, notes);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  return {
    loading,
    error,
    createCreditRequest,
    approveRequest,
    rejectRequest
  };
};

export default useCredit;