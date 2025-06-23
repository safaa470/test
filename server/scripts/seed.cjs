#!/usr/bin/env node

/**
 * Database Seeding Script - FIXED VERSION
 * 
 * This script ensures database tables exist before seeding data
 * Run with: npm run seed
 */

async function main() {
  console.log('🌱 Warehouse Management System - Database Seeder (FIXED)');
  console.log('=======================================================\n');
  
  try {
    // STEP 1: Force run migrations to ensure all tables exist
    console.log('🔧 STEP 1: Running database migrations...');
    const { default: DatabaseMigrator } = await import('../database/migrator.js');
    const migrator = new DatabaseMigrator();
    await migrator.runMigrations();
    await migrator.verifyTables();
    await migrator.close();
    console.log('✅ Database migrations completed\n');
    
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