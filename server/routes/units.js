import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const dbPath = path.join(__dirname, '../database/warehouse.db');
const db = new Database(dbPath);

// Get all units
router.get('/', (req, res) => {
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
    
    const units = db.prepare(query).all();
    res.json(units);
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({ error: 'Failed to fetch units' });
  }
});

// Create new unit
router.post('/', (req, res) => {
  try {
    const { name, abbreviation, unit_type, base_unit_id, conversion_factor } = req.body;
    
    const result = db.prepare(`
      INSERT INTO units (name, abbreviation, unit_type, base_unit_id, conversion_factor)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      name, 
      abbreviation, 
      unit_type || 'general', 
      base_unit_id || null, 
      conversion_factor || 1
    );

    res.status(201).json({ 
      id: result.lastInsertRowid, 
      message: 'Unit created successfully' 
    });
  } catch (error) {
    console.error('Error creating unit:', error);
    res.status(500).json({ error: 'Failed to create unit' });
  }
});

// Update unit
router.put('/:id', (req, res) => {
  try {
    const { name, abbreviation, unit_type, base_unit_id, conversion_factor } = req.body;
    
    const result = db.prepare(`
      UPDATE units 
      SET name = ?, abbreviation = ?, unit_type = ?, base_unit_id = ?, conversion_factor = ?
      WHERE id = ?
    `).run(
      name, 
      abbreviation, 
      unit_type || 'general', 
      base_unit_id || null, 
      conversion_factor || 1, 
      req.params.id
    );

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
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM units WHERE id = ?').run(req.params.id);
    
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