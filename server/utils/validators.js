// Server-side validation utilities

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }
  return { isValid: true };
};

export const validateSKU = (sku) => {
  if (!sku || sku.length < 3) {
    return { isValid: false, message: 'SKU must be at least 3 characters long' };
  }
  
  const skuRegex = /^[A-Z0-9-]+$/i;
  if (!skuRegex.test(sku)) {
    return { isValid: false, message: 'SKU can only contain letters, numbers, and hyphens' };
  }
  
  return { isValid: true };
};

export const validateQuantity = (quantity, min = 0) => {
  const num = parseFloat(quantity);
  if (isNaN(num) || num < min) {
    return { isValid: false, message: `Quantity must be a number >= ${min}` };
  }
  return { isValid: true };
};

export const validatePrice = (price) => {
  const num = parseFloat(price);
  if (isNaN(num) || num < 0) {
    return { isValid: false, message: 'Price must be a positive number' };
  }
  return { isValid: true };
};

export const validateRequired = (value, fieldName) => {
  if (value === null || value === undefined || value.toString().trim() === '') {
    return { isValid: false, message: `${fieldName} is required` };
  }
  return { isValid: true };
};

export const validateInventoryItem = (data) => {
  const errors = [];
  
  const nameValidation = validateRequired(data.name, 'Name');
  if (!nameValidation.isValid) errors.push(nameValidation.message);
  
  const skuValidation = validateRequired(data.sku, 'SKU');
  if (!skuValidation.isValid) {
    errors.push(skuValidation.message);
  } else {
    const skuFormatValidation = validateSKU(data.sku);
    if (!skuFormatValidation.isValid) errors.push(skuFormatValidation.message);
  }
  
  if (data.quantity !== undefined) {
    const quantityValidation = validateQuantity(data.quantity);
    if (!quantityValidation.isValid) errors.push(quantityValidation.message);
  }
  
  if (data.min_quantity !== undefined) {
    const minQuantityValidation = validateQuantity(data.min_quantity);
    if (!minQuantityValidation.isValid) errors.push('Minimum ' + minQuantityValidation.message.toLowerCase());
  }
  
  if (data.max_quantity !== undefined) {
    const maxQuantityValidation = validateQuantity(data.max_quantity);
    if (!maxQuantityValidation.isValid) errors.push('Maximum ' + maxQuantityValidation.message.toLowerCase());
  }
  
  if (data.unit_price !== undefined) {
    const priceValidation = validatePrice(data.unit_price);
    if (!priceValidation.isValid) errors.push(priceValidation.message);
  }
  
  // Cross-field validation
  if (data.min_quantity !== undefined && data.max_quantity !== undefined) {
    const minQty = parseFloat(data.min_quantity);
    const maxQty = parseFloat(data.max_quantity);
    if (!isNaN(minQty) && !isNaN(maxQty) && maxQty > 0 && minQty > maxQty) {
      errors.push('Maximum quantity must be greater than minimum quantity');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateUser = (data) => {
  const errors = [];
  
  const usernameValidation = validateRequired(data.username, 'Username');
  if (!usernameValidation.isValid) errors.push(usernameValidation.message);
  
  const emailValidation = validateRequired(data.email, 'Email');
  if (!emailValidation.isValid) {
    errors.push(emailValidation.message);
  } else if (!validateEmail(data.email)) {
    errors.push('Email must be a valid email address');
  }
  
  if (data.password) {
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) errors.push(passwordValidation.message);
  }
  
  if (data.role && !['user', 'manager', 'admin'].includes(data.role)) {
    errors.push('Role must be user, manager, or admin');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateRequisition = (data) => {
  const errors = [];
  
  const titleValidation = validateRequired(data.title, 'Title');
  if (!titleValidation.isValid) errors.push(titleValidation.message);
  
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push('At least one item is required');
  } else {
    data.items.forEach((item, index) => {
      const itemNameValidation = validateRequired(item.item_name, `Item ${index + 1} name`);
      if (!itemNameValidation.isValid) errors.push(itemNameValidation.message);
      
      const quantityValidation = validateQuantity(item.quantity_requested, 1);
      if (!quantityValidation.isValid) {
        errors.push(`Item ${index + 1}: Quantity must be at least 1`);
      }
      
      if (item.estimated_unit_cost !== undefined) {
        const priceValidation = validatePrice(item.estimated_unit_cost);
        if (!priceValidation.isValid) {
          errors.push(`Item ${index + 1}: ${priceValidation.message}`);
        }
      }
    });
  }
  
  if (data.priority && !['low', 'medium', 'high', 'urgent'].includes(data.priority)) {
    errors.push('Priority must be low, medium, high, or urgent');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};