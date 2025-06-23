import React, { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Optimized button component with loading states and debouncing
 */
const OptimizedButton = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  loadingText = 'Loading...',
  debounceMs = 300,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleClick = useCallback(async (e) => {
    const now = Date.now();
    
    // Debounce rapid clicks
    if (now - lastClickTime < debounceMs) {
      return;
    }
    
    setLastClickTime(now);
    setIsProcessing(true);

    try {
      await onClick?.(e);
    } finally {
      setIsProcessing(false);
    }
  }, [onClick, debounceMs, lastClickTime]);

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'btn-primary';
      case 'secondary':
        return 'btn-secondary';
      case 'success':
        return 'btn-success';
      case 'warning':
        return 'btn-warning';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      default:
        return 'btn-primary';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'md':
        return 'px-4 py-2';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2';
    }
  };

  const isDisabled = disabled || loading || isProcessing;
  const showLoading = loading || isProcessing;

  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
        transition-all duration-200 transform active:scale-95
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
      `}
    >
      {showLoading ? (
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          {loadingText}
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default OptimizedButton;