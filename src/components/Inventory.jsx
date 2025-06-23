import React from 'react';
import InventoryPage from './inventory/InventoryPage';

// This is a wrapper component to maintain backward compatibility
const Inventory = () => {
  return <InventoryPage />;
};

export default Inventory;