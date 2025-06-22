-- Migration: Add Barcode Support (Safe Version)
-- Description: Skips existing barcode columns
-- Version: 1.4.0
-- Date: 2024-01-05

-- NOTE: barcode/qr_code/barcode_type columns already exist — handled in JS
-- NOTE: Index creation is also handled in JS after column creation

-- Insert migration record
INSERT OR IGNORE INTO schema_migrations (version, description) 
VALUES ('20250622013146', 'Add barcode support to inventory');