import React, { useState, useCallback, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { debounce } from '../../utils/performance';

/**
 * Optimized search component with debouncing and instant feedback
 */
const OptimizedSearch = ({ 
  onSearch, 
  placeholder = 'Search...', 
  debounceMs = 300,
  className = '',
  showClearButton = true 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  // Debounced search to reduce API calls
  const debouncedSearch = useMemo(
    () => debounce((term) => onSearch?.(term), debounceMs),
    [onSearch, debounceMs]
  );

  // Handle input change with immediate UI update
  const handleChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value); // Immediate UI update
    debouncedSearch(value); // Debounced API call
  }, [debouncedSearch]);

  const handleClear = useCallback(() => {
    setSearchTerm('');
    onSearch?.('');
  }, [onSearch]);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  return (
    <div className={`relative ${className}`}>
      <div className={`relative transition-all duration-200 ${
        isFocused ? 'ring-2 ring-primary-500 ring-opacity-50' : ''
      }`}>
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`pl-10 pr-10 form-input transition-all duration-200 ${
            isFocused ? 'border-primary-300' : ''
          }`}
        />
        
        {showClearButton && searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default OptimizedSearch;