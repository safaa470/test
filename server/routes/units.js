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

// Get all units
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        u.*,
        bu.name as base_unit_name,
        bu.abbreviation as base_unit_abbr
      FROM units u
      LEFT JOIN units bu ON u.base_unit_id = bu.id
      ORDER BY u.unit_type, u.name
    `;
    
    const units = await getData(query);
    res.json(units);
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({ error: 'Failed to fetch units' });
  }
});

// Create new unit
router.post('/', async (req, res) => {
  try {
    const { name, abbreviation, unit_type, base_unit_id, conversion_factor } = req.body;
    
    const result = await runQuery(`
      INSERT INTO units (name, abbreviation, unit_type, base_unit_id, conversion_factor)
      VALUES (?, ?, ?, ?, ?)
    `, [
      name, 
      abbreviation, 
      unit_type || 'general', 
      base_unit_id || null, 
      conversion_factor || 1
    ]);

    res.status(201).json({ 
      id: result.lastID, 
      message: 'Unit created successfully' 
    });
  } catch (error) {
    console.error('Error creating unit:', error);
    res.status(500).json({ error: 'Failed to create unit' });
  }
});

// Update unit
router.put('/:id', async (req, res) => {
  try {
    const { name, abbreviation, unit_type, base_unit_id, conversion_factor } = req.body;
    
    const result = await runQuery(`
      UPDATE units 
      SET name = ?, abbreviation = ?, unit_type = ?, base_unit_id = ?, conversion_factor = ?
      WHERE id = ?
    `, [
      name, 
      abbreviation, 
      unit_type || 'general', 
      base_unit_id || null, 
      conversion_factor || 1, 
      req.params.id
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    res.json({ message: 'Unit updated successfully' });
  } catch (error) {
    console.error('Error updating unit:', error);
    res.status(500).json({ error: 'Failed to update unit' });
  }
});

// Delete unit
router.delete('/:id', async (req, res) => {
  try {
    const result = await runQuery('DELETE FROM units WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Unit not found' });
    }
    
    res.json({ message: 'Unit deleted successfully' });
  } catch (error) {
    console.error('Error deleting unit:', error);
    res.status(500).json({ error: 'Failed to delete unit' });
  }
});

export default router;