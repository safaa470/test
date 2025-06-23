import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  sampleCategories, 
  sampleUnits, 
  sampleLocations, 
  sampleSuppliers, 
  sampleInventoryItems 
} from './sampleData.js';

const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseSeeder {
  constructor() {
    const dbPath = path.join(__dirname, '../database/warehouse.db');
    console.log('📍 Database path:', dbPath);
    this.db = new sqlite3.Database(dbPath);
    this.db.run('PRAGMA foreign_keys = ON');
  }

  async seedAll() {
    console.log('🌱 Starting database seeding...');
    
    try {
      // Clear existing data (in reverse order due to foreign keys)
      await this.clearExistingData();
      
      // Seed data in correct order
      await this.seedCategories();
      await this.seedUnits();
      await this.seedLocations();
      await this.seedSuppliers();
      await this.seedInventoryItems();
      await this.updateInventoryCalculations();
      
      console.log('✅ Database seeding completed successfully!');
      console.log(`📊 Seeded ${sampleInventoryItems.length} inventory items`);
      
      // Display summary
      await this.displaySummary();
      
    } catch (error) {
      console.error('❌ Error seeding database:', error);
      throw error;
    } finally {
      this.db.close();
    }
  }

  runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('SQL Error:', err.message);
          console.error('SQL:', sql);
          console.error('Params:', params);
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  getData(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('SQL Error:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async clearExistingData() {
    console.log('🧹 Clearing existing data...');
    
    // Disable foreign key constraints temporarily
    await this.runQuery('PRAGMA foreign_keys = OFF');
    
    try {
      await this.runQuery('DELETE FROM inventory');
      await this.runQuery('DELETE FROM suppliers');
      await this.runQuery('DELETE FROM locations');
      await this.runQuery('DELETE FROM units');
      await this.runQuery('DELETE FROM categories');
      
      // Reset auto-increment counters
      await this.runQuery('DELETE FROM sqlite_sequence WHERE name IN ("inventory", "suppliers", "locations", "units", "categories")');
      
      console.log('✅ Existing data cleared');
    } finally {
      // Re-enable foreign key constraints
      await this.runQuery('PRAGMA foreign_keys = ON');
    }
  }

  async seedCategories() {
    console.log('📁 Seeding categories...');
    
    for (const category of sampleCategories) {
      try {
        await this.runQuery(`
          INSERT INTO categories (id, name, parent_id, description, created_at)
          VALUES (?, ?, ?, ?, datetime('now'))
        `, [
          category.id,
          category.name,
          category.parent_id || null,
          category.description
        ]);
        console.log(`  ✓ Added category: ${category.name}`);
      } catch (error) {
        console.error(`  ✗ Failed to add category ${category.name}:`, error.message);
      }
    }

    console.log(`✅ Seeded ${sampleCategories.length} categories`);
  }

  async seedUnits() {
    console.log('📏 Seeding units...');
    
    for (const unit of sampleUnits) {
      try {
        await this.runQuery(`
          INSERT INTO units (id, name, abbreviation, unit_type, base_unit_id, conversion_factor, created_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `, [
          unit.id,
          unit.name,
          unit.abbreviation,
          unit.unit_type,
          unit.base_unit_id || null,
          unit.conversion_factor || 1
        ]);
        console.log(`  ✓ Added unit: ${unit.name} (${unit.abbreviation})`);
      } catch (error) {
        console.error(`  ✗ Failed to add unit ${unit.name}:`, error.message);
      }
    }

    console.log(`✅ Seeded ${sampleUnits.length} units`);
  }

  async seedLocations() {
    console.log('📍 Seeding locations...');
    
    for (const location of sampleLocations) {
      try {
        await this.runQuery(`
          INSERT INTO locations (id, name, description, address, created_at)
          VALUES (?, ?, ?, ?, datetime('now'))
        `, [
          location.id,
          location.name,
          location.description,
          location.address
        ]);
        console.log(`  ✓ Added location: ${location.name}`);
      } catch (error) {
        console.error(`  ✗ Failed to add location ${location.name}:`, error.message);
      }
    }

    console.log(`✅ Seeded ${sampleLocations.length} locations`);
  }

  async seedSuppliers() {
    console.log('🚚 Seeding suppliers...');
    
    for (const supplier of sampleSuppliers) {
      try {
        await this.runQuery(`
          INSERT INTO suppliers (id, name, contact_person, email, phone, address, created_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `, [
          supplier.id,
          supplier.name,
          supplier.contact_person,
          supplier.email,
          supplier.phone,
          supplier.address
        ]);
        console.log(`  ✓ Added supplier: ${supplier.name}`);
      } catch (error) {
        console.error(`  ✗ Failed to add supplier ${supplier.name}:`, error.message);
      }
    }

    console.log(`✅ Seeded ${sampleSuppliers.length} suppliers`);
  }

  async seedInventoryItems() {
    console.log('📦 Seeding inventory items...');
    
    for (const item of sampleInventoryItems) {
      try {
        await this.runQuery(`
          INSERT INTO inventory (
            id, name, sku, description, category_id, base_unit_id, issue_unit_id,
            location_id, supplier_id, quantity, min_quantity, max_quantity, unit_price,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `, [
          item.id,
          item.name,
          item.sku,
          item.description,
          item.category_id,
          item.base_unit_id,
          item.issue_unit_id || null,
          item.location_id,
          item.supplier_id,
          item.quantity,
          item.min_quantity,
          item.max_quantity,
          item.unit_price
        ]);
        console.log(`  ✓ Added inventory item: ${item.name} (${item.sku})`);
      } catch (error) {
        console.error(`  ✗ Failed to add inventory item ${item.name}:`, error.message);
      }
    }

    console.log(`✅ Seeded ${sampleInventoryItems.length} inventory items`);
  }

  async updateInventoryCalculations() {
    console.log('🧮 Updating inventory calculations...');
    
    // Update total_value for all items
    for (const item of sampleInventoryItems) {
      try {
        await this.runQuery(`
          UPDATE inventory 
          SET total_value = quantity * unit_price,
              updated_at = datetime('now')
          WHERE id = ?
        `, [item.id]);
      } catch (error) {
        console.error(`  ✗ Failed to update calculations for item ${item.id}:`, error.message);
      }
    }

    console.log('✅ Updated inventory calculations');
  }

  async displaySummary() {
    console.log('\n📊 SEEDING SUMMARY');
    console.log('==================');
    
    try {
      // Get counts from database
      const categoriesResult = await this.getData('SELECT COUNT(*) as count FROM categories');
      console.log(`📁 Categories: ${categoriesResult[0].count}`);
      
      const unitsResult = await this.getData('SELECT COUNT(*) as count FROM units');
      console.log(`📏 Units: ${unitsResult[0].count}`);
      
      const locationsResult = await this.getData('SELECT COUNT(*) as count FROM locations');
      console.log(`📍 Locations: ${locationsResult[0].count}`);
      
      const suppliersResult = await this.getData('SELECT COUNT(*) as count FROM suppliers');
      console.log(`🚚 Suppliers: ${suppliersResult[0].count}`);
      
      const inventoryResult = await this.getData('SELECT COUNT(*) as count FROM inventory');
      console.log(`📦 Inventory Items: ${inventoryResult[0].count}`);
      
      // Get inventory statistics
      const totalValueResult = await this.getData('SELECT SUM(total_value) as total FROM inventory');
      const totalValue = totalValueResult[0].total || 0;
      console.log(`💰 Total Inventory Value: $${totalValue.toFixed(2)}`);
      
      const lowStockResult = await this.getData('SELECT COUNT(*) as count FROM inventory WHERE quantity <= min_quantity');
      console.log(`⚠️  Low Stock Items: ${lowStockResult[0].count}`);
      
      const outOfStockResult = await this.getData('SELECT COUNT(*) as count FROM inventory WHERE quantity = 0');
      console.log(`🚫 Out of Stock Items: ${outOfStockResult[0].count}`);
      
      console.log('\n🎯 Test Data Includes:');
      console.log('- Office supplies (pens, paper, notebooks)');
      console.log('- Electronics (laptops, tablets, accessories)');
      console.log('- Furniture (chairs, desks, storage)');
      console.log('- Safety equipment (helmets, vests, gloves)');
      console.log('- Cleaning supplies (cleaners, towels, bags)');
      console.log('- Tools & hardware (drills, screwdrivers, measuring tools)');
      console.log('- Items with various stock levels (normal, low, out of stock)');
      console.log('- Multiple units and conversions');
      console.log('- Realistic pricing and quantities');
      
      console.log('\n✅ Ready for testing!');
    } catch (error) {
      console.error('Error displaying summary:', error);
    }
  }
}

// Export for use in other files
export default DatabaseSeeder;

// Run seeder if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const seeder = new DatabaseSeeder();
  seeder.seedAll().catch(console.error);
}