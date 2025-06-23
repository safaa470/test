import { useState, useEffect, useCallback } from 'react';
import { apiCache } from '../utils/cacheManager';

/**
 * Hook for caching API responses and reducing network requests
 */
export const useCachedData = (key, fetchFn, options = {}) => {
  const {
    ttl = 2 * 60 * 1000, // 2 minutes default
    staleWhileRevalidate = true,
    dependencies = []
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (useCache = true) => {
    try {
      // Check cache first
      if (useCache) {
        const cachedData = apiCache.get(key);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          
          // If stale-while-revalidate, fetch fresh data in background
          if (staleWhileRevalidate) {
            fetchData(false);
          }
          return cachedData;
        }
      }

      setLoading(true);
      setError(null);

      const result = await fetchFn();
      
      // Cache the result
      apiCache.set(key, result, ttl);
      
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [key, fetchFn, ttl, staleWhileRevalidate]);

  const invalidateCache = useCallback(() => {
    apiCache.delete(key);
  }, [key]);

  const refetch = useCallback(() => {
    invalidateCache();
    return fetchData(false);
  }, [fetchData, invalidateCache]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidateCache
  };
};

/**
 * Hook for caching form data and preventing data loss
 */
export const useCachedForm = (formKey, initialData = {}) => {
  const [formData, setFormData] = useState(() => {
    const cached = localStorage.getItem(`form_${formKey}`);
    return cached ? JSON.parse(cached) : initialData;
  });

  const updateFormData = useCallback((updates) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      localStorage.setItem(`form_${formKey}`, JSON.stringify(newData));
      return newData;
    });
  }, [formKey]);

  const clearFormData = useCallback(() => {
    setFormData(initialData);
    localStorage.removeItem(`form_${formKey}`);
  }, [formKey, initialData]);

  return {
    formData,
    updateFormData,
    clearFormData
  };
};