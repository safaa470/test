import bcrypt from 'bcryptjs';

class DatabaseSeeder {
  constructor(db) {
    this.db = db;
  }

  // Seed initial data
  async seedInitialData() {
    console.log('🌱 Seeding initial data...');
    
    try {
      await this.seedUsers();
      await this.seedCategories();
      await this.seedUnits();
      await this.seedLocations();
      await this.seedSuppliers();
      await this.seedSampleInventory(); // Add sample inventory
      
      console.log('✅ Initial data seeded successfully');
    } catch (error) {
      console.error('❌ Error seeding data:', error);
      throw error;
    }
  }

  async seedUsers() {
    return new Promise((resolve, reject) => {
      // First check if admin user already exists
      this.db.get('SELECT id FROM users WHERE username = ?', ['admin'], (err, existingUser) => {
        if (err) {
          console.error('Error checking for existing admin user:', err);
          reject(err);
          return;
        }

        if (existingUser) {
          console.log('👤 Admin user already exists, skipping creation');
          resolve();
          return;
        }

        // Create admin user
        const adminPassword = bcrypt.hashSync('admin', 10);
        
        this.db.run(`INSERT INTO users (username, email, password, role, is_active, login_count) 
                     VALUES (?, ?, ?, ?, ?, ?)`, 
          ['admin', 'admin@warehouse.com', adminPassword, 'admin', 1, 0], 
          function(err) {
            if (err) {
              console.error('Error creating admin user:', err);
              reject(err);
            } else {
              console.log('👤 Admin user created successfully');
              console.log('📝 Default login credentials:');
              console.log('   Username: admin');
              console.log('   Password: admin');
              resolve();
            }
          }
        );
      });
    });
  }

  async seedCategories() {
    return new Promise((resolve, reject) => {
      const categories = [
        ['Electronics', null, 'Electronic items and components'],
        ['Furniture', null, 'Office and warehouse furniture'],
        ['Tools', null, 'Hardware tools and equipment'],
        ['Office Supplies', null, 'General office supplies and stationery'],
        ['Safety Equipment', null, 'Personal protective equipment and safety gear'],
        ['Cleaning Supplies', null, 'Cleaning and maintenance supplies']
      ];

      let completed = 0;
      const total = categories.length;

      categories.forEach(([name, parent_id, description]) => {
        this.db.run(`INSERT OR IGNORE INTO categories (name, parent_id, description) VALUES (?, ?, ?)`,
          [name, parent_id, description],
          (err) => {
            if (err) {
              reject(err);
              return;
            }
            completed++;
            if (completed === total) {
              console.log('📁 Categories seeded');
              resolve();
            }
          }
        );
      });
    });
  }

  async seedUnits() {
    return new Promise((resolve, reject) => {
      const units = [
        // Weight units
        ['Kilogram', 'kg', 'weight', null, 1],
        ['Gram', 'g', 'weight', 1, 0.001],
        ['Pound', 'lb', 'weight', 1, 0.453592],
        ['Ounce', 'oz', 'weight', 1, 0.0283495],
        
        // Volume units
        ['Liter', 'L', 'volume', null, 1],
        ['Milliliter', 'ml', 'volume', 5, 0.001],
        ['Gallon', 'gal', 'volume', 5, 3.78541],
        
        // Length units
        ['Meter', 'm', 'length', null, 1],
        ['Centimeter', 'cm', 'length', 8, 0.01],
        ['Inch', 'in', 'length', 8, 0.0254],
        
        // Count units
        ['Pieces', 'pcs', 'count', null, 1],
        ['Dozen', 'doz', 'count', 11, 12],
        
        // Packaging units
        ['Box', 'box', 'packaging', null, 1],
        ['Carton', 'ctn', 'packaging', null, 1]
      ];

      let completed = 0;
      const total = units.length;

      units.forEach(([name, abbreviation, unit_type, base_unit_id, conversion_factor]) => {
        this.db.run(`INSERT OR IGNORE INTO units (name, abbreviation, unit_type, base_unit_id, conversion_factor) 
                     VALUES (?, ?, ?, ?, ?)`,
          [name, abbreviation, unit_type, base_unit_id, conversion_factor],
          (err) => {
            if (err) {
              reject(err);
              return;
            }
            completed++;
            if (completed === total) {
              console.log('📏 Units seeded');
              resolve();
            }
          }
        );
      });
    });
  }

