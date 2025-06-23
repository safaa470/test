const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Dashboard stats endpoint
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    totalItems: 0,
    lowStockItems: 0,
    totalValue: 0,
    totalCategories: 0
  });
});

// User activity endpoint
app.get('/api/users/:id/activity', (req, res) => {
  res.json([]);
});

// Requisitions dashboard stats endpoint
app.get('/api/requisitions/stats/dashboard', (req, res) => {
  res.json({
    totalRequisitions: 0,
    pendingRequisitions: 0,
    approvedRequisitions: 0,
    rejectedRequisitions: 0,
    totalValue: 0
  });
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

// Inventory endpoints
app.get('/api/inventory', (req, res) => {
  res.json([]);
});

app.post('/api/inventory', (req, res) => {
  res.json({ id: 1, ...req.body, created_at: new Date().toISOString() });
});

app.put('/api/inventory/:id', (req, res) => {
  res.json({ id: parseInt(req.params.id), ...req.body, updated_at: new Date().toISOString() });
});

app.delete('/api/inventory/:id', (req, res) => {
  res.json({ message: 'Item deleted successfully' });
});

// Categories endpoints
app.get('/api/categories', (req, res) => {
  res.json([]);
});

app.post('/api/categories', (req, res) => {
  res.json({ id: 1, ...req.body, created_at: new Date().toISOString() });
});

app.put('/api/categories/:id', (req, res) => {
  res.json({ id: parseInt(req.params.id), ...req.body, updated_at: new Date().toISOString() });
});

app.delete('/api/categories/:id', (req, res) => {
  res.json({ message: 'Category deleted successfully' });
});

// Units endpoints
app.get('/api/units', (req, res) => {
  res.json([]);
});

app.post('/api/units', (req, res) => {
  res.json({ id: 1, ...req.body, created_at: new Date().toISOString() });
});

app.put('/api/units/:id', (req, res) => {
  res.json({ id: parseInt(req.params.id), ...req.body, updated_at: new Date().toISOString() });
});

app.delete('/api/units/:id', (req, res) => {
  res.json({ message: 'Unit deleted successfully' });
});

// Locations endpoints
app.get('/api/locations', (req, res) => {
  res.json([]);
});

app.post('/api/locations', (req, res) => {
  res.json({ id: 1, ...req.body, created_at: new Date().toISOString() });
});

app.put('/api/locations/:id', (req, res) => {
  res.json({ id: parseInt(req.params.id), ...req.body, updated_at: new Date().toISOString() });
});

app.delete('/api/locations/:id', (req, res) => {
  res.json({ message: 'Location deleted successfully' });
});

// Suppliers endpoints
app.get('/api/suppliers', (req, res) => {
  res.json([]);
});

app.post('/api/suppliers', (req, res) => {
  res.json({ id: 1, ...req.body, created_at: new Date().toISOString() });
});

app.put('/api/suppliers/:id', (req, res) => {
  res.json({ id: parseInt(req.params.id), ...req.body, updated_at: new Date().toISOString() });
});

app.delete('/api/suppliers/:id', (req, res) => {
  res.json({ message: 'Supplier deleted successfully' });
});

// Departments endpoints
app.get('/api/departments', (req, res) => {
  res.json([]);
});

app.post('/api/departments', (req, res) => {
  res.json({ id: 1, ...req.body, created_at: new Date().toISOString() });
});

app.put('/api/departments/:id', (req, res) => {
  res.json({ id: parseInt(req.params.id), ...req.body, updated_at: new Date().toISOString() });
});

app.delete('/api/departments/:id', (req, res) => {
  res.json({ message: 'Department deleted successfully' });
});

// Requisitions endpoints
app.get('/api/requisitions', (req, res) => {
  res.json([]);
});

app.post('/api/requisitions', (req, res) => {
  res.json({ id: 1, ...req.body, created_at: new Date().toISOString() });
});

app.put('/api/requisitions/:id', (req, res) => {
  res.json({ id: parseInt(req.params.id), ...req.body, updated_at: new Date().toISOString() });
});

app.delete('/api/requisitions/:id', (req, res) => {
  res.json({ message: 'Requisition deleted successfully' });
});

// Users endpoints
app.get('/api/users', (req, res) => {
  res.json([]);
});

app.post('/api/users', (req, res) => {
  res.json({ id: 1, ...req.body, created_at: new Date().toISOString() });
});

app.put('/api/users/:id', (req, res) => {
  res.json({ id: parseInt(req.params.id), ...req.body, updated_at: new Date().toISOString() });
});

app.delete('/api/users/:id', (req, res) => {
  res.json({ message: 'User deleted successfully' });
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