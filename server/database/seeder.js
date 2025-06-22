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
        ['Office Supplies', null, 'General office supplies and stationery']
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