  async seedLocations() {
    return new Promise((resolve, reject) => {
      const locations = [
        ['Main Warehouse', 'Primary storage facility', '123 Industrial Ave'],
        ['Loading Dock', 'Receiving and shipping area', '123 Industrial Ave - Dock A'],
        ['Office Storage', 'Office supplies storage', '123 Industrial Ave - Office'],
        ['Cold Storage', 'Temperature controlled storage', '123 Industrial Ave - Cold Room']
      ];

      let completed = 0;
      const total = locations.length;

      locations.forEach(([name, description, address]) => {
        this.db.run(`INSERT OR IGNORE INTO locations (name, description, address) VALUES (?, ?, ?)`,
          [name, description, address],
          (err) => {
            if (err) {
              reject(err);
              return;
            }
            completed++;
            if (completed === total) {
              console.log('📍 Locations seeded');
              resolve();
            }
          }
        );
      });
    });
  }

  async seedSuppliers() {
    return new Promise((resolve, reject) => {
      const suppliers = [
        ['TechCorp Solutions', 'John Smith', 'john@techcorp.com', '+1-555-0101', '456 Tech Street, Silicon Valley'],
        ['Office Plus', 'Sarah Johnson', 'sarah@officeplus.com', '+1-555-0102', '789 Business Ave, Downtown'],
        ['Industrial Supply Co', 'Mike Wilson', 'mike@industrial.com', '+1-555-0103', '321 Factory Road, Industrial District']
      ];

      let completed = 0;
      const total = suppliers.length;

      suppliers.forEach(([name, contact_person, email, phone, address]) => {
        this.db.run(`INSERT OR IGNORE INTO suppliers (name, contact_person, email, phone, address) 
                     VALUES (?, ?, ?, ?, ?)`,
          [name, contact_person, email, phone, address],
          (err) => {
            if (err) {
              reject(err);
              return;
            }
            completed++;
            if (completed === total) {
              console.log('🚚 Suppliers seeded');
              resolve();
            }
          }
        );
      });
    });
  }

