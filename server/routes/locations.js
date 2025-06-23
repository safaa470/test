const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const router = express.Router();

const dbPath = path.join(__dirname, '../database/warehouse.db');
const db = new Database(dbPath);

// Get all locations
router.get('/', (req, res) => {
  try {
    const locations = db.prepare('SELECT * FROM locations ORDER BY name').all();
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// Create new location
router.post('/', (req, res) => {
  try {
    const { name, description, address } = req.body;
    
    const result = db.prepare(`
      INSERT INTO locations (name, description, address)
      VALUES (?, ?, ?)
    `).run(name, description || null, address || null);

    res.status(201).json({ 
      id: result.lastInsertRowid, 
      message: 'Location created successfully' 
    });
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ error: 'Failed to create location' });
  }
});

// Update location
router.put('/:id', (req, res) => {
  try {
    const { name, description, address } = req.body;
    
    const result = db.prepare(`
      UPDATE locations 
      SET name = ?, description = ?, address = ?
      WHERE id = ?
    `).run(name, description || null, address || null, req.params.id);

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
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM locations WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ error: 'Failed to delete location' });
  }
});

module.exports = router;