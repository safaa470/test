const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const DatabaseMigrator = require('./database/migrator');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');
    const migrator = new DatabaseMigrator();
    await migrator.runMigrations();
    migrator.close();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Initialize database on startup
initializeDatabase();

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// API Routes
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/units', require('./routes/units'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/suppliers', require('./routes/suppliers'));

// Dashboard stats endpoint
app.get('/api/dashboard/stats', (req, res) => {
  try {
    const Database = require('better-sqlite3');
    const dbPath = path.join(__dirname, 'database/warehouse.db');
    const db = new Database(dbPath);
    
    const totalItems = db.prepare('SELECT COUNT(*) as count FROM inventory').get().count;
    const lowStockItems = db.prepare('SELECT COUNT(*) as count FROM inventory WHERE quantity <= min_quantity').get().count;
    const totalValue = db.prepare('SELECT SUM(total_value) as total FROM inventory').get().total || 0;
    const totalCategories = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
    
    db.close();
    
    res.json({
      totalItems,
      lowStockItems,
      totalValue,
      totalCategories
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.json({
      totalItems: 0,
      lowStockItems: 0,
      totalValue: 0,
      totalCategories: 0
    });
  }
});

// Authentication endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Basic authentication - replace with proper auth later
  if (username === 'admin' && password === 'admin') {
    res.json({
      token: 'dummy-token',
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin'
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Catch-all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Application not built. Please run "npm run build" first.');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;