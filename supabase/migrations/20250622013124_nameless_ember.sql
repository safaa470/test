-- Migration: Initial Schema Setup
-- Description: Creates the initial database schema with all base tables
-- Version: 1.0.0
-- Date: 2024-01-01

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  parent_id INTEGER,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories (id)
);

-- Units table
CREATE TABLE IF NOT EXISTS units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  unit_type TEXT DEFAULT 'general',
  base_unit_id INTEGER,
  conversion_factor DECIMAL(15,6) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (base_unit_id) REFERENCES units (id)
);

-- Unit conversions table
CREATE TABLE IF NOT EXISTS unit_conversions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_unit_id INTEGER NOT NULL,
  to_unit_id INTEGER NOT NULL,
  conversion_factor DECIMAL(15,6) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_unit_id) REFERENCES units (id),
  FOREIGN KEY (to_unit_id) REFERENCES units (id),
  UNIQUE(from_unit_id, to_unit_id)
);

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Inventory table
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories (id),
  FOREIGN KEY (base_unit_id) REFERENCES units (id),
  FOREIGN KEY (issue_unit_id) REFERENCES units (id),
  FOREIGN KEY (location_id) REFERENCES locations (id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
);

-- Migration tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT UNIQUE NOT NULL,
  description TEXT,
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert migration record
INSERT OR IGNORE INTO schema_migrations (version, description) 
VALUES ('001', 'Initial schema setup');