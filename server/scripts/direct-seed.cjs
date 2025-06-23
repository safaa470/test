const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔧 DIRECT DATABASE SEEDING - FIXING INVENTORY ISSUE');
console.log('==================================================');

const dbPath = path.join(__dirname, '../database/warehouse.db');
console.log('📍 Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  }
  console.log('✅ Database connected');
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

async function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        console.error('❌ SQL Error:', err.message);
        console.error('📝 SQL:', sql);
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

async function seedDirectly() {
  try {
    console.log('🧹 Clearing existing data...');
    
    // Clear existing data
    await runQuery('DELETE FROM inventory');
    await runQuery('DELETE FROM suppliers');
    await runQuery('DELETE FROM locations');
    await runQuery('DELETE FROM units');
    await runQuery('DELETE FROM categories');
    
    console.log('✅ Data cleared');
    
    console.log('📁 Seeding categories...');
    // Categories
    await runQuery('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)', [1, 'Office Supplies', 'General office and administrative supplies']);
    await runQuery('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)', [2, 'Electronics', 'Electronic devices and components']);
    await runQuery('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)', [3, 'Furniture', 'Office and warehouse furniture']);
    await runQuery('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)', [4, 'Safety Equipment', 'Personal protective equipment']);
    await runQuery('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)', [5, 'Cleaning Supplies', 'Cleaning and maintenance supplies']);
    
    console.log('📏 Seeding units...');
    // Units
    await runQuery('INSERT INTO units (id, name, abbreviation, unit_type) VALUES (?, ?, ?, ?)', [1, 'Pieces', 'pcs', 'count']);
    await runQuery('INSERT INTO units (id, name, abbreviation, unit_type) VALUES (?, ?, ?, ?)', [2, 'Box', 'box', 'packaging']);
    await runQuery('INSERT INTO units (id, name, abbreviation, unit_type) VALUES (?, ?, ?, ?)', [3, 'Pack', 'pack', 'packaging']);
    await runQuery('INSERT INTO units (id, name, abbreviation, unit_type) VALUES (?, ?, ?, ?)', [4, 'Kilograms', 'kg', 'weight']);
    await runQuery('INSERT INTO units (id, name, abbreviation, unit_type) VALUES (?, ?, ?, ?)', [5, 'Liters', 'L', 'volume']);
    
    console.log('📍 Seeding locations...');
    // Locations
    await runQuery('INSERT INTO locations (id, name, description) VALUES (?, ?, ?)', [1, 'Main Warehouse', 'Primary storage facility']);
    await runQuery('INSERT INTO locations (id, name, description) VALUES (?, ?, ?)', [2, 'Office Storage', 'Office supply storage room']);
    await runQuery('INSERT INTO locations (id, name, description) VALUES (?, ?, ?)', [3, 'Electronics Lab', 'Secure electronics storage']);
    
    console.log('🚚 Seeding suppliers...');
    // Suppliers
    await runQuery('INSERT INTO suppliers (id, name, contact_person, email, phone) VALUES (?, ?, ?, ?, ?)', [1, 'Office Depot', 'John Smith', 'orders@officedepot.com', '555-0101']);
    await runQuery('INSERT INTO suppliers (id, name, contact_person, email, phone) VALUES (?, ?, ?, ?, ?)', [2, 'TechWorld Electronics', 'Sarah Johnson', 'sales@techworld.com', '555-0102']);
    await runQuery('INSERT INTO suppliers (id, name, contact_person, email, phone) VALUES (?, ?, ?, ?, ?)', [3, 'Furniture Plus', 'Mike Wilson', 'info@furnitureplus.com', '555-0103']);
    
    console.log('📦 Seeding inventory items...');
    // Inventory Items
    const items = [
      [1, 'Blue Ballpoint Pens', 'PEN-BLUE-001', 'Medium point blue ballpoint pens, pack of 12', 1, 1, 1, 2, 1, 50, 10, 100, 8.99, 449.50],
      [2, 'A4 Copy Paper', 'PAPER-A4-001', 'White A4 copy paper, 500 sheets per ream', 1, 2, 2, 2, 1, 25, 5, 50, 12.50, 312.50],
      [3, 'Wireless Mouse', 'MOUSE-WIRELESS-001', 'Wireless optical mouse with USB receiver', 2, 1, 1, 3, 2, 20, 5, 40, 19.99, 399.80],
      [4, 'Office Chair Ergonomic', 'CHAIR-ERGO-001', 'Ergonomic office chair with lumbar support', 3, 1, 1, 1, 3, 8, 2, 20, 249.99, 1999.92],
      [5, 'Safety Helmets', 'HELMET-SAFETY-001', 'ANSI approved safety helmets, adjustable', 4, 1, 1, 1, 1, 15, 5, 30, 29.99, 449.85],
      [6, 'All-Purpose Cleaner', 'CLEAN-ALLPURP-001', 'Multi-surface cleaner, 32 oz spray bottle', 5, 1, 1, 2, 1, 12, 3, 25, 4.99, 59.88],
      [7, 'Dell Laptop OptiPlex 3000', 'LAPTOP-DELL-3000', 'Dell OptiPlex 3000 laptop, 8GB RAM, 256GB SSD', 2, 1, 1, 3, 2, 5, 2, 15, 899.99, 4499.95],
      [8, 'Sticky Notes Yellow', 'STICKY-YELLOW-001', 'Yellow sticky notes, 3x3 inches, 100 sheets per pad', 1, 3, 1, 2, 1, 30, 8, 60, 2.75, 82.50],
      [9, 'Filing Cabinet 4-Drawer', 'FILE-CAB-4DR', 'Metal filing cabinet with 4 drawers and lock', 3, 1, 1, 1, 3, 6, 1, 15, 189.99, 1139.94],
      [10, 'Hand Sanitizer 8oz', 'SANITIZER-8OZ', 'Hand sanitizer gel, 8 oz pump bottle', 5, 1, 1, 2, 1, 0, 12, 50, 3.99, 0.00]
    ];
    
    for (const item of items) {
      await runQuery(`
        INSERT INTO inventory (
          id, name, sku, description, category_id, base_unit_id, issue_unit_id, 
          location_id, supplier_id, quantity, min_quantity, max_quantity, 
          unit_price, total_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, item);
    }
    
    console.log('✅ All data seeded successfully!');
    
    // Verify data
    const counts = await new Promise((resolve) => {
      db.get('SELECT COUNT(*) as count FROM inventory', (err, row) => {
        resolve(row ? row.count : 0);
      });
    });
    
    console.log(`📊 Verification: ${counts} inventory items created`);
    console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

seedDirectly();