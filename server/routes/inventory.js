import express from 'express';
import { logUserActivity } from '../utils/activityLogger.js';
import { calculateAveragePrice, updateInventoryPricing } from '../utils/inventoryHelpers.js';

const router = express.Router();

// Get all inventory items
router.get('/', (req, res) => {
  const { db } = req.app.locals;
  
  const query = `
    SELECT i.*, c.name as category_name, 
           bu.name as base_unit_name, bu.abbreviation as base_unit_abbr,
           iu.name as issue_unit_name, iu.abbreviation as issue_unit_abbr,
           l.name as location_name, s.name as supplier_name
    FROM inventory i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN units bu ON i.base_unit_id = bu.id
    LEFT JOIN units iu ON i.issue_unit_id = iu.id
    LEFT JOIN locations l ON i.location_id = l.id
    LEFT JOIN suppliers s ON i.supplier_id = s.id
    ORDER BY i.created_at DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Create new inventory item
router.post('/', (req, res) => {
  const { name, sku, description, category_id, base_unit_id, issue_unit_id, location_id, supplier_id, 
          quantity, min_quantity, max_quantity, unit_price } = req.body;
  const { db } = req.app.locals;
  
  const total_value = quantity * unit_price;
  const last_purchase_price = unit_price;
  const average_price = unit_price;

  db.run(`INSERT INTO inventory (name, sku, description, category_id, base_unit_id, issue_unit_id,
          location_id, supplier_id, quantity, min_quantity, max_quantity, 
          unit_price, last_purchase_price, average_price, total_value) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, sku, description, category_id, base_unit_id, issue_unit_id, location_id, supplier_id, 
     quantity, min_quantity, max_quantity, unit_price, last_purchase_price, average_price, total_value],
    function(err) {
      if (err) {
        return res.status(400).json({ error: 'SKU already exists or invalid data' });
      }

      // Add initial purchase history record
      if (quantity > 0 && unit_price > 0) {
        db.run(`INSERT INTO purchase_history (inventory_id, supplier_id, quantity, unit_price, total_amount, created_by)
                VALUES (?, ?, ?, ?, ?, ?)`,
          [this.lastID, supplier_id, quantity, unit_price, total_value, req.user.id]
        );
      }

      logUserActivity(db, req.user.id, 'create', `Added inventory item: ${name}`, `SKU: ${sku}`, req);

      res.json({ message: 'Item added successfully', id: this.lastID });
    }
  );
});

// Update inventory item
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, sku, description, category_id, base_unit_id, issue_unit_id, location_id, supplier_id, 
          quantity, min_quantity, max_quantity, unit_price } = req.body;
  const { db } = req.app.locals;
  
  const total_value = quantity * unit_price;

  // Get current inventory data to check if this is a new purchase
  db.get('SELECT * FROM inventory WHERE id = ?', [id], (err, currentItem) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const isNewPurchase = currentItem && (
      quantity > currentItem.quantity || 
      unit_price !== currentItem.unit_price
    );

    db.run(`UPDATE inventory SET name = ?, sku = ?, description = ?, category_id = ?, 
            base_unit_id = ?, issue_unit_id = ?, location_id = ?, supplier_id = ?, quantity = ?, 
            min_quantity = ?, max_quantity = ?, unit_price = ?, total_value = ?, 
            updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name, sku, description, category_id, base_unit_id, issue_unit_id, location_id, supplier_id, 
       quantity, min_quantity, max_quantity, unit_price, total_value, id],
      function(err) {
        if (err) {
          return res.status(400).json({ error: 'Update failed' });
        }

        // If this is a new purchase (quantity increased or price changed), add to purchase history
        if (isNewPurchase && quantity > currentItem.quantity) {
          const purchaseQuantity = quantity - currentItem.quantity;
          const purchaseAmount = purchaseQuantity * unit_price;

          db.run(`INSERT INTO purchase_history (inventory_id, supplier_id, quantity, unit_price, total_amount, created_by)
                  VALUES (?, ?, ?, ?, ?, ?)`,
            [id, supplier_id, purchaseQuantity, unit_price, purchaseAmount, req.user.id],
            () => {
              // Update pricing after adding purchase history
              updateInventoryPricing(db, id, unit_price, () => {
                logUserActivity(db, req.user.id, 'update', `Updated inventory item: ${name}`, `SKU: ${sku}`, req);
                res.json({ message: 'Item updated successfully' });
              });
            }
          );
        } else {
          // Just update pricing without adding purchase history
          updateInventoryPricing(db, id, unit_price, () => {
            logUserActivity(db, req.user.id, 'update', `Updated inventory item: ${name}`, `SKU: ${sku}`, req);
            res.json({ message: 'Item updated successfully' });
          });
        }
      }
    );
  });
});

// Delete inventory item
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const { db } = req.app.locals;

  // Get item info for logging
  db.get('SELECT name, sku FROM inventory WHERE id = ?', [id], (err, item) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Delete purchase history first
    db.run('DELETE FROM purchase_history WHERE inventory_id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error deleting purchase history' });
      }

      // Then delete inventory item
      db.run('DELETE FROM inventory WHERE id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Delete failed' });
        }
        
        if (item) {
          logUserActivity(db, req.user.id, 'delete', `Deleted inventory item: ${item.name}`, `SKU: ${item.sku}`, req);
        }
        
        res.json({ message: 'Item deleted successfully' });
      });
    });
  });
});

// Get purchase history for an item
router.get('/:id/purchases', (req, res) => {
  const { id } = req.params;
  const { db } = req.app.locals;
  
  const query = `
    SELECT ph.*, s.name as supplier_name, u.username as created_by_name
    FROM purchase_history ph
    LEFT JOIN suppliers s ON ph.supplier_id = s.id
    LEFT JOIN users u ON ph.created_by = u.id
    WHERE ph.inventory_id = ?
    ORDER BY ph.purchase_date DESC
  `;

  db.all(query, [id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Add purchase record
router.post('/:id/purchase', (req, res) => {
  const { id } = req.params;
  const { supplier_id, quantity, unit_price, notes } = req.body;
  const { db } = req.app.locals;
  const total_amount = quantity * unit_price;

  // Add purchase history record
  db.run(`INSERT INTO purchase_history (inventory_id, supplier_id, quantity, unit_price, total_amount, notes, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, supplier_id, quantity, unit_price, total_amount, notes, req.user.id],
    function(err) {
      if (err) {
        return res.status(400).json({ error: 'Failed to add purchase record' });
      }

      // Update inventory quantity and pricing
      db.get('SELECT quantity, name FROM inventory WHERE id = ?', [id], (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        const newQuantity = result.quantity + quantity;
        const newTotalValue = newQuantity * unit_price;

        db.run(`UPDATE inventory SET quantity = ?, unit_price = ?, total_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [newQuantity, unit_price, newTotalValue, id],
          (err) => {
            if (err) {
              return res.status(400).json({ error: 'Failed to update inventory' });
            }

            // Update pricing
            updateInventoryPricing(db, id, unit_price, () => {
              logUserActivity(db, req.user.id, 'create', `Recorded purchase for: ${result.name}`, 
                `Quantity: ${quantity}, Price: $${unit_price}`, req);
              res.json({ message: 'Purchase recorded successfully', id: this.lastID });
            });
          }
        );
      });
    }
  );
});

export default router;