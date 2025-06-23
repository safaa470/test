import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

/**
 * Performance wrapper component with error boundaries and suspense
 */
const PerformanceWrapper = ({ 
  children, 
  fallback = <div className="animate-pulse">Loading...</div>,
  errorFallback = ({ error, resetErrorBoundary }) => (
    <div className="text-center p-4">
      <h2 className="text-lg font-semibold text-red-600 mb-2">Something went wrong</h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button 
        onClick={resetErrorBoundary}
        className="btn-primary"
      >
        Try again
      </button>
    </div>
  )
}) => {
  return (
    <ErrorBoundary
      FallbackComponent={errorFallback}
      onError={(error, errorInfo) => {
        console.error('Performance wrapper error:', error, errorInfo);
      }}
    >
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

export default PerformanceWrapper;