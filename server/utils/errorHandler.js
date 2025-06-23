// Enhanced error handling utilities

export const createError = (message, statusCode = 500, code = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

export const handleDatabaseError = (error) => {
  console.error('Database error:', error);
  
  if (error.message.includes('UNIQUE constraint failed')) {
    if (error.message.includes('username')) {
      return createError('Username already exists', 400, 'DUPLICATE_USERNAME');
    }
    if (error.message.includes('email')) {
      return createError('Email already exists', 400, 'DUPLICATE_EMAIL');
    }
    if (error.message.includes('sku')) {
      return createError('SKU already exists', 400, 'DUPLICATE_SKU');
    }
    return createError('Duplicate entry found', 400, 'DUPLICATE_ENTRY');
  }
  
  if (error.message.includes('FOREIGN KEY constraint failed')) {
    return createError('Referenced record not found', 400, 'FOREIGN_KEY_ERROR');
  }
  
  if (error.message.includes('NOT NULL constraint failed')) {
    const field = error.message.match(/NOT NULL constraint failed: \w+\.(\w+)/)?.[1];
    return createError(`${field || 'Required field'} is required`, 400, 'MISSING_REQUIRED_FIELD');
  }
  
  return createError('Database operation failed', 500, 'DATABASE_ERROR');
};

export const handleValidationError = (errors) => {
  const message = Array.isArray(errors) 
    ? errors.join(', ') 
    : typeof errors === 'object' 
      ? Object.values(errors).join(', ')
      : errors;
  
  return createError(message, 400, 'VALIDATION_ERROR');
};

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const globalErrorHandler = (err, req, res, next) => {
  console.error('Global error handler:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'UNKNOWN_ERROR';
  
  res.status(statusCode).json({
    error: message,
    code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};