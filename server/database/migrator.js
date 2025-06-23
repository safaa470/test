import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DatabaseMigrator {
  constructor() {
    const dbPath = path.join(__dirname, 'warehouse.db');
    this.db = new sqlite3.Database(dbPath);
    
    // Enable foreign keys and WAL mode
    this.db.run('PRAGMA foreign_keys = ON');
    this.db.run('PRAGMA journal_mode = WAL');
  }

  async runMigrations() {
    console.log('🔄 Running database migrations...');
    
    try {
      // Create schema_migrations table if it doesn't exist
      await this.runQuery(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          version TEXT UNIQUE NOT NULL,
          description TEXT,
          executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create all necessary tables
      await this.createTables();
      
      console.log('✅ Database migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  async createTables() {
    // Users table
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS users (
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
      )
    `);

    // Categories table
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        parent_id INTEGER,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES categories (id)
      )
    `);

    // Units table
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS units (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        abbreviation TEXT NOT NULL,
        unit_type TEXT DEFAULT 'general',
        base_unit_id INTEGER,
        conversion_factor DECIMAL(15,6) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (base_unit_id) REFERENCES units (id)
      )
    `);

    // Locations table
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Suppliers table
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact_person TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Inventory table
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS inventory (
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
      )
    `);

    // Purchase history table
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS purchase_history (
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
      )
    `);

    // User activity table
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS user_activity (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        description TEXT,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    await this.createIndexes();
  }

  async createIndexes() {
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
      try {
        await this.runQuery(indexSql);
      } catch (error) {
        console.warn('Index creation warning:', error.message);
      }
    }
  }

  close() {
    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        }
        resolve();
      });
    });
  }
}

export default DatabaseMigrator;