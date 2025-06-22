// Function to calculate average price
export const calculateAveragePrice = (db, inventoryId, callback) => {
  const query = `
    SELECT AVG(unit_price) as avg_price
    FROM purchase_history 
    WHERE inventory_id = ?
  `;
  
  db.get(query, [inventoryId], (err, result) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, result?.avg_price || 0);
    }
  });
};

// Function to update inventory pricing
export const updateInventoryPricing = (db, inventoryId, newPurchasePrice, callback) => {
  // Get last purchase price
  const lastPurchasePrice = newPurchasePrice;
  
  // Calculate average price
  calculateAveragePrice(db, inventoryId, (err, avgPrice) => {
    if (err) {
      callback(err);
      return;
    }
    
    // Update inventory with new pricing
    db.run(`UPDATE inventory 
            SET last_purchase_price = ?, average_price = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?`,
      [lastPurchasePrice, avgPrice, inventoryId],
      callback
    );
  });
};