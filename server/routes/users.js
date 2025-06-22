import express from 'express';
import bcrypt from 'bcryptjs';
import { logUserActivity } from '../utils/activityLogger.js';

const router = express.Router();

// Get all users
router.get('/', (req, res) => {
  const { db } = req.app.locals;
  
  const query = `
    SELECT id, username, email, role, 
           CASE WHEN is_active IS NULL THEN 1 ELSE is_active END as is_active,
           last_login, 
           COALESCE(login_count, 0) as login_count,
           phone, department, created_at
    FROM users 
    ORDER BY created_at DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Database error in /api/users:', err);
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }
    res.json(rows);
  });
});

// Get user by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const { db } = req.app.locals;
  
  const query = `
    SELECT id, username, email, role, 
           CASE WHEN is_active IS NULL THEN 1 ELSE is_active END as is_active,
           last_login, 
           COALESCE(login_count, 0) as login_count,
           phone, department, created_at
    FROM users 
    WHERE id = ?
  `;

  db.get(query, [id], (err, user) => {
    if (err) {
      console.error('Database error in /api/users/:id:', err);
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  });
});

// Update user
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { username, email, role, is_active, phone, department, password } = req.body;
  const { db } = req.app.locals;

  let query = `UPDATE users SET username = ?, email = ?, role = ?, is_active = ?, phone = ?, department = ?`;
  let params = [username, email, role, is_active ? 1 : 0, phone || null, department || null];

  if (password) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    query += `, password = ?`;
    params.push(hashedPassword);
  }

  query += ` WHERE id = ?`;
  params.push(id);

  db.run(query, params, function(err) {
    if (err) {
      console.error('Database error in PUT /api/users/:id:', err);
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
      return res.status(400).json({ error: 'Update failed: ' + err.message });
    }
    
    logUserActivity(db, req.user.id, 'update', `Updated user: ${username}`, 
      `Role: ${role}, Active: ${is_active}`, req);
    
    res.json({ message: 'User updated successfully' });
  });
});

// Update user status
router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  const { db } = req.app.locals;

  db.run('UPDATE users SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id], function(err) {
    if (err) {
      console.error('Database error in PUT /api/users/:id/status:', err);
      return res.status(400).json({ error: 'Status update failed: ' + err.message });
    }
    
    logUserActivity(db, req.user.id, 'update', `${is_active ? 'Activated' : 'Deactivated'} user`, 
      `User ID: ${id}`, req);
    
    res.json({ message: 'User status updated successfully' });
  });
});

// Delete user
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const { db } = req.app.locals;

  // Don't allow deleting yourself
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  // Get user info before deletion for logging
  db.get('SELECT username FROM users WHERE id = ?', [id], (err, user) => {
    if (err) {
      console.error('Database error in DELETE /api/users/:id (get user):', err);
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user activity first
    db.run('DELETE FROM user_activity WHERE user_id = ?', [id], (err) => {
      if (err) {
        console.error('Database error deleting user activity:', err);
        return res.status(500).json({ error: 'Error deleting user activity: ' + err.message });
      }

      // Delete user
      db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('Database error deleting user:', err);
          return res.status(500).json({ error: 'Delete failed: ' + err.message });
        }
        
        logUserActivity(db, req.user.id, 'delete', `Deleted user: ${user.username}`, null, req);
        
        res.json({ message: 'User deleted successfully' });
      });
    });
  });
});

// Get user activity
router.get('/:id/activity', (req, res) => {
  const { id } = req.params;
  const { filter = 'all', days = '7' } = req.query;
  const { db } = req.app.locals;

  let query = `
    SELECT * FROM user_activity 
    WHERE user_id = ?
  `;
  let params = [id];

  // Add filter conditions
  if (filter !== 'all') {
    switch (filter) {
      case 'login':
        query += ` AND action IN ('login', 'logout')`;
        break;
      case 'inventory':
        query += ` AND action IN ('create', 'update', 'delete') AND description LIKE '%inventory%'`;
        break;
      case 'user':
        query += ` AND description LIKE '%user%'`;
        break;
      case 'system':
        query += ` AND action = 'system'`;
        break;
    }
  }

  // Add date filter
  if (days !== 'all') {
    query += ` AND created_at >= datetime('now', '-${parseInt(days)} days')`;
  }

  query += ` ORDER BY created_at DESC LIMIT 100`;

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Database error in /api/users/:id/activity:', err);
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }
    res.json(rows);
  });
});

export default router;