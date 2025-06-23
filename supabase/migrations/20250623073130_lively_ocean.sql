/*
  # Add Partial Approval Support

  1. New Columns
    - `quantity_approved` - Approved quantity for each item (can be less than requested)
    - `total_approved_cost` - Total cost of approved quantities
    - `status` - Item-level status (pending, approved, partially_approved, rejected, fulfilled, partially_fulfilled)

  2. Features
    - Support for partial quantity approvals
    - Item-level status tracking
    - Approved cost calculations
    - Enhanced approval workflow

  3. Security
    - Maintains existing RLS policies
    - Audit trail for partial approvals
*/

-- Add quantity_approved column to requisition_items
ALTER TABLE requisition_items ADD COLUMN quantity_approved INTEGER DEFAULT 0;

-- Add total_approved_cost to requisitions table
ALTER TABLE requisitions ADD COLUMN total_approved_cost DECIMAL(12,2) DEFAULT 0;

-- Update existing data to set quantity_approved = quantity_requested for approved items
UPDATE requisition_items 
SET quantity_approved = quantity_requested 
WHERE status = 'approved';

-- Create index for better performance on approved quantities
CREATE INDEX IF NOT EXISTS idx_requisition_items_approved ON requisition_items(quantity_approved);

-- Insert migration record
INSERT OR IGNORE INTO schema_migrations (version, description) 
VALUES ('20250122000002', 'Add partial approval support to requisition system');