-- Migration: Add Pricing Columns
-- Description: Adds last_purchase_price and average_price columns to inventory table
-- Version: 1.1.0
-- Date: 2024-01-02

-- Column creation handled by server-side migrator.ensureInventoryPricingColumns()
-- ALTER TABLE inventory ADD COLUMN last_purchase_price DECIMAL(10,2) DEFAULT 0;
-- ALTER TABLE inventory ADD COLUMN average_price DECIMAL(10,2) DEFAULT 0;

-- Insert migration record
INSERT OR IGNORE INTO schema_migrations (version, description) 
VALUES ('002', 'Add pricing columns to inventory');
