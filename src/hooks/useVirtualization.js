import { useState, useEffect, useMemo } from 'react';

/**
 * Hook for virtualizing large lists to improve performance
 */
export const useVirtualization = ({
  items,
  itemHeight = 50,
  containerHeight = 400,
  overscan = 5
}) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map((item, index) => ({
      ...item,
      index: visibleRange.startIndex + index
    }));
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    visibleRange
  };
};

/**
 * Hook for infinite scrolling
 */
export const useInfiniteScroll = ({
  fetchMore,
  hasMore,
  threshold = 100
}) => {
  const [isFetching, setIsFetching] = useState(false);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    
    if (scrollHeight - scrollTop <= clientHeight + threshold && hasMore && !isFetching) {
      setIsFetching(true);
      fetchMore().finally(() => setIsFetching(false));
    }
  };

  return { handleScroll, isFetching };
};