import express from 'express';
import { logUserActivity } from '../utils/activityLogger.js';

const router = express.Router();

// Get all categories
router.get('/', (req, res) => {
  const { db } = req.app.locals;
  
  const query = `
    SELECT c.*, p.name as parent_name
    FROM categories c
    LEFT JOIN categories p ON c.parent_id = p.id
    ORDER BY c.name
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Create category
router.post('/', (req, res) => {
  const { name, parent_id, description } = req.body;
  const { db } = req.app.locals;

  db.run('INSERT INTO categories (name, parent_id, description) VALUES (?, ?, ?)',
    [name, parent_id || null, description],
    function(err) {
      if (err) {
        return res.status(400).json({ error: 'Category creation failed' });
      }
      
      logUserActivity(db, req.user.id, 'create', `Created category: ${name}`, description, req);
      
      res.json({ message: 'Category created successfully', id: this.lastID });
    }
  );
});

// Update category
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, parent_id, description } = req.body;
  const { db } = req.app.locals;

  db.run('UPDATE categories SET name = ?, parent_id = ?, description = ? WHERE id = ?',
    [name, parent_id || null, description, id],
    function(err) {
      if (err) {
        return res.status(400).json({ error: 'Category update failed' });
      }
      
      logUserActivity(db, req.user.id, 'update', `Updated category: ${name}`, description, req);
      
      res.json({ message: 'Category updated successfully' });
    }
  );
});

// Delete category
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const { db } = req.app.locals;

  // Get category info for logging
  db.get('SELECT name FROM categories WHERE id = ?', [id], (err, category) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Check if category has children
    db.get('SELECT COUNT(*) as count FROM categories WHERE parent_id = ?', [id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (result.count > 0) {
        return res.status(400).json({ error: 'Cannot delete category with subcategories' });
      }

      // Check if category is used in inventory
      db.get('SELECT COUNT(*) as count FROM inventory WHERE category_id = ?', [id], (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (result.count > 0) {
          return res.status(400).json({ error: 'Cannot delete category used in inventory items' });
        }

        // Delete category
        db.run('DELETE FROM categories WHERE id = ?', [id], function(err) {
          if (err) {
            return res.status(500).json({ error: 'Delete failed' });
          }
          
          if (category) {
            logUserActivity(db, req.user.id, 'delete', `Deleted category: ${category.name}`, null, req);
          }
          
          res.json({ message: 'Category deleted successfully' });
        });
      });
    });
  });
});

export default router;