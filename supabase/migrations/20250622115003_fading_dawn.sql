-- Migration: Add Pricing Columns
-- Description: Adds last_purchase_price and average_price columns to inventory table
-- Version: 1.1.0
-- Date: 2024-01-02

-- Note: Column additions are handled idempotently by ensureInventoryPricingColumns function
-- in server/database/migrator.js during server initialization

-- Insert migration record
INSERT OR IGNORE INTO schema_migrations (version, description) 
VALUES ('002', 'Add pricing columns to inventory');