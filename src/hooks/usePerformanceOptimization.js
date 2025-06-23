import { useCallback, useRef, useEffect } from 'react';
import { debounce, throttle } from '../utils/performance';

/**
 * Hook for performance optimization utilities
 */
export const usePerformanceOptimization = () => {
  const abortControllers = useRef(new Set());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllers.current.forEach(controller => controller.abort());
      abortControllers.current.clear();
    };
  }, []);

  const createAbortableRequest = useCallback((requestFn) => {
    const controller = new AbortController();
    abortControllers.current.add(controller);

    const request = requestFn(controller.signal);
    
    request.finally(() => {
      abortControllers.current.delete(controller);
    });

    return {
      request,
      abort: () => controller.abort()
    };
  }, []);

  const debouncedCallback = useCallback((callback, delay = 300) => {
    return debounce(callback, delay);
  }, []);

  const throttledCallback = useCallback((callback, limit = 100) => {
    return throttle(callback, limit);
  }, []);

  return {
    createAbortableRequest,
    debouncedCallback,
    throttledCallback
  };
};

/**
 * Hook for optimizing re-renders
 */
export const useRenderOptimization = () => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    if (process.env.NODE_ENV === 'development') {
      console.log(`Render #${renderCount.current}, Time since last: ${timeSinceLastRender}ms`);
    }
  });

  return {
    renderCount: renderCount.current
  };
};