import express from 'express';
import { logUserActivity } from '../utils/activityLogger.js';

const router = express.Router();

// Get all departments
router.get('/', (req, res) => {
  const { db } = req.app.locals;
  
  const query = `
    SELECT * FROM departments 
    WHERE is_active = 1 
    ORDER BY name
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Database error in departments:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get all departments (including inactive for admin)
router.get('/all', (req, res) => {
  const { db } = req.app.locals;
  
  const query = `
    SELECT * FROM departments 
    ORDER BY is_active DESC, name
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Database error in departments/all:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get single department
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const { db } = req.app.locals;
  
  db.get('SELECT * FROM departments WHERE id = ?', [id], (err, department) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    res.json(department);
  });
});

// Create department
router.post('/', (req, res) => {
  const { name, description, manager_name, budget } = req.body;
  const { db } = req.app.locals;

  if (!name) {
    return res.status(400).json({ error: 'Department name is required' });
  }

  db.run(`INSERT INTO departments (name, description, manager_name, budget, is_active) 
          VALUES (?, ?, ?, ?, ?)`,
    [name, description || null, manager_name || null, budget || 0, 1],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Department name already exists' });
        }
        return res.status(400).json({ error: 'Department creation failed' });
      }
      
      logUserActivity(db, req.user.id, 'create', `Created department: ${name}`, 
        `Manager: ${manager_name || 'None'}, Budget: $${budget || 0}`, req);
      
      res.json({ message: 'Department created successfully', id: this.lastID });
    }
  );
});

// Update department
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, manager_name, budget, is_active } = req.body;
  const { db } = req.app.locals;

  if (!name) {
    return res.status(400).json({ error: 'Department name is required' });
  }

  db.run(`UPDATE departments 
          SET name = ?, description = ?, manager_name = ?, budget = ?, is_active = ? 
          WHERE id = ?`,
    [name, description || null, manager_name || null, budget || 0, is_active !== undefined ? is_active : 1, id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Department name already exists' });
        }
        return res.status(400).json({ error: 'Department update failed' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Department not found' });
      }
      
      logUserActivity(db, req.user.id, 'update', `Updated department: ${name}`, 
        `Manager: ${manager_name || 'None'}, Budget: $${budget || 0}`, req);
      
      res.json({ message: 'Department updated successfully' });
    }
  );
});

// Toggle department status
router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  const { db } = req.app.locals;

  db.run('UPDATE departments SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id], function(err) {
    if (err) {
      return res.status(400).json({ error: 'Status update failed' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    logUserActivity(db, req.user.id, 'update', 
      `${is_active ? 'Activated' : 'Deactivated'} department`, 
      `Department ID: ${id}`, req);
    
    res.json({ message: 'Department status updated successfully' });
  });
});

// Delete department
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const { db } = req.app.locals;

  // Get department info for logging
  db.get('SELECT name FROM departments WHERE id = ?', [id], (err, department) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Check if department is used in requisitions
    db.get('SELECT COUNT(*) as count FROM requisitions WHERE department = ?', [department.name], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (result.count > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete department used in requisitions. Consider deactivating instead.' 
        });
      }

      // Check if department is used in users table
      db.get('SELECT COUNT(*) as count FROM users WHERE department = ?', [department.name], (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (result.count > 0) {
          return res.status(400).json({ 
            error: 'Cannot delete department assigned to users. Consider deactivating instead.' 
          });
        }

        // Delete department
        db.run('DELETE FROM departments WHERE id = ?', [id], function(err) {
          if (err) {
            return res.status(500).json({ error: 'Delete failed' });
          }
          
          logUserActivity(db, req.user.id, 'delete', `Deleted department: ${department.name}`, null, req);
          
          res.json({ message: 'Department deleted successfully' });
        });
      });
    });
  });
});

// Get department statistics
router.get('/:id/stats', (req, res) => {
  const { id } = req.params;
  const { db } = req.app.locals;

  // Get department info
  db.get('SELECT * FROM departments WHERE id = ?', [id], (err, department) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Get requisition stats
    const statsQuery = `
      SELECT 
        COUNT(*) as total_requisitions,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_requisitions,
        COUNT(CASE WHEN status = 'pending_approval' THEN 1 END) as pending_requisitions,
        SUM(CASE WHEN status = 'approved' THEN total_estimated_cost ELSE 0 END) as total_approved_amount,
        SUM(total_estimated_cost) as total_requested_amount
      FROM requisitions 
      WHERE department = ?
    `;

    db.get(statsQuery, [department.name], (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Get user count
      db.get('SELECT COUNT(*) as user_count FROM users WHERE department = ?', [department.name], (err, userStats) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          department,
          stats: {
            ...stats,
            user_count: userStats.user_count,
            budget_utilization: department.budget > 0 ? 
              ((stats.total_approved_amount || 0) / department.budget * 100).toFixed(2) : 0
          }
        });
      });
    });
  });
});

export default router;