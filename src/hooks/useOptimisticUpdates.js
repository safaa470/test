import { useState, useCallback, useRef } from 'react';

/**
 * Hook for optimistic updates - immediately update UI, then sync with server
 */
export const useOptimisticUpdates = (initialData = []) => {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const pendingUpdates = useRef(new Map());

  const optimisticUpdate = useCallback((id, updates, serverAction) => {
    // Immediately update UI
    setData(prevData => 
      prevData.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    );

    // Store pending update
    pendingUpdates.current.set(id, { updates, originalItem: data.find(item => item.id === id) });

    // Perform server action
    serverAction()
      .then(() => {
        // Success - remove from pending
        pendingUpdates.current.delete(id);
      })
      .catch(() => {
        // Failure - revert optimistic update
        const pending = pendingUpdates.current.get(id);
        if (pending) {
          setData(prevData => 
            prevData.map(item => 
              item.id === id ? pending.originalItem : item
            )
          );
          pendingUpdates.current.delete(id);
        }
      });
  }, [data]);

  const optimisticAdd = useCallback((newItem, serverAction) => {
    const tempId = `temp_${Date.now()}`;
    const optimisticItem = { ...newItem, id: tempId, _isOptimistic: true };

    // Immediately add to UI
    setData(prevData => [...prevData, optimisticItem]);

    // Perform server action
    serverAction()
      .then((serverItem) => {
        // Replace optimistic item with server response
        setData(prevData => 
          prevData.map(item => 
            item.id === tempId ? { ...serverItem, _isOptimistic: false } : item
          )
        );
      })
      .catch(() => {
        // Remove optimistic item on failure
        setData(prevData => prevData.filter(item => item.id !== tempId));
      });
  }, []);

  const optimisticDelete = useCallback((id, serverAction) => {
    const originalItem = data.find(item => item.id === id);
    
    // Immediately remove from UI
    setData(prevData => prevData.filter(item => item.id !== id));

    // Perform server action
    serverAction()
      .catch(() => {
        // Restore item on failure
        if (originalItem) {
          setData(prevData => [...prevData, originalItem]);
        }
      });
  }, [data]);

  return {
    data,
    setData,
    isLoading,
    setIsLoading,
    optimisticUpdate,
    optimisticAdd,
    optimisticDelete
  };
};

/**
 * Debounce hook for reducing API calls
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for managing loading states with automatic cleanup
 */
export const useLoadingState = () => {
  const [loadingStates, setLoadingStates] = useState({});

  const setLoading = useCallback((key, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }));
  }, []);

  const isLoading = useCallback((key) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const clearLoading = useCallback(() => {
    setLoadingStates({});
  }, []);

  return { setLoading, isLoading, clearLoading };
};