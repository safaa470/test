-- Migration: Add Inventory Movements
-- Description: Creates inventory_movements table for tracking stock in/out
-- Version: 1.3.0
-- Date: 2024-01-04

-- Inventory movements table
CREATE TABLE IF NOT EXISTS inventory_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inventory_id INTEGER NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT')),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2),
  reference_type TEXT, -- 'PURCHASE', 'SALE', 'TRANSFER', 'ADJUSTMENT'
  reference_id INTEGER,
  notes TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inventory_id) REFERENCES inventory (id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users (id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_movements_inventory_id ON inventory_movements(inventory_id);
CREATE INDEX IF NOT EXISTS idx_movements_type ON inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_movements_date ON inventory_movements(created_at);

-- Insert migration record
INSERT OR IGNORE INTO schema_migrations (version, description) 
VALUES ('004', 'Add inventory movements table');