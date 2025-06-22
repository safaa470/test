import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import DatabaseMigrator from './database/migrator.js';
import DatabaseSeeder from './database/seeder.js';
import { authenticateToken, requireAdmin } from './middleware/auth.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import inventoryRoutes from './routes/inventory.js';
import categoryRoutes from './routes/categories.js';
import unitRoutes from './routes/units.js';
import locationRoutes from './routes/locations.js';
import supplierRoutes from './routes/suppliers.js';
import dashboardRoutes from './routes/dashboard.js';
import databaseRoutes from './routes/database.js';
import requisitionRoutes from './routes/requisitions.js';
import workflowRoutes from './routes/workflows.js';
import departmentRoutes from './routes/departments.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://0.0.0.0:3000'],
  credentials: true
}));
app.use(express.json());

// Serve static files from dist directory (for production/preview)
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Database setup with migration system
const db = new sqlite3.Database('./warehouse.db');

// Make database available to routes
app.locals.db = db;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});

// Debug route to check admin user
app.get('/api/debug/admin', (req, res) => {
  db.get('SELECT username, role, is_active FROM users WHERE username = ?', ['admin'], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    if (!user) {
      return res.json({ message: 'Admin user not found' });
    }
    
    res.json({ 
      message: 'Admin user found', 
      user: {
        username: user.username,
        role: user.role,
        is_active: user.is_active
      }
    });
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, requireAdmin, userRoutes);
app.use('/api/inventory', authenticateToken, inventoryRoutes);
app.use('/api/categories', authenticateToken, categoryRoutes);
app.use('/api/units', authenticateToken, unitRoutes);
app.use('/api/locations', authenticateToken, locationRoutes);
app.use('/api/suppliers', authenticateToken, supplierRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/database', authenticateToken, databaseRoutes);
app.use('/api/requisitions', authenticateToken, requisitionRoutes);
app.use('/api/workflows', authenticateToken, workflowRoutes);
app.use('/api/departments', authenticateToken, departmentRoutes);

// Serve React app for all non-API routes (SPA fallback)
app.get('*', (req, res) => {
  // Don't serve React app for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ 
      error: 'Not Found', 
      message: `API route ${req.originalUrl} not found`
    });
  }
  
  // Serve React app
  res.sendFile(path.join(distPath, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: err.message 
  });
});

// Initialize database with migrations
const initializeDatabase = async () => {
  try {
    console.log('🚀 Initializing database...');
    
    const migrator = new DatabaseMigrator(db);
    const seeder = new DatabaseSeeder(db);
    
    // IMPORTANT: Run schema updates FIRST before migrations
    // This ensures all tables and columns exist before trying to run migration SQL
    console.log('🔧 Setting up schema...');
    await migrator.ensureSchemaUpdates();
    
    // Then run migrations (which will now be cleaned of problematic SQL)
    console.log('📦 Running migrations...');
    await migrator.runMigrations();
    
    // Ensure admin user exists and is properly configured
    console.log('👤 Setting up admin user...');
    await seeder.ensureAdminUser();
    
    // Seed initial data
    console.log('🌱 Seeding initial data...');
    await seeder.seedInitialData();
    
    console.log('✅ Database initialization completed successfully!');
    
    // Log migration status
    const status = await migrator.getMigrationStatus();
    if (status) {
      console.log(`📊 Migration Status: ${status.executed}/${status.total} executed, ${status.pending} pending`);
    }
    
    // Verify admin user
    db.get('SELECT username, role, is_active FROM users WHERE username = ?', ['admin'], (err, user) => {
      if (err) {
        console.error('Error verifying admin user:', err);
      } else if (user) {
        console.log(`👤 Admin user verified: ${user.username} (${user.role}) - Active: ${user.is_active}`);
      } else {
        console.error('❌ Admin user not found after initialization!');
      }
    });
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.error('Stack trace:', error.stack);
    // Don't exit - let the server start anyway for debugging
  }
};

// Start server
const startServer = async () => {
  try {
    // Initialize database first
    await initializeDatabase();
    
    // Then start the server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
      console.log(`📱 Backend API available at http://localhost:${PORT}/api`);
      console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Default login: admin / admin`);
      console.log(`📋 Frontend served from: http://localhost:${PORT}/`);
    });

    // Handle server errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please stop other processes or use a different port.`);
      } else {
        console.error('❌ Server error:', err);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('✅ Database connection closed');
    }
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();