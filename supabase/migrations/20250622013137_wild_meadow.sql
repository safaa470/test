-- Migration: Add Purchase History
-- Description: Creates purchase_history table for tracking all purchases
-- Version: 1.2.0
-- Date: 2024-01-03

-- Purchase history table
CREATE TABLE IF NOT EXISTS purchase_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inventory_id INTEGER NOT NULL,
  supplier_id INTEGER,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_by INTEGER,
  FOREIGN KEY (inventory_id) REFERENCES inventory (id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES suppliers (id),
  FOREIGN KEY (created_by) REFERENCES users (id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_history_inventory_id ON purchase_history(inventory_id);
CREATE INDEX IF NOT EXISTS idx_purchase_history_date ON purchase_history(purchase_date);

-- Insert migration record
INSERT OR IGNORE INTO schema_migrations (version, description) 
VALUES ('003', 'Add purchase history table');