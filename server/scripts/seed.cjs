#!/usr/bin/env node

/**
 * Database Seeding Script - COMPREHENSIVE VERSION
 * 
 * This script initializes the database and seeds it with sample data
 * Run with: npm run seed
 */

async function main() {
  console.log('🌱 Warehouse Management System - Database Seeder (COMPREHENSIVE)');
  console.log('================================================================\n');
  
  try {
    // STEP 1: Initialize database (create tables)
    console.log('🔧 STEP 1: Initializing database...');
    const { spawn } = require('child_process');
    
    await new Promise((resolve, reject) => {
      const initProcess = spawn('node', ['server/scripts/init-database.cjs'], {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      initProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Database initialization failed with code ${code}`));
        }
      });
      
      initProcess.on('error', (error) => {
        reject(error);
      });
    });
    
    console.log('✅ Database initialization completed\n');
    
    // STEP 2: Run the seeder
    console.log('🌱 STEP 2: Starting database seeding...');
    const { default: DatabaseSeeder } = await import('../seeders/seedDatabase.js');
    const seeder = new DatabaseSeeder();
    await seeder.seedAll();
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('✅ All inventory items have been seeded.');
    console.log('🔄 Please refresh your browser to see the inventory data.');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Seeding interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Seeding terminated');
  process.exit(0);
});

// Run the seeder
main();