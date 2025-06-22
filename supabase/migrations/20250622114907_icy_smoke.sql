/*
  # Add unit_type column to units table

  1. New Columns
    - `unit_type` (text, default 'general') - categorizes units by type

  2. Changes
    - Adds missing unit_type column to existing units table
    - Sets default value to 'general' for backward compatibility

  3. Notes
    - This fixes the seeding process that expects unit_type column to exist
    - Column addition is handled by ensureUnitTypeColumn in migrator.js
*/

-- Insert migration record
INSERT OR IGNORE INTO schema_migrations (version, description) 
VALUES ('007', 'Add unit_type column to units table');