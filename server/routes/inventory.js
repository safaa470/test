import express from 'express';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Initialize database connection
const dbPath = path.join(__dirname, '../database/warehouse.db');
console.log('📍 Inventory API using database:', dbPath);

// Helper function to run queries with promises
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Database connection error in inventory route:', err);
        reject(err);
        return;
      }
    });
    
    db.run(sql, params, function(err) {
      db.close();
      if (err) {
        console.error('❌ SQL Error in inventory route:', err);
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

// Helper function to get data with promises
const getData = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Database connection error in inventory route:', err);
        reject(err);
        return;
      }
    });
    
    db.all(sql, params, (err, rows) => {
      db.close();
      if (err) {
        console.error('❌ SQL Error in inventory route:', err);
        reject(err);
      } else {
        console.log(`📊 Query returned ${rows.length} rows`);
        resolve(rows);
      }
    });
  });
};

// Helper function to get single row
const getRow = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Database connection error in inventory route:', err);
        reject(err);
        return;
      }
    });
    
    db.get(sql, params, (err, row) => {
      db.close();
      if (err) {
        console.error('❌ SQL Error in inventory route:', err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Get all inventory items with related data
router.get('/', async (req, res) => {
  console.log('📦 GET /api/inventory - Fetching all inventory items');
  
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
    
    console.log('🔍 Executing inventory query...');
    const items = await getData(query);
    console.log(`✅ Found ${items.length} inventory items`);
    
    if (items.length > 0) {
      console.log('📋 Sample items:', items.slice(0, 3).map(item => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity
      })));
    }
    
    res.json(items);
  } catch (error) {
    console.error('❌ Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory', details: error.message });
  }
});

// Get single inventory item
router.get('/:id', async (req, res) => {
  console.log(`📦 GET /api/inventory/${req.params.id} - Fetching single item`);
  
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
    
    const item = await getRow(query, [req.params.id]);
    
    if (!item) {
      console.log(`❌ Item with ID ${req.params.id} not found`);
      return res.status(404).json({ error: 'Item not found' });
    }
    
    console.log(`✅ Found item: ${item.name}`);
    res.json(item);
  } catch (error) {
    console.error('❌ Error fetching inventory item:', error);
    res.status(500).json({ error: 'Failed to fetch inventory item', details: error.message });
  }
});

// Create new inventory item
router.post('/', async (req, res) => {
  console.log('📦 POST /api/inventory - Creating new item');
  
  try {
    const {
      name, sku, description, category_id, base_unit_id, issue_unit_id,
      location_id, supplier_id, quantity, min_quantity, max_quantity, unit_price
    } = req.body;

    console.log('📝 Creating item:', { name, sku, quantity, unit_price });

    // Calculate total value
    const total_value = (quantity || 0) * (unit_price || 0);

    const query = `
      INSERT INTO inventory (
        name, sku, description, category_id, base_unit_id, issue_unit_id,
        location_id, supplier_id, quantity, min_quantity, max_quantity, 
        unit_price, total_value, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `;

    const result = await runQuery(query, [
      name, sku, description, category_id || null, base_unit_id || null, 
      issue_unit_id || null, location_id || null, supplier_id || null,
      quantity || 0, min_quantity || 0, max_quantity || 0, 
      unit_price || 0, total_value
    ]);

    console.log(`✅ Created item with ID: ${result.lastID}`);
    res.status(201).json({ 
      id: result.lastID, 
      message: 'Item created successfully' 
    });
  } catch (error) {
    console.error('❌ Error creating inventory item:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'SKU already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create inventory item', details: error.message });
    }
  }
});

// Update inventory item
router.put('/:id', async (req, res) => {
  console.log(`📦 PUT /api/inventory/${req.params.id} - Updating item`);
  
  try {
    const {
      name, sku, description, category_id, base_unit_id, issue_unit_id,
      location_id, supplier_id, quantity, min_quantity, max_quantity, unit_price
    } = req.body;

    console.log('📝 Updating item:', { name, sku, quantity, unit_price });

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

    const result = await runQuery(query, [
      name, sku, description, category_id || null, base_unit_id || null,
      issue_unit_id || null, location_id || null, supplier_id || null,
      quantity || 0, min_quantity || 0, max_quantity || 0,
      unit_price || 0, total_value, req.params.id
    ]);

    if (result.changes === 0) {
      console.log(`❌ Item with ID ${req.params.id} not found for update`);
      return res.status(404).json({ error: 'Item not found' });
    }

    console.log(`✅ Updated item with ID: ${req.params.id}`);
    res.json({ message: 'Item updated successfully' });
  } catch (error) {
    console.error('❌ Error updating inventory item:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'SKU already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update inventory item', details: error.message });
    }
  }
});

// Delete inventory item
router.delete('/:id', async (req, res) => {
  console.log(`📦 DELETE /api/inventory/${req.params.id} - Deleting item`);
  
  try {
    const result = await runQuery('DELETE FROM inventory WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      console.log(`❌ Item with ID ${req.params.id} not found for deletion`);
      return res.status(404).json({ error: 'Item not found' });
    }
    
    console.log(`✅ Deleted item with ID: ${req.params.id}`);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting inventory item:', error);
    res.status(500).json({ error: 'Failed to delete inventory item', details: error.message });
  }
});

export default router;