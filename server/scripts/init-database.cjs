#!/usr/bin/env node

/**
 * Database Initialization Script
 * 
 * This script creates all necessary database tables and ensures the database is ready for seeding
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../database/warehouse.db');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('📁 Created database directory:', dbDir);
}

console.log('🔧 Initializing database...');
console.log('📍 Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  } else {
    console.log('✅ Database connected successfully');
  }
});

// Enable foreign keys and WAL mode
db.run('PRAGMA foreign_keys = ON');
db.run('PRAGMA journal_mode = WAL');

async function createTables() {
  console.log('🏗️ Creating database tables...');

  const tables = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      is_active BOOLEAN DEFAULT 1,
      last_login DATETIME,
      login_count INTEGER DEFAULT 0,
      profile_image TEXT,
      phone TEXT,
      department TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Categories table
    `CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES categories (id)
    )`,

    // Units table
    `CREATE TABLE IF NOT EXISTS units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      abbreviation TEXT NOT NULL,
      unit_type TEXT DEFAULT 'general',
      base_unit_id INTEGER,
      conversion_factor DECIMAL(15,6) DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (base_unit_id) REFERENCES units (id)
    )`,

    // Locations table
    `CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Suppliers table
    `CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Inventory table
    `CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      description TEXT,
      category_id INTEGER,
      base_unit_id INTEGER,
      issue_unit_id INTEGER,
      location_id INTEGER,
      supplier_id INTEGER,
      quantity INTEGER DEFAULT 0,
      min_quantity INTEGER DEFAULT 0,
      max_quantity INTEGER DEFAULT 0,
      unit_price DECIMAL(10,2) DEFAULT 0,
      total_value DECIMAL(10,2) DEFAULT 0,
      last_purchase_price DECIMAL(10,2) DEFAULT 0,
      average_price DECIMAL(10,2) DEFAULT 0,
      barcode TEXT,
      qr_code TEXT,
      barcode_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id),
      FOREIGN KEY (base_unit_id) REFERENCES units (id),
      FOREIGN KEY (issue_unit_id) REFERENCES units (id),
      FOREIGN KEY (location_id) REFERENCES locations (id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
    )`,

    // Purchase history table
    `CREATE TABLE IF NOT EXISTS purchase_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inventory_id INTEGER NOT NULL,
      supplier_id INTEGER,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      created_by INTEGER,
      FOREIGN KEY (inventory_id) REFERENCES inventory (id) ON DELETE CASCADE,
      FOREIGN KEY (supplier_id) REFERENCES suppliers (id),
      FOREIGN KEY (created_by) REFERENCES users (id)
    )`,

    // User activity table
    `CREATE TABLE IF NOT EXISTS user_activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      description TEXT,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`
  ];

  for (const sql of tables) {
    await new Promise((resolve, reject) => {
      db.run(sql, (err) => {
        if (err) {
          console.error('❌ Error creating table:', err.message);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  console.log('✅ All tables created successfully');
}

async function createIndexes() {
  console.log('🔗 Creating database indexes...');
  
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku)',
    'CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category_id)',
    'CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory(location_id)',
    'CREATE INDEX IF NOT EXISTS idx_inventory_supplier ON inventory(supplier_id)',
    'CREATE INDEX IF NOT EXISTS idx_purchase_history_inventory_id ON purchase_history(inventory_id)',
    'CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id)',
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_barcode ON inventory(barcode) WHERE barcode IS NOT NULL'
  ];

  for (const indexSql of indexes) {
    await new Promise((resolve, reject) => {
      db.run(indexSql, (err) => {
        if (err) {
          console.warn('⚠️ Index creation warning:', err.message);
        }
        resolve();
      });
    });
  }
  
  console.log('✅ Indexes created successfully');
}

async function verifyTables() {
  console.log('🔍 Verifying database tables...');
  
  return new Promise((resolve, reject) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
      if (err) {
        console.error('❌ Error verifying tables:', err);
        reject(err);
        return;
      }
      
      console.log('📋 Available tables:', tables.map(t => t.name));
      
      const requiredTables = ['categories', 'units', 'locations', 'suppliers', 'inventory'];
      const missingTables = requiredTables.filter(table => 
        !tables.some(t => t.name === table)
      );
      
      if (missingTables.length > 0) {
        console.error('❌ Missing tables:', missingTables);
        reject(new Error(`Missing tables: ${missingTables.join(', ')}`));
        return;
      }
      
      console.log('✅ All required tables exist');
      resolve();
    });
  });
}

async function main() {
  try {
    await createTables();
    await createIndexes();
    await verifyTables();
    
    console.log('🎉 Database initialization completed successfully!');
    console.log('✅ Database is ready for seeding');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err);
      } else {
        console.log('✅ Database connection closed');
      }
    });
  }
}

main();