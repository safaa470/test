const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const { fileURLToPath } = require('url');

const router = express.Router();

// Initialize database connection
const dbPath = path.join(__dirname, '../database/warehouse.db');
const db = new Database(dbPath);

// Get all inventory items with related data
router.get('/', (req, res) => {
  try {
    const query = `
      SELECT 
        i.*,
        c.name as category_name,
        bu.name as base_unit_name,
        bu.abbreviation as base_unit_abbr,
        iu.name as issue_unit_name,
        iu.abbreviation as issue_unit_abbr,
        l.name as location_name,
        s.name as supplier_name
      FROM inventory i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN units bu ON i.base_unit_id = bu.id
      LEFT JOIN units iu ON i.issue_unit_id = iu.id
      LEFT JOIN locations l ON i.location_id = l.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      ORDER BY i.name
    `;
    
    const items = db.prepare(query).all();
    res.json(items);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Get single inventory item
router.get('/:id', (req, res) => {
  try {
    const query = `
      SELECT 
        i.*,
        c.name as category_name,
        bu.name as base_unit_name,
        bu.abbreviation as base_unit_abbr,
        iu.name as issue_unit_name,
        iu.abbreviation as issue_unit_abbr,
        l.name as location_name,
        s.name as supplier_name
      FROM inventory i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN units bu ON i.base_unit_id = bu.id
      LEFT JOIN units iu ON i.issue_unit_id = iu.id
      LEFT JOIN locations l ON i.location_id = l.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.id = ?
    `;
    
    const item = db.prepare(query).get(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ error: 'Failed to fetch inventory item' });
  }
});

// Create new inventory item
router.post('/', (req, res) => {
  try {
    const {
      name, sku, description, category_id, base_unit_id, issue_unit_id,
      location_id, supplier_id, quantity, min_quantity, max_quantity, unit_price
    } = req.body;

    // Calculate total value
    const total_value = (quantity || 0) * (unit_price || 0);

    const query = `
      INSERT INTO inventory (
        name, sku, description, category_id, base_unit_id, issue_unit_id,
        location_id, supplier_id, quantity, min_quantity, max_quantity, 
        unit_price, total_value, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `;

    const result = db.prepare(query).run(
      name, sku, description, category_id || null, base_unit_id || null, 
      issue_unit_id || null, location_id || null, supplier_id || null,
      quantity || 0, min_quantity || 0, max_quantity || 0, 
      unit_price || 0, total_value
    );

    res.status(201).json({ 
      id: result.lastInsertRowid, 
      message: 'Item created successfully' 
    });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'SKU already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create inventory item' });
    }
  }
});

// Update inventory item
router.put('/:id', (req, res) => {
  try {
    const {
      name, sku, description, category_id, base_unit_id, issue_unit_id,
      location_id, supplier_id, quantity, min_quantity, max_quantity, unit_price
    } = req.body;

    // Calculate total value
    const total_value = (quantity || 0) * (unit_price || 0);

    const query = `
      UPDATE inventory SET
        name = ?, sku = ?, description = ?, category_id = ?, base_unit_id = ?,
        issue_unit_id = ?, location_id = ?, supplier_id = ?, quantity = ?,
        min_quantity = ?, max_quantity = ?, unit_price = ?, total_value = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `;

    const result = db.prepare(query).run(
      name, sku, description, category_id || null, base_unit_id || null,
      issue_unit_id || null, location_id || null, supplier_id || null,
      quantity || 0, min_quantity || 0, max_quantity || 0,
      unit_price || 0, total_value, req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item updated successfully' });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'SKU already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update inventory item' });
    }
  }
});

// Delete inventory item
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM inventory WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

module.exports = router;