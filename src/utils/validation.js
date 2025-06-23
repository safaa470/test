// Validation utilities for the application

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateSKU = (sku) => {
  // SKU should be alphanumeric with hyphens allowed
  const skuRegex = /^[A-Z0-9-]+$/i;
  return skuRegex.test(sku) && sku.length >= 3;
};

export const validateQuantity = (quantity, min = 0) => {
  const num = parseFloat(quantity);
  return !isNaN(num) && num >= min;
};

export const validatePrice = (price) => {
  const num = parseFloat(price);
  return !isNaN(num) && num >= 0;
};

export const validateRequired = (value) => {
  return value !== null && value !== undefined && value.toString().trim() !== '';
};

export const validateForm = (data, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = data[field];
    
    if (rule.required && !validateRequired(value)) {
      errors[field] = `${rule.label || field} is required`;
      return;
    }
    
    if (value && rule.type === 'email' && !validateEmail(value)) {
      errors[field] = `${rule.label || field} must be a valid email`;
    }
    
    if (value && rule.type === 'sku' && !validateSKU(value)) {
      errors[field] = `${rule.label || field} must be a valid SKU (alphanumeric, 3+ characters)`;
    }
    
    if (value && rule.type === 'quantity' && !validateQuantity(value, rule.min)) {
      errors[field] = `${rule.label || field} must be a valid quantity (>= ${rule.min || 0})`;
    }
    
    if (value && rule.type === 'price' && !validatePrice(value)) {
      errors[field] = `${rule.label || field} must be a valid price (>= 0)`;
    }
    
    if (value && rule.minLength && value.toString().length < rule.minLength) {
      errors[field] = `${rule.label || field} must be at least ${rule.minLength} characters`;
    }
    
    if (value && rule.maxLength && value.toString().length > rule.maxLength) {
      errors[field] = `${rule.label || field} must be no more than ${rule.maxLength} characters`;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};