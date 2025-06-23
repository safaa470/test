const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database using dynamic import for ES module
async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');
    const { default: DatabaseMigrator } = await import('./database/migrator.js');
    const migrator = new DatabaseMigrator();
    await migrator.runMigrations();
    await migrator.close();
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

// API Routes - using dynamic imports for ES modules
async function setupRoutes() {
  try {
    const { default: inventoryRouter } = await import('./routes/inventory.js');
    const { default: categoriesRouter } = await import('./routes/categories.js');
    const { default: unitsRouter } = await import('./routes/units.js');
    const { default: locationsRouter } = await import('./routes/locations.js');
    const { default: suppliersRouter } = await import('./routes/suppliers.js');

    app.use('/api/inventory', inventoryRouter);
    app.use('/api/categories', categoriesRouter);
    app.use('/api/units', unitsRouter);
    app.use('/api/locations', locationsRouter);
    app.use('/api/suppliers', suppliersRouter);
  } catch (error) {
    console.error('❌ Error setting up routes:', error);
    process.exit(1);
  }
}

// Setup routes
setupRoutes();

// Dashboard stats endpoint
app.get('/api/dashboard/stats', (req, res) => {
  try {
    const dbPath = path.join(__dirname, 'database/warehouse.db');
    const db = new sqlite3.Database(dbPath);
    
    // Use promises to handle async database operations
    const getStats = () => {
      return new Promise((resolve, reject) => {
        const stats = {
          totalItems: 0,
          lowStockItems: 0,
          totalValue: 0,
          totalCategories: 0
        };
        
        let completed = 0;
        const checkComplete = () => {
          completed++;
          if (completed === 4) {
            db.close();
            resolve(stats);
          }
        };
        
        db.get('SELECT COUNT(*) as count FROM inventory', (err, row) => {
          if (!err && row) stats.totalItems = row.count;
          checkComplete();
        });
        
        db.get('SELECT COUNT(*) as count FROM inventory WHERE quantity <= min_quantity', (err, row) => {
          if (!err && row) stats.lowStockItems = row.count;
          checkComplete();
        });
        
        db.get('SELECT SUM(total_value) as total FROM inventory', (err, row) => {
          if (!err && row) stats.totalValue = row.total || 0;
          checkComplete();
        });
        
        db.get('SELECT COUNT(*) as count FROM categories', (err, row) => {
          if (!err && row) stats.totalCategories = row.count;
          checkComplete();
        });
      });
    };
    
    getStats().then(stats => {
      res.json(stats);
    }).catch(error => {
      console.error('Error fetching dashboard stats:', error);
      res.json({
        totalItems: 0,
        lowStockItems: 0,
        totalValue: 0,
        totalCategories: 0
      });
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