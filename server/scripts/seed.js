#!/usr/bin/env node

/**
 * Database Seeding Script
 * 
 * This script populates the database with sample inventory data for testing.
 * Run with: npm run seed
 */

const DatabaseSeeder = require('../seeders/seedDatabase');

async function main() {
  console.log('🌱 Warehouse Management System - Database Seeder');
  console.log('================================================\n');
  
  try {
    const seeder = new DatabaseSeeder();
    await seeder.seedAll();
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('You can now test the application with sample data.');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
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