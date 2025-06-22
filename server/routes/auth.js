import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logUserActivity } from '../utils/activityLogger.js';

const router = express.Router();
const JWT_SECRET = 'warehouse_management_secret_key_2024';

// Login route
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const { db } = req.app.locals;

  console.log(`🔐 Login attempt for username: ${username}`);

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error('Database error during login:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      console.log(`❌ User not found: ${username}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log(`👤 User found: ${user.username}, Role: ${user.role}, Active: ${user.is_active}`);

    if (!bcrypt.compareSync(password, user.password)) {
      console.log(`❌ Invalid password for user: ${username}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.is_active === false || user.is_active === 0) {
      console.log(`❌ Account deactivated for user: ${username}`);
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Update last login and login count
    db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP, login_count = COALESCE(login_count, 0) + 1 WHERE id = ?', 
      [user.id]);

    // Log login activity
    logUserActivity(db, user.id, 'login', 'User logged in', null, req);

    // Create token with shorter expiration for session-based auth
    // Token expires in 8 hours (typical work shift)
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    console.log(`✅ Login successful for user: ${username}`);

    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  });
});

// Logout route
router.post('/logout', (req, res) => {
  const { db } = req.app.locals;
  
  // Log logout activity if user is authenticated
  if (req.user) {
    logUserActivity(db, req.user.id, 'logout', 'User logged out', null, req);
  }
  
  res.json({ message: 'Logged out successfully' });
});

// Register route
router.post('/register', (req, res) => {
  const { username, email, password, role = 'user', is_active = true } = req.body;
  const { db } = req.app.locals;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run('INSERT INTO users (username, email, password, role, is_active) VALUES (?, ?, ?, ?, ?)',
    [username, email, hashedPassword, role, is_active ? 1 : 0],
    function(err) {
      if (err) {
        console.error('Error creating user:', err);
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Username or email already exists' });
        }
        return res.status(400).json({ error: 'User creation failed: ' + err.message });
      }
      
      if (req.user) {
        logUserActivity(db, req.user.id, 'create', `Created user: ${username}`, `Role: ${role}`, req);
      }
      
      res.json({ message: 'User created successfully', id: this.lastID });
    }
  );
});

export default router;