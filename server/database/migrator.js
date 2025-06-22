import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseMigrator {
  constructor(db) {
    this.db = db;
    this.migrationsPath = path.join(__dirname, '../../supabase/migrations');
  }

  async columnExistsInTable(tableName, columnName) {
    return new Promise((resolve, reject) => {
      this.db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
        if (err) return reject(err);
        resolve(rows.some(row => row.name === columnName));
      });
    });
  }

  async tableExists(tableName) {
    return new Promise((resolve, reject) => {
      this.db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [tableName], (err, row) => {
        if (err) return reject(err);
        resolve(!!row);
      });
    });
  }

  async indexExists(indexName) {
    return new Promise((resolve, reject) => {
      this.db.get(`SELECT name FROM sqlite_master WHERE type='index' AND name=?`, [indexName], (err, row) => {
        if (err) return reject(err);
        resolve(!!row);
      });
    });
  }

  async addColumnIfNotExists(tableName, columnName, columnDefinition) {
    try {
      const exists = await this.columnExistsInTable(tableName, columnName);
      if (!exists) {
        const safeColumnName = columnName.replace(/[^a-zA-Z0-9_]/g, '');
        const safeDefinition = columnDefinition.replace(/;/g, '');
        await new Promise((resolve, reject) => {
          this.db.run(`ALTER TABLE ${tableName} ADD COLUMN ${safeColumnName} ${safeDefinition}`, (err) => {
            if (err) return reject(err);
            console.log(`✅ Added column ${safeColumnName} to ${tableName}`);
            resolve();
          });
        });
      } else {
        console.log(`ℹ️  Column ${columnName} already exists in ${tableName}`);
      }
    } catch (error) {
      console.error(`❌ Error adding column ${columnName} to ${tableName}:`, error);
      throw error;
    }
  }

  async createTableIfNotExists(tableName, createTableSQL) {
    try {
      const exists = await this.tableExists(tableName);
      if (!exists) {
        await new Promise((resolve, reject) => {
          this.db.run(createTableSQL, (err) => {
            if (err) return reject(err);
            console.log(`✅ Created table ${tableName}`);
            resolve();
          });
        });
      } else {
        console.log(`ℹ️  Table ${tableName} already exists`);
      }
    } catch (error) {
      console.error(`❌ Error creating table ${tableName}:`, error);
      throw error;
    }
  }

  async createIndexIfNotExists(indexName, createIndexSQL) {
    try {
      const exists = await this.indexExists(indexName);
      if (!exists) {
        await new Promise((resolve, reject) => {
          this.db.run(createIndexSQL, (err) => {
            if (err && !err.message.includes('already exists')) return reject(err);
            if (!err) console.log(`✅ Created index ${indexName}`);
            resolve();
          });
        });
      } else {
        console.log(`ℹ️  Index ${indexName} already exists`);
      }
    } catch (error) {
      console.error(`❌ Error creating index ${indexName}:`, error);
      throw error;
    }
  }

  getMigrationFiles() {
    try {
      return fs.readdirSync(this.migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort();
    } catch {
      console.log('Migrations directory not found, creating...');
      fs.mkdirSync(this.migrationsPath, { recursive: true });
      return [];
    }
  }

  async getExecutedMigrations() {
    return new Promise((resolve, reject) => {
      this.db.run(`CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT UNIQUE NOT NULL,
        description TEXT,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) return reject(err);

        this.db.all(`SELECT version FROM schema_migrations ORDER BY version`, [], (err, rows) => {
          if (err) return reject(err);
          resolve(rows.map(row => row.version));
        });
      });
    });
  }

  // Clean SQL by removing problematic statements
  cleanMigrationSQL(sql) {
    console.log('🧹 Cleaning migration SQL...');
    
    // List of tables that are programmatically managed by ensureSchemaUpdates
    const managedTables = [
      'users',
      'categories', 
      'units',
      'locations',
      'suppliers',
      'inventory',
      'user_activity',
      'purchase_history',
      'inventory_movements',
      'schema_migrations'
    ];

    // Remove CREATE TABLE statements for managed tables
    const createTablePatterns = managedTables.map(table => 
      new RegExp(`CREATE\\s+TABLE\\s+(IF\\s+NOT\\s+EXISTS\\s+)?${table}\\s*\\([^;]*\\);`, 'gi')
    );

    // Remove ALTER TABLE ADD COLUMN statements - we'll handle these in JavaScript
    const alterColumnPatterns = [
      /ALTER\s+TABLE\s+\w+\s+ADD\s+COLUMN\s+[^;]+;/gi,
      /ALTER\s+TABLE\s+users\s+ADD\s+COLUMN\s+is_active[^;]*;/gi,
      /ALTER\s+TABLE\s+users\s+ADD\s+COLUMN\s+last_login[^;]*;/gi,
      /ALTER\s+TABLE\s+users\s+ADD\s+COLUMN\s+login_count[^;]*;/gi,
      /ALTER\s+TABLE\s+users\s+ADD\s+COLUMN\s+profile_image[^;]*;/gi,
      /ALTER\s+TABLE\s+users\s+ADD\s+COLUMN\s+phone[^;]*;/gi,
      /ALTER\s+TABLE\s+users\s+ADD\s+COLUMN\s+department[^;]*;/gi,
      /ALTER\s+TABLE\s+inventory\s+ADD\s+COLUMN\s+last_purchase_price[^;]*;/gi,
      /ALTER\s+TABLE\s+inventory\s+ADD\s+COLUMN\s+average_price[^;]*;/gi,
      /ALTER\s+TABLE\s+inventory\s+ADD\s+COLUMN\s+barcode[^;]*;/gi,
      /ALTER\s+TABLE\s+inventory\s+ADD\s+COLUMN\s+qr_code[^;]*;/gi,
      /ALTER\s+TABLE\s+inventory\s+ADD\s+COLUMN\s+barcode_type[^;]*;/gi,
      /ALTER\s+TABLE\s+units\s+ADD\s+COLUMN\s+unit_type[^;]*;/gi
    ];

    let cleanedSQL = sql;
    
    // Remove CREATE TABLE statements for managed tables
    createTablePatterns.forEach((pattern, index) => {
      const matches = cleanedSQL.match(pattern);
      if (matches) {
        console.log(`🚫 Removing CREATE TABLE for managed table: ${managedTables[index]}`);
        cleanedSQL = cleanedSQL.replace(pattern, `-- Table ${managedTables[index]} creation handled by ensureSchemaUpdates()`);
      }
    });

    // Remove ALTER TABLE ADD COLUMN statements
    alterColumnPatterns.forEach(pattern => {
      const matches = cleanedSQL.match(pattern);
      if (matches) {
        console.log(`🚫 Removing problematic SQL: ${matches[0].substring(0, 50)}...`);
        cleanedSQL = cleanedSQL.replace(pattern, '-- Column addition handled by ensureSchemaUpdates()');
      }
    });

    return cleanedSQL;
  }

  async executeMigration(filename) {
    const filePath = path.join(this.migrationsPath, filename);
    let sql = fs.readFileSync(filePath, 'utf8');
    const version = filename.replace('.sql', '');

    console.log(`⚙️ Executing migration: ${filename}`);

    // Clean the SQL to remove problematic statements
    sql = this.cleanMigrationSQL(sql);

    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) {
          console.error(`❌ Error in migration ${filename}:`, err);
          return reject(err);
        }
        console.log(`✅ Migration ${filename} executed`);

        // Record the migration
        this.db.run(`INSERT OR IGNORE INTO schema_migrations (version, description) VALUES (?, ?)`,
          [version, `Migration ${filename}`], (err) => {
            if (err) {
              console.error(`❌ Error recording migration ${filename}:`, err);
              return reject(err);
            }
            resolve();
          });
      });
    });
  }

  async runMigrations() {
    try {
      console.log('🔄 Checking for database migrations...');
      const migrationFiles = this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();

      const pendingMigrations = migrationFiles.filter(file => {
        const version = file.replace('.sql', '');
        return !executedMigrations.includes(version);
      });

      if (pendingMigrations.length === 0) {
        console.log('✅ Database is up to date');
        return;
      }

      console.log(`📦 Found ${pendingMigrations.length} pending migration(s)`);

      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }

      console.log('🎉 All migrations completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  async ensureSchemaUpdates() {
    try {
      console.log('🔧 Ensuring schema is up to date...');

      // First ensure all base tables exist
      await this.ensureBaseTables();

      // Then add missing columns
      await this.ensureColumns();

      // Ensure additional tables exist
      await this.ensureAdditionalTables();

      // Ensure indexes exist
      await this.ensureIndexes();

      console.log('✅ Schema updates completed');
    } catch (error) {
      console.error('❌ Error ensuring schema updates:', error);
      throw error;
    }
  }

  async ensureBaseTables() {
    console.log('📋 Ensuring base tables exist...');

    // Users table
    await this.createTableIfNotExists('users', `
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Categories table
    await this.createTableIfNotExists('categories', `
      CREATE TABLE categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        parent_id INTEGER,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES categories (id)
      )
    `);

    // Units table
    await this.createTableIfNotExists('units', `
      CREATE TABLE units (
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
    await this.createTableIfNotExists('locations', `
      CREATE TABLE locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Suppliers table
    await this.createTableIfNotExists('suppliers', `
      CREATE TABLE suppliers (
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
    await this.createTableIfNotExists('inventory', `
      CREATE TABLE inventory (
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id),
        FOREIGN KEY (base_unit_id) REFERENCES units (id),
        FOREIGN KEY (issue_unit_id) REFERENCES units (id),
        FOREIGN KEY (location_id) REFERENCES locations (id),
        FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
      )
    `);
  }

  async ensureColumns() {
    console.log('📋 Ensuring all columns exist...');

    // Inventory table columns
    await this.addColumnIfNotExists('inventory', 'last_purchase_price', 'DECIMAL(10,2) DEFAULT 0');
    await this.addColumnIfNotExists('inventory', 'average_price', 'DECIMAL(10,2) DEFAULT 0');
    await this.addColumnIfNotExists('inventory', 'barcode', 'TEXT');
    await this.addColumnIfNotExists('inventory', 'qr_code', 'TEXT');
    await this.addColumnIfNotExists('inventory', 'barcode_type', 'TEXT DEFAULT "CODE128"');

    // Units table columns
    await this.addColumnIfNotExists('units', 'unit_type', 'TEXT DEFAULT "general"');

    // Users table columns
    await this.addColumnIfNotExists('users', 'is_active', 'BOOLEAN DEFAULT 1');
    await this.addColumnIfNotExists('users', 'last_login', 'DATETIME');
    await this.addColumnIfNotExists('users', 'login_count', 'INTEGER DEFAULT 0');
    await this.addColumnIfNotExists('users', 'phone', 'TEXT');
    await this.addColumnIfNotExists('users', 'department', 'TEXT');
    await this.addColumnIfNotExists('users', 'profile_image', 'TEXT');
  }

  async ensureAdditionalTables() {
    console.log('📋 Ensuring additional tables exist...');

    await this.ensureUserActivityTable();
    await this.ensurePurchaseHistoryTable();
    await this.ensureInventoryMovementsTable();
  }

  async ensureUserActivityTable() {
    const createTableSQL = `
      CREATE TABLE user_activity (
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
    `;
    await this.createTableIfNotExists('user_activity', createTableSQL);
  }

  async ensurePurchaseHistoryTable() {
    const createTableSQL = `
      CREATE TABLE purchase_history (
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
    `;
    await this.createTableIfNotExists('purchase_history', createTableSQL);
  }

  async ensureInventoryMovementsTable() {
    const createTableSQL = `
      CREATE TABLE inventory_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inventory_id INTEGER NOT NULL,
        movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT')),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2),
        reference_type TEXT,
        reference_id INTEGER,
        notes TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (inventory_id) REFERENCES inventory (id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users (id)
      )
    `;
    await this.createTableIfNotExists('inventory_movements', createTableSQL);
  }

  async ensureIndexes() {
    console.log('📋 Ensuring indexes exist...');

    const indexes = [
      { name: 'idx_user_activity_user_id', sql: 'CREATE INDEX idx_user_activity_user_id ON user_activity(user_id)' },
      { name: 'idx_user_activity_action', sql: 'CREATE INDEX idx_user_activity_action ON user_activity(action)' },
      { name: 'idx_user_activity_date', sql: 'CREATE INDEX idx_user_activity_date ON user_activity(created_at)' },
      { name: 'idx_users_active', sql: 'CREATE INDEX idx_users_active ON users(is_active)' },
      { name: 'idx_users_role', sql: 'CREATE INDEX idx_users_role ON users(role)' },
      { name: 'idx_purchase_history_inventory_id', sql: 'CREATE INDEX idx_purchase_history_inventory_id ON purchase_history(inventory_id)' },
      { name: 'idx_purchase_history_date', sql: 'CREATE INDEX idx_purchase_history_date ON purchase_history(purchase_date)' },
      { name: 'idx_movements_inventory_id', sql: 'CREATE INDEX idx_movements_inventory_id ON inventory_movements(inventory_id)' },
      { name: 'idx_movements_type', sql: 'CREATE INDEX idx_movements_type ON inventory_movements(movement_type)' },
      { name: 'idx_movements_date', sql: 'CREATE INDEX idx_movements_date ON inventory_movements(created_at)' }
    ];

    for (const index of indexes) {
      await this.createIndexIfNotExists(index.name, index.sql);
    }

    // Special handling for barcode index (only if barcode column exists)
    try {
      const barcodeExists = await this.columnExistsInTable('inventory', 'barcode');
      if (barcodeExists) {
        await this.createIndexIfNotExists('idx_inventory_barcode', 
          'CREATE UNIQUE INDEX idx_inventory_barcode ON inventory(barcode) WHERE barcode IS NOT NULL');
      }
    } catch (error) {
      console.log('ℹ️  Skipping barcode index - column may not exist yet');
    }
  }

  async getTableColumns(tableName) {
    return new Promise((resolve, reject) => {
      this.db.all(`PRAGMA table_info(${tableName})`, [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  createMigration(name, description = '') {
    const migrationFiles = this.getMigrationFiles();
    const lastVersion = migrationFiles.length > 0
      ? parseInt(migrationFiles[migrationFiles.length - 1].split('_')[0])
      : 0;
    const newVersion = String(lastVersion + 1).padStart(3, '0');
    const filename = `${newVersion}_${name.toLowerCase().replace(/\s+/g, '_')}.sql`;
    const filePath = path.join(this.migrationsPath, filename);

    const template = `-- Migration: ${name}
-- Description: ${description}
-- Version: ${newVersion}
-- Date: ${new Date().toISOString().split('T')[0]}

-- Add your SQL statements here

-- Insert migration record
INSERT OR IGNORE INTO schema_migrations (version, description) 
VALUES ('${newVersion}', '${description}');
`;

    fs.writeFileSync(filePath, template);
    console.log(`📝 Created migration file: ${filename}`);
    return filename;
  }

  async getMigrationStatus() {
    try {
      const migrationFiles = this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();

      return {
        total: migrationFiles.length,
        executed: executedMigrations.length,
        pending: migrationFiles.length - executedMigrations.length,
        files: migrationFiles.map(file => {
          const version = file.replace('.sql', '');
          return {
            file,
            version,
            executed: executedMigrations.includes(version)
          };
        })
      };
    } catch (error) {
      console.error('Error getting migration status:', error);
      return null;
    }
  }
}

export default DatabaseMigrator;