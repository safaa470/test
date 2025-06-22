import express from 'express';
import { logUserActivity } from '../utils/activityLogger.js';

const router = express.Router();

// Get all suppliers
router.get('/', (req, res) => {
  const { db } = req.app.locals;
  
  db.all('SELECT * FROM suppliers ORDER BY name', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Create supplier
router.post('/', (req, res) => {
  const { name, contact_person, email, phone, address } = req.body;
  const { db } = req.app.locals;

  db.run('INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES (?, ?, ?, ?, ?)',
    [name, contact_person, email, phone, address],
    function(err) {
      if (err) {
        return res.status(400).json({ error: 'Supplier creation failed' });
      }
      
      logUserActivity(db, req.user.id, 'create', `Created supplier: ${name}`, 
        `Contact: ${contact_person}`, req);
      
      res.json({ message: 'Supplier created successfully', id: this.lastID });
    }
  );
});

// Update supplier
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, contact_person, email, phone, address } = req.body;
  const { db } = req.app.locals;

  db.run('UPDATE suppliers SET name = ?, contact_person = ?, email = ?, phone = ?, address = ? WHERE id = ?',
    [name, contact_person, email, phone, address, id],
    function(err) {
      if (err) {
        return res.status(400).json({ error: 'Supplier update failed' });
      }
      
      logUserActivity(db, req.user.id, 'update', `Updated supplier: ${name}`, 
        `Contact: ${contact_person}`, req);
      
      res.json({ message: 'Supplier updated successfully' });
    }
  );
});

// Delete supplier
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const { db } = req.app.locals;

  // Get supplier info for logging
  db.get('SELECT name FROM suppliers WHERE id = ?', [id], (err, supplier) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Check if supplier is used in inventory
    db.get('SELECT COUNT(*) as count FROM inventory WHERE supplier_id = ?', [id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (result.count > 0) {
        return res.status(400).json({ error: 'Cannot delete supplier used in inventory items' });
      }

      // Delete supplier
      db.run('DELETE FROM suppliers WHERE id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Delete failed' });
        }
        
        if (supplier) {
          logUserActivity(db, req.user.id, 'delete', `Deleted supplier: ${supplier.name}`, null, req);
        }
        
        res.json({ message: 'Supplier deleted successfully' });
      });
    });
  });
});

export default router;