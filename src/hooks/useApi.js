import { useState, useCallback } from 'react';
import apiService from '../services/api.service';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get token from localStorage
  const getToken = useCallback(() => {
    return localStorage.getItem('auth_token');
  }, []);

  // Generic request wrapper
  const request = useCallback(async (apiCall, onSuccess, onError) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiCall();
      if (onSuccess) {
        onSuccess(response);
      }
      return response;
    } catch (err) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // GET request
  const get = useCallback(async (endpoint, options = {}) => {
    const token = options.token || getToken();
    return request(
      () => apiService.get(endpoint, token),
      options.onSuccess,
      options.onError
    );
  }, [getToken, request]);

  // POST request
  const post = useCallback(async (endpoint, data, options = {}) => {
    const token = options.token || getToken();
    return request(
      () => apiService.post(endpoint, data, token),
      options.onSuccess,
      options.onError
    );
  }, [getToken, request]);

  // PUT request
  const put = useCallback(async (endpoint, data, options = {}) => {
    const token = options.token || getToken();
    return request(
      () => apiService.put(endpoint, data, token),
      options.onSuccess,
      options.onError
    );
  }, [getToken, request]);

  // DELETE request
  const del = useCallback(async (endpoint, options = {}) => {
    const token = options.token || getToken();
    return request(
      () => apiService.delete(endpoint, token),
      options.onSuccess,
      options.onError
    );
  }, [getToken, request]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    get,
    post,
    put,
    delete: del,
    clearError
  };
};