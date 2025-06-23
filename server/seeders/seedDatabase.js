const Database = require('better-sqlite3');
const path = require('path');
const { 
  sampleCategories, 
  sampleUnits, 
  sampleLocations, 
  sampleSuppliers, 
  sampleInventoryItems 
} = require('./sampleData');

class DatabaseSeeder {
  constructor() {
    const dbPath = path.join(__dirname, '../database/warehouse.db');
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
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
      this.displaySummary();
      
    } catch (error) {
      console.error('❌ Error seeding database:', error);
      throw error;
    } finally {
      this.db.close();
    }
  }

  async clearExistingData() {
    console.log('🧹 Clearing existing data...');
    
    // Disable foreign key constraints temporarily
    this.db.pragma('foreign_keys = OFF');
    
    try {
      this.db.exec('DELETE FROM inventory');
      this.db.exec('DELETE FROM suppliers');
      this.db.exec('DELETE FROM locations');
      this.db.exec('DELETE FROM units');
      this.db.exec('DELETE FROM categories');
      
      // Reset auto-increment counters
      this.db.exec('DELETE FROM sqlite_sequence WHERE name IN ("inventory", "suppliers", "locations", "units", "categories")');
      
      console.log('✅ Existing data cleared');
    } finally {
      // Re-enable foreign key constraints
      this.db.pragma('foreign_keys = ON');
    }
  }

  async seedCategories() {
    console.log('📁 Seeding categories...');
    
    const insertCategory = this.db.prepare(`
      INSERT INTO categories (id, name, parent_id, description, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `);

    const insertMany = this.db.transaction((categories) => {
      for (const category of categories) {
        insertCategory.run(
          category.id,
          category.name,
          category.parent_id || null,
          category.description
        );
      }
    });

    insertMany(sampleCategories);
    console.log(`✅ Seeded ${sampleCategories.length} categories`);
  }

  async seedUnits() {
    console.log('📏 Seeding units...');
    
    const insertUnit = this.db.prepare(`
      INSERT INTO units (id, name, abbreviation, unit_type, base_unit_id, conversion_factor, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    const insertMany = this.db.transaction((units) => {
      for (const unit of units) {
        insertUnit.run(
          unit.id,
          unit.name,
          unit.abbreviation,
          unit.unit_type,
          unit.base_unit_id || null,
          unit.conversion_factor || 1
        );
      }
    });

    insertMany(sampleUnits);
    console.log(`✅ Seeded ${sampleUnits.length} units`);
  }

  async seedLocations() {
    console.log('📍 Seeding locations...');
    
    const insertLocation = this.db.prepare(`
      INSERT INTO locations (id, name, description, address, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `);

    const insertMany = this.db.transaction((locations) => {
      for (const location of locations) {
        insertLocation.run(
          location.id,
          location.name,
          location.description,
          location.address
        );
      }
    });

    insertMany(sampleLocations);
    console.log(`✅ Seeded ${sampleLocations.length} locations`);
  }

  async seedSuppliers() {
    console.log('🚚 Seeding suppliers...');
    
    const insertSupplier = this.db.prepare(`
      INSERT INTO suppliers (id, name, contact_person, email, phone, address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    const insertMany = this.db.transaction((suppliers) => {
      for (const supplier of suppliers) {
        insertSupplier.run(
          supplier.id,
          supplier.name,
          supplier.contact_person,
          supplier.email,
          supplier.phone,
          supplier.address
        );
      }
    });

    insertMany(sampleSuppliers);
    console.log(`✅ Seeded ${sampleSuppliers.length} suppliers`);
  }

  async seedInventoryItems() {
    console.log('📦 Seeding inventory items...');
    
    const insertItem = this.db.prepare(`
      INSERT INTO inventory (
        id, name, sku, description, category_id, base_unit_id, issue_unit_id,
        location_id, supplier_id, quantity, min_quantity, max_quantity, unit_price,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    const insertMany = this.db.transaction((items) => {
      for (const item of items) {
        insertItem.run(
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
        );
      }
    });

    insertMany(sampleInventoryItems);
    console.log(`✅ Seeded ${sampleInventoryItems.length} inventory items`);
  }

  async updateInventoryCalculations() {
    console.log('🧮 Updating inventory calculations...');
    
    // Update total_value for all items
    const updateTotalValue = this.db.prepare(`
      UPDATE inventory 
      SET total_value = quantity * unit_price,
          updated_at = datetime('now')
      WHERE id = ?
    `);

    const updateMany = this.db.transaction((items) => {
      for (const item of items) {
        updateTotalValue.run(item.id);
      }
    });

    updateMany(sampleInventoryItems);
    console.log('✅ Updated inventory calculations');
  }

  displaySummary() {
    console.log('\n📊 SEEDING SUMMARY');
    console.log('==================');
    
    // Get counts from database
    const categoriesCount = this.db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
    const unitsCount = this.db.prepare('SELECT COUNT(*) as count FROM units').get().count;
    const locationsCount = this.db.prepare('SELECT COUNT(*) as count FROM locations').get().count;
    const suppliersCount = this.db.prepare('SELECT COUNT(*) as count FROM suppliers').get().count;
    const inventoryCount = this.db.prepare('SELECT COUNT(*) as count FROM inventory').get().count;
    
    console.log(`📁 Categories: ${categoriesCount}`);
    console.log(`📏 Units: ${unitsCount}`);
    console.log(`📍 Locations: ${locationsCount}`);
    console.log(`🚚 Suppliers: ${suppliersCount}`);
    console.log(`📦 Inventory Items: ${inventoryCount}`);
    
    // Get inventory statistics
    const totalValue = this.db.prepare('SELECT SUM(total_value) as total FROM inventory').get().total || 0;
    const lowStockCount = this.db.prepare('SELECT COUNT(*) as count FROM inventory WHERE quantity <= min_quantity').get().count;
    const outOfStockCount = this.db.prepare('SELECT COUNT(*) as count FROM inventory WHERE quantity = 0').get().count;
    
    console.log(`💰 Total Inventory Value: $${totalValue.toFixed(2)}`);
    console.log(`⚠️  Low Stock Items: ${lowStockCount}`);
    console.log(`🚫 Out of Stock Items: ${outOfStockCount}`);
    
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
  }
}

// Export for use in other files
module.exports = DatabaseSeeder;

// Run seeder if called directly
if (require.main === module) {
  const seeder = new DatabaseSeeder();
  seeder.seedAll().catch(console.error);
}