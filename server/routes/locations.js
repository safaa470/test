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

// Get all locations
router.get('/', async (req, res) => {
  try {
    const locations = await getData('SELECT * FROM locations ORDER BY name');
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// Create new location
router.post('/', async (req, res) => {
  try {
    const { name, description, address } = req.body;
    
    const result = await runQuery(`
      INSERT INTO locations (name, description, address)
      VALUES (?, ?, ?)
    `, [name, description || null, address || null]);

    res.status(201).json({ 
      id: result.lastID, 
      message: 'Location created successfully' 
    });
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ error: 'Failed to create location' });
  }
});

// Update location
router.put('/:id', async (req, res) => {
  try {
    const { name, description, address } = req.body;
    
    const result = await runQuery(`
      UPDATE locations 
      SET name = ?, description = ?, address = ?
      WHERE id = ?
    `, [name, description || null, address || null, req.params.id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Delete location
router.delete('/:id', async (req, res) => {
  try {
    const result = await runQuery('DELETE FROM locations WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ error: 'Failed to delete location' });
  }
});

export default router;