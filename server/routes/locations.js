import express from 'express';
import { logUserActivity } from '../utils/activityLogger.js';

const router = express.Router();

// Get all locations
router.get('/', (req, res) => {
  const { db } = req.app.locals;
  
  db.all('SELECT * FROM locations ORDER BY name', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Create location
router.post('/', (req, res) => {
  const { name, description, address } = req.body;
  const { db } = req.app.locals;

  db.run('INSERT INTO locations (name, description, address) VALUES (?, ?, ?)',
    [name, description, address],
    function(err) {
      if (err) {
        return res.status(400).json({ error: 'Location creation failed' });
      }
      
      logUserActivity(db, req.user.id, 'create', `Created location: ${name}`, description, req);
      
      res.json({ message: 'Location created successfully', id: this.lastID });
    }
  );
});

// Update location
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, address } = req.body;
  const { db } = req.app.locals;

  db.run('UPDATE locations SET name = ?, description = ?, address = ? WHERE id = ?',
    [name, description, address, id],
    function(err) {
      if (err) {
        return res.status(400).json({ error: 'Location update failed' });
      }
      
      logUserActivity(db, req.user.id, 'update', `Updated location: ${name}`, description, req);
      
      res.json({ message: 'Location updated successfully' });
    }
  );
});

// Delete location
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const { db } = req.app.locals;

  // Get location info for logging
  db.get('SELECT name FROM locations WHERE id = ?', [id], (err, location) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Check if location is used in inventory
    db.get('SELECT COUNT(*) as count FROM inventory WHERE location_id = ?', [id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (result.count > 0) {
        return res.status(400).json({ error: 'Cannot delete location used in inventory items' });
      }

      // Delete location
      db.run('DELETE FROM locations WHERE id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Delete failed' });
        }
        
        if (location) {
          logUserActivity(db, req.user.id, 'delete', `Deleted location: ${location.name}`, null, req);
        }
        
        res.json({ message: 'Location deleted successfully' });
      });
    });
  });
});

export default router;