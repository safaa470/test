-- Migration: Add unit_type to units (Safe Version)
-- Skips duplicate column issue

-- NOTE: unit_type column already exists — skipping ALTER TABLE

-- Insert migration record
INSERT OR IGNORE INTO schema_migrations (version, description) 
VALUES ('20250622095844', 'Add unit_type column to units table');
