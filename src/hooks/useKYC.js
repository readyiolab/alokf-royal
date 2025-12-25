import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import kycService from '../services/kyc.service';

export const useKYC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const initiateDigiLocker = useCallback(async (playerId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await kycService.initiateDigiLockerKYC(token, playerId);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const uploadDocument = useCallback(async (playerId, documentType, file) => {
    setLoading(true);
    setError(null);
    try {
      const result = await kycService.uploadDocument(token, playerId, documentType, file);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const submitKYC = useCallback(async (playerId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await kycService.submitKYC(token, playerId);
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
    initiateDigiLocker,
    uploadDocument,
    submitKYC
  };
};

export default useKYC;