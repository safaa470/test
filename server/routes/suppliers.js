import express from 'express';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const dbPath = path.join(__dirname, '../database/warehouse.db');

// Helper function to run queries with promises
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.run(sql, params, function(err) {
      db.close();
      if (err) {
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
    const db = new sqlite3.Database(dbPath);
    db.all(sql, params, (err, rows) => {
      db.close();
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Get all suppliers
router.get('/', async (req, res) => {
  try {
    const suppliers = await getData('SELECT * FROM suppliers ORDER BY name');
    res.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// Create new supplier
router.post('/', async (req, res) => {
  try {
    const { name, contact_person, email, phone, address } = req.body;
    
    const result = await runQuery(`
      INSERT INTO suppliers (name, contact_person, email, phone, address)
      VALUES (?, ?, ?, ?, ?)
    `, [name, contact_person || null, email || null, phone || null, address || null]);

    res.status(201).json({ 
      id: result.lastID, 
      message: 'Supplier created successfully' 
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// Update supplier
router.put('/:id', async (req, res) => {
  try {
    const { name, contact_person, email, phone, address } = req.body;
    
    const result = await runQuery(`
      UPDATE suppliers 
      SET name = ?, contact_person = ?, email = ?, phone = ?, address = ?
      WHERE id = ?
    `, [name, contact_person || null, email || null, phone || null, address || null, req.params.id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({ message: 'Supplier updated successfully' });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// Delete supplier
router.delete('/:id', async (req, res) => {
  try {
    const result = await runQuery('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

export default router;