  async seedSampleInventory() {
    return new Promise((resolve, reject) => {
      // Check if sample inventory already exists
      this.db.get('SELECT COUNT(*) as count FROM inventory', [], (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        if (result.count > 0) {
          console.log('📦 Sample inventory already exists, skipping creation');
          resolve();
          return;
        }

        const sampleItems = [
          // Electronics
          ['Laptop Computer', 'LAPTOP-001', 'Dell Latitude 5520 Business Laptop', 1, 11, 11, 1, 1, 25, 5, 50, 899.99],
          ['Wireless Mouse', 'MOUSE-001', 'Logitech MX Master 3 Wireless Mouse', 1, 11, 11, 1, 1, 100, 10, 200, 79.99],
          ['USB Cable', 'USB-001', 'USB-C to USB-A Cable 6ft', 1, 11, 11, 1, 1, 500, 50, 1000, 12.99],
          ['Monitor', 'MON-001', '24" LED Monitor Full HD', 1, 11, 11, 1, 1, 15, 3, 30, 199.99],
          ['Keyboard', 'KEY-001', 'Mechanical Gaming Keyboard RGB', 1, 11, 11, 1, 1, 50, 5, 100, 129.99],

          // Office Supplies
          ['Copy Paper', 'PAPER-001', 'A4 White Copy Paper 500 sheets', 4, 13, 11, 2, 2, 200, 20, 500, 8.99],
          ['Ballpoint Pens', 'PEN-001', 'Blue Ballpoint Pens Pack of 12', 4, 13, 11, 2, 2, 150, 15, 300, 5.99],
          ['Stapler', 'STAPLER-001', 'Heavy Duty Office Stapler', 4, 11, 11, 2, 2, 25, 5, 50, 24.99],
          ['File Folders', 'FOLDER-001', 'Manila File Folders Letter Size', 4, 13, 11, 2, 2, 300, 30, 600, 15.99],
          ['Sticky Notes', 'NOTES-001', 'Yellow Sticky Notes 3x3 inch', 4, 13, 11, 2, 2, 100, 10, 200, 3.99],

          // Tools
          ['Screwdriver Set', 'SCREW-001', 'Professional Screwdriver Set 20pc', 3, 11, 11, 1, 3, 30, 5, 60, 39.99],
          ['Hammer', 'HAMMER-001', 'Claw Hammer 16oz Steel Handle', 3, 11, 11, 1, 3, 20, 3, 40, 29.99],
          ['Drill Bits', 'DRILL-001', 'HSS Drill Bit Set 1-10mm', 3, 11, 11, 1, 3, 50, 10, 100, 19.99],
          ['Measuring Tape', 'TAPE-001', '25ft Steel Measuring Tape', 3, 11, 11, 1, 3, 40, 5, 80, 14.99],

          // Safety Equipment
          ['Safety Helmet', 'HELMET-001', 'Hard Hat Safety Helmet White', 5, 11, 11, 1, 3, 75, 10, 150, 24.99],
          ['Safety Gloves', 'GLOVES-001', 'Cut Resistant Work Gloves Large', 5, 11, 11, 1, 3, 200, 20, 400, 12.99],
          ['Safety Glasses', 'GLASSES-001', 'Clear Safety Glasses Anti-Fog', 5, 11, 11, 1, 3, 100, 15, 200, 8.99],
          ['First Aid Kit', 'AID-001', 'Complete First Aid Kit 100pc', 5, 11, 11, 1, 3, 25, 5, 50, 34.99],

          // Cleaning Supplies
          ['All-Purpose Cleaner', 'CLEAN-001', 'Multi-Surface Cleaner Spray 32oz', 6, 5, 6, 4, 2, 80, 10, 160, 6.99],
          ['Paper Towels', 'TOWEL-001', 'Paper Towels 2-Ply 12 Rolls', 6, 13, 11, 4, 2, 120, 15, 240, 18.99],
          ['Trash Bags', 'TRASH-001', '13 Gallon Trash Bags 100ct', 6, 13, 11, 4, 2, 200, 25, 400, 12.99],

          // Furniture
          ['Office Chair', 'CHAIR-001', 'Ergonomic Office Chair with Lumbar Support', 2, 11, 11, 2, 1, 12, 2, 25, 249.99],
          ['Desk', 'DESK-001', 'Standing Desk Adjustable Height 48"', 2, 11, 11, 2, 1, 8, 1, 15, 399.99],
          ['Filing Cabinet', 'FILE-001', '4-Drawer Steel Filing Cabinet', 2, 11, 11, 2, 1, 6, 1, 12, 189.99]
        ];

        let completed = 0;
        const total = sampleItems.length;

        sampleItems.forEach(([name, sku, description, category_id, base_unit_id, issue_unit_id, location_id, supplier_id, quantity, min_quantity, max_quantity, unit_price]) => {
          const total_value = quantity * unit_price;
          const last_purchase_price = unit_price;
          const average_price = unit_price;

          this.db.run(`INSERT OR IGNORE INTO inventory 
                       (name, sku, description, category_id, base_unit_id, issue_unit_id, location_id, supplier_id, 
                        quantity, min_quantity, max_quantity, unit_price, last_purchase_price, average_price, total_value) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, sku, description, category_id, base_unit_id, issue_unit_id, location_id, supplier_id, 
             quantity, min_quantity, max_quantity, unit_price, last_purchase_price, average_price, total_value],
            (err) => {
              if (err) {
                console.error(`Error seeding inventory item ${name}:`, err);
                reject(err);
                return;
              }
              completed++;
              if (completed === total) {
                console.log('📦 Sample inventory seeded successfully');
                console.log(`   Added ${total} inventory items for testing`);
                resolve();
              }
            }
          );
        });
      });
    });
  }

  // Method to reset admin password (useful for debugging)
  async resetAdminPassword() {
    return new Promise((resolve, reject) => {
      const adminPassword = bcrypt.hashSync('admin', 10);
      
      this.db.run(`UPDATE users SET password = ?, is_active = 1 WHERE username = ?`, 
        [adminPassword, 'admin'], 
        function(err) {
          if (err) {
            console.error('Error resetting admin password:', err);
            reject(err);
          } else {
            console.log('🔑 Admin password reset to: admin');
            resolve();
          }
        }
      );
    });
  }

  // Method to ensure admin user exists and is active
  async ensureAdminUser() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, user) => {
        if (err) {
          console.error('Error checking admin user:', err);
          reject(err);
          return;
        }

        if (!user) {
          // Create admin user
          console.log('🔧 Creating missing admin user...');
          this.seedUsers().then(resolve).catch(reject);
        } else {
          // Ensure admin is active and password is correct
          const adminPassword = bcrypt.hashSync('admin', 10);
          this.db.run(`UPDATE users SET password = ?, is_active = 1, role = 'admin' WHERE username = ?`, 
            [adminPassword, 'admin'], 
            function(err) {
              if (err) {
                console.error('Error updating admin user:', err);
                reject(err);
              } else {
                console.log('✅ Admin user verified and updated');
                console.log('📝 Login credentials:');
                console.log('   Username: admin');
                console.log('   Password: admin');
                resolve();
              }
            }
          );
        }
      });
    });
  }
}

export default DatabaseSeeder;