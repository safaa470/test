/**
 * Performance utilities for optimizing React components
 */

/**
 * Debounce function to limit API calls
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function to limit function execution frequency
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Memoization utility for expensive calculations
 */
export const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

/**
 * Batch DOM updates to improve performance
 */
export const batchUpdates = (updates) => {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      updates.forEach(update => update());
      resolve();
    });
  });
};

/**
 * Lazy loading utility for components
 */
export const createLazyComponent = (importFunc) => {
  return React.lazy(() => 
    importFunc().then(module => ({
      default: module.default || module
    }))
  );
};

/**
 * Performance monitoring utilities
 */
export const performanceMonitor = {
  startTiming: (label) => {
    performance.mark(`${label}-start`);
  },
  
  endTiming: (label) => {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    
    const measure = performance.getEntriesByName(label)[0];
    console.log(`${label}: ${measure.duration.toFixed(2)}ms`);
    
    // Clean up
    performance.clearMarks(`${label}-start`);
    performance.clearMarks(`${label}-end`);
    performance.clearMeasures(label);
    
    return measure.duration;
  }
};

/**
 * Image optimization utilities
 */
export const imageUtils = {
  preloadImage: (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  },
  
  createThumbnail: (file, maxWidth = 150, maxHeight = 150, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const { width, height } = img;
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
};

/**
 * Memory management utilities
 */
export const memoryUtils = {
  cleanupRefs: (refs) => {
    refs.forEach(ref => {
      if (ref.current) {
        ref.current = null;
      }
    });
  },
  
  revokeObjectURLs: (urls) => {
    urls.forEach(url => URL.revokeObjectURL(url));
  }
};

/**
 * Network optimization utilities
 */
export const networkUtils = {
  createAbortController: () => {
    const controller = new AbortController();
    return {
      signal: controller.signal,
      abort: () => controller.abort()
    };
  },
  
  retryRequest: async (requestFn, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
};