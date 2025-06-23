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

// Helper function to get single row
const getRow = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.get(sql, params, (err, row) => {
      db.close();
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Get all departments
router.get('/all', async (req, res) => {
  try {
    const departments = await getData('SELECT * FROM departments ORDER BY name');
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Get all active departments
router.get('/', async (req, res) => {
  try {
    const departments = await getData('SELECT * FROM departments WHERE is_active = 1 ORDER BY name');
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Get department by ID
router.get('/:id', async (req, res) => {
  try {
    const department = await getRow('SELECT * FROM departments WHERE id = ?', [req.params.id]);
    
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    res.json(department);
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({ error: 'Failed to fetch department' });
  }
});

// Get department statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const departmentId = req.params.id;
    
    // Get basic department info
    const department = await getRow('SELECT * FROM departments WHERE id = ?', [departmentId]);
    
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    // Get user count
    const userCount = await getRow('SELECT COUNT(*) as count FROM users WHERE department = ?', [department.name]);
    
    // Get requisition stats (if requisitions table exists)
    let requisitionStats = {
      total_requisitions: 0,
      approved_requisitions: 0,
      pending_requisitions: 0,
      total_approved_amount: 0,
      budget_utilization: 0
    };
    
    try {
      const totalReqs = await getRow('SELECT COUNT(*) as count FROM requisitions WHERE department = ?', [department.name]);
      const approvedReqs = await getRow('SELECT COUNT(*) as count FROM requisitions WHERE department = ? AND status = "approved"', [department.name]);
      const pendingReqs = await getRow('SELECT COUNT(*) as count FROM requisitions WHERE department = ? AND status IN ("submitted", "pending_approval")', [department.name]);
      const approvedAmount = await getRow('SELECT SUM(total_approved_cost) as total FROM requisitions WHERE department = ? AND status = "approved"', [department.name]);
      
      requisitionStats = {
        total_requisitions: totalReqs.count || 0,
        approved_requisitions: approvedReqs.count || 0,
        pending_requisitions: pendingReqs.count || 0,
        total_approved_amount: approvedAmount.total || 0,
        budget_utilization: department.budget > 0 ? Math.round(((approvedAmount.total || 0) / department.budget) * 100) : 0
      };
    } catch (reqError) {
      // Requisitions table might not exist yet, use default values
      console.log('Requisitions table not available, using default stats');
    }
    
    const stats = {
      user_count: userCount.count || 0,
      ...requisitionStats
    };
    
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching department stats:', error);
    res.status(500).json({ error: 'Failed to fetch department statistics' });
  }
});

// Create new department
router.post('/', async (req, res) => {
  try {
    const { name, description, manager_name, budget, is_active } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Department name is required' });
    }
    
    const result = await runQuery(`
      INSERT INTO departments (name, description, manager_name, budget, is_active)
      VALUES (?, ?, ?, ?, ?)
    `, [
      name.trim(),
      description || null,
      manager_name || null,
      budget || 0,
      is_active !== false ? 1 : 0
    ]);

    res.status(201).json({ 
      id: result.lastID, 
      message: 'Department created successfully' 
    });
  } catch (error) {
    console.error('Error creating department:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Department name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create department' });
    }
  }
});

// Update department
router.put('/:id', async (req, res) => {
  try {
    const { name, description, manager_name, budget, is_active } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Department name is required' });
    }
    
    const result = await runQuery(`
      UPDATE departments 
      SET name = ?, description = ?, manager_name = ?, budget = ?, is_active = ?
      WHERE id = ?
    `, [
      name.trim(),
      description || null,
      manager_name || null,
      budget || 0,
      is_active !== false ? 1 : 0,
      req.params.id
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json({ message: 'Department updated successfully' });
  } catch (error) {
    console.error('Error updating department:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Department name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update department' });
    }
  }
});

// Update department status
router.put('/:id/status', async (req, res) => {
  try {
    const { is_active } = req.body;
    
    const result = await runQuery(`
      UPDATE departments 
      SET is_active = ?
      WHERE id = ?
    `, [is_active ? 1 : 0, req.params.id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json({ message: 'Department status updated successfully' });
  } catch (error) {
    console.error('Error updating department status:', error);
    res.status(500).json({ error: 'Failed to update department status' });
  }
});

// Delete department
router.delete('/:id', async (req, res) => {
  try {
    // Check if department is used in requisitions
    try {
      const requisitionCheck = await getRow('SELECT COUNT(*) as count FROM requisitions WHERE department = (SELECT name FROM departments WHERE id = ?)', [req.params.id]);
      if (requisitionCheck && requisitionCheck.count > 0) {
        return res.status(400).json({ error: 'Cannot delete department that has associated requisitions' });
      }
    } catch (reqError) {
      // Requisitions table might not exist, continue with deletion
    }
    
    // Check if department is assigned to users
    const userCheck = await getRow('SELECT COUNT(*) as count FROM users WHERE department = (SELECT name FROM departments WHERE id = ?)', [req.params.id]);
    if (userCheck && userCheck.count > 0) {
      return res.status(400).json({ error: 'Cannot delete department that has assigned users' });
    }
    
    const result = await runQuery('DELETE FROM departments WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

export default router;