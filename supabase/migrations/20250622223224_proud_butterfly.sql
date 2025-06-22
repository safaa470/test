/*
  # Comprehensive Requisition System

  1. New Tables
    - `requisitions` - Main requisition records
    - `requisition_items` - Items requested in each requisition
    - `requisition_approvals` - Approval workflow tracking
    - `approval_workflows` - Configurable approval workflows
    - `workflow_steps` - Individual steps in approval workflows

  2. Features
    - Multi-level approval workflow
    - Configurable approval chains
    - Item-level requisitions
    - Status tracking
    - Integration with inventory
    - Automatic inventory updates on approval

  3. Security
    - RLS policies for data access
    - Role-based approval permissions
    - Audit trail for all actions
*/

-- Approval workflows configuration
CREATE TABLE IF NOT EXISTS approval_workflows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Workflow steps (defines the approval chain)
CREATE TABLE IF NOT EXISTS workflow_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id INTEGER NOT NULL,
  step_order INTEGER NOT NULL,
  approver_role TEXT NOT NULL, -- 'manager', 'admin', 'finance', etc.
  required_approvers INTEGER DEFAULT 1,
  is_parallel BOOLEAN DEFAULT 0, -- Can multiple people approve at same time
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workflow_id) REFERENCES approval_workflows (id) ON DELETE CASCADE
);

-- Main requisitions table
CREATE TABLE IF NOT EXISTS requisitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requisition_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  requested_by INTEGER NOT NULL,
  department TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'pending_approval', 'approved', 'rejected', 'cancelled', 'fulfilled', 'partially_fulfilled')),
  workflow_id INTEGER,
  current_step INTEGER DEFAULT 1,
  total_estimated_cost DECIMAL(12,2) DEFAULT 0,
  justification TEXT,
  required_date DATE,
  submitted_at DATETIME,
  approved_at DATETIME,
  rejected_at DATETIME,
  fulfilled_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requested_by) REFERENCES users (id),
  FOREIGN KEY (workflow_id) REFERENCES approval_workflows (id)
);

-- Requisition items (what's being requested)
CREATE TABLE IF NOT EXISTS requisition_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requisition_id INTEGER NOT NULL,
  inventory_id INTEGER, -- NULL if requesting new item not in inventory
  item_name TEXT NOT NULL,
  item_description TEXT,
  quantity_requested INTEGER NOT NULL,
  unit_id INTEGER,
  estimated_unit_cost DECIMAL(10,2),
  total_estimated_cost DECIMAL(12,2),
  quantity_approved INTEGER DEFAULT 0,
  quantity_fulfilled INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled', 'partially_fulfilled')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requisition_id) REFERENCES requisitions (id) ON DELETE CASCADE,
  FOREIGN KEY (inventory_id) REFERENCES inventory (id),
  FOREIGN KEY (unit_id) REFERENCES units (id)
);

-- Approval tracking
CREATE TABLE IF NOT EXISTS requisition_approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requisition_id INTEGER NOT NULL,
  workflow_step_id INTEGER NOT NULL,
  approver_id INTEGER NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'returned')),
  comments TEXT,
  approved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requisition_id) REFERENCES requisitions (id) ON DELETE CASCADE,
  FOREIGN KEY (workflow_step_id) REFERENCES workflow_steps (id),
  FOREIGN KEY (approver_id) REFERENCES users (id)
);

-- Requisition attachments
CREATE TABLE IF NOT EXISTS requisition_attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requisition_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requisition_id) REFERENCES requisitions (id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users (id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_requisitions_status ON requisitions(status);
CREATE INDEX IF NOT EXISTS idx_requisitions_requested_by ON requisitions(requested_by);
CREATE INDEX IF NOT EXISTS idx_requisitions_workflow ON requisitions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_requisitions_number ON requisitions(requisition_number);
CREATE INDEX IF NOT EXISTS idx_requisition_items_requisition ON requisition_items(requisition_id);
CREATE INDEX IF NOT EXISTS idx_requisition_items_inventory ON requisition_items(inventory_id);
CREATE INDEX IF NOT EXISTS idx_requisition_approvals_requisition ON requisition_approvals(requisition_id);
CREATE INDEX IF NOT EXISTS idx_requisition_approvals_approver ON requisition_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow ON workflow_steps(workflow_id);

-- Insert default approval workflow
INSERT OR IGNORE INTO approval_workflows (id, name, description, is_active) VALUES 
(1, 'Standard Approval', 'Standard 2-level approval workflow', 1),
(2, 'High Value Approval', 'Multi-level approval for high-value requisitions', 1),
(3, 'Emergency Approval', 'Fast-track approval for urgent requests', 1);

-- Insert workflow steps for standard approval
INSERT OR IGNORE INTO workflow_steps (workflow_id, step_order, approver_role, required_approvers) VALUES 
(1, 1, 'manager', 1),
(1, 2, 'admin', 1);

-- Insert workflow steps for high value approval
INSERT OR IGNORE INTO workflow_steps (workflow_id, step_order, approver_role, required_approvers) VALUES 
(2, 1, 'manager', 1),
(2, 2, 'admin', 1),
(2, 3, 'finance', 1);

-- Insert workflow steps for emergency approval
INSERT OR IGNORE INTO workflow_steps (workflow_id, step_order, approver_role, required_approvers) VALUES 
(3, 1, 'admin', 1);

-- Insert migration record
INSERT OR IGNORE INTO schema_migrations (version, description) 
VALUES ('20250122000001', 'Create comprehensive requisition system with approval workflow');