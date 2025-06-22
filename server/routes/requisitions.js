import express from 'express';
import { logUserActivity } from '../utils/activityLogger.js';

const router = express.Router();

// Generate unique requisition number
const generateRequisitionNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-6);
  return `REQ-${year}${month}${day}-${timestamp}`;
};

// Get all requisitions (with filters)
router.get('/', (req, res) => {
  const { db } = req.app.locals;
  const { status, priority, department, requested_by } = req.query;
  
  let query = `
    SELECT r.*, 
           u.username as requested_by_name,
           aw.name as workflow_name,
           COUNT(ri.id) as item_count,
           SUM(ri.total_estimated_cost) as calculated_total_cost
    FROM requisitions r
    LEFT JOIN users u ON r.requested_by = u.id
    LEFT JOIN approval_workflows aw ON r.workflow_id = aw.id
    LEFT JOIN requisition_items ri ON r.id = ri.requisition_id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (status) {
    query += ` AND r.status = ?`;
    params.push(status);
  }
  
  if (priority) {
    query += ` AND r.priority = ?`;
    params.push(priority);
  }
  
  if (department) {
    query += ` AND r.department = ?`;
    params.push(department);
  }
  
  if (requested_by) {
    query += ` AND r.requested_by = ?`;
    params.push(requested_by);
  }
  
  // Non-admin users can only see their own requisitions or ones they need to approve
  if (req.user.role !== 'admin') {
    query += ` AND (r.requested_by = ? OR EXISTS (
      SELECT 1 FROM workflow_steps ws 
      WHERE ws.workflow_id = r.workflow_id 
      AND ws.approver_role = ?
      AND ws.step_order >= r.current_step
    ))`;
    params.push(req.user.id, req.user.role);
  }
  
  query += ` GROUP BY r.id ORDER BY r.created_at DESC`;

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get single requisition with full details
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const { db } = req.app.locals;

  // Get requisition details
  const requisitionQuery = `
    SELECT r.*, 
           u.username as requested_by_name,
           u.email as requested_by_email,
           aw.name as workflow_name,
           aw.description as workflow_description
    FROM requisitions r
    LEFT JOIN users u ON r.requested_by = u.id
    LEFT JOIN approval_workflows aw ON r.workflow_id = aw.id
    WHERE r.id = ?
  `;

  db.get(requisitionQuery, [id], (err, requisition) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!requisition) {
      return res.status(404).json({ error: 'Requisition not found' });
    }

    // Get requisition items
    const itemsQuery = `
      SELECT ri.*, 
             i.name as inventory_item_name,
             i.sku as inventory_sku,
             u.name as unit_name,
             u.abbreviation as unit_abbreviation
      FROM requisition_items ri
      LEFT JOIN inventory i ON ri.inventory_id = i.id
      LEFT JOIN units u ON ri.unit_id = u.id
      WHERE ri.requisition_id = ?
      ORDER BY ri.created_at
    `;

    db.all(itemsQuery, [id], (err, items) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Get approval history
      const approvalsQuery = `
        SELECT ra.*, 
               u.username as approver_name,
               ws.step_order,
               ws.approver_role
        FROM requisition_approvals ra
        LEFT JOIN users u ON ra.approver_id = u.id
        LEFT JOIN workflow_steps ws ON ra.workflow_step_id = ws.id
        WHERE ra.requisition_id = ?
        ORDER BY ra.approved_at
      `;

      db.all(approvalsQuery, [id], (err, approvals) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        // Get workflow steps
        const workflowQuery = `
          SELECT ws.*, 
                 COUNT(ra.id) as approval_count
          FROM workflow_steps ws
          LEFT JOIN requisition_approvals ra ON ws.id = ra.workflow_step_id AND ra.requisition_id = ?
          WHERE ws.workflow_id = ?
          GROUP BY ws.id
          ORDER BY ws.step_order
        `;

        db.all(workflowQuery, [id, requisition.workflow_id], (err, workflowSteps) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({
            ...requisition,
            items,
            approvals,
            workflowSteps
          });
        });
      });
    });
  });
});

// Create new requisition
router.post('/', (req, res) => {
  const { 
    title, 
    description, 
    department, 
    priority, 
    justification, 
    required_date, 
    workflow_id,
    items 
  } = req.body;
  const { db } = req.app.locals;

  if (!title || !items || items.length === 0) {
    return res.status(400).json({ error: 'Title and items are required' });
  }

  const requisition_number = generateRequisitionNumber();
  
  // Calculate total estimated cost
  const total_estimated_cost = items.reduce((sum, item) => 
    sum + (item.quantity_requested * (item.estimated_unit_cost || 0)), 0
  );

  // Start transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Insert requisition
    const insertRequisition = `
      INSERT INTO requisitions (
        requisition_number, title, description, requested_by, department, 
        priority, workflow_id, total_estimated_cost, justification, required_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(insertRequisition, [
      requisition_number, title, description, req.user.id, department,
      priority || 'medium', workflow_id || 1, total_estimated_cost, justification, required_date
    ], function(err) {
      if (err) {
        db.run('ROLLBACK');
        return res.status(400).json({ error: 'Failed to create requisition' });
      }

      const requisitionId = this.lastID;

      // Insert items
      let itemsInserted = 0;
      const insertItem = `
        INSERT INTO requisition_items (
          requisition_id, inventory_id, item_name, item_description, 
          quantity_requested, unit_id, estimated_unit_cost, total_estimated_cost, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      items.forEach(item => {
        const itemTotalCost = item.quantity_requested * (item.estimated_unit_cost || 0);
        
        db.run(insertItem, [
          requisitionId, item.inventory_id, item.item_name, item.item_description,
          item.quantity_requested, item.unit_id, item.estimated_unit_cost, itemTotalCost, item.notes
        ], (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(400).json({ error: 'Failed to add requisition items' });
          }

          itemsInserted++;
          if (itemsInserted === items.length) {
            db.run('COMMIT');
            
            logUserActivity(db, req.user.id, 'create', 
              `Created requisition: ${requisition_number}`, 
              `${items.length} items, Total: $${total_estimated_cost}`, req);
            
            res.json({ 
              message: 'Requisition created successfully', 
              id: requisitionId,
              requisition_number 
            });
          }
        });
      });
    });
  });
});

// Submit requisition for approval
router.post('/:id/submit', (req, res) => {
  const { id } = req.params;
  const { db } = req.app.locals;

  // Check if user owns this requisition
  db.get('SELECT * FROM requisitions WHERE id = ? AND requested_by = ?', [id, req.user.id], (err, requisition) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!requisition) {
      return res.status(404).json({ error: 'Requisition not found or access denied' });
    }

    if (requisition.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft requisitions can be submitted' });
    }

    // Update status to submitted
    db.run(`
      UPDATE requisitions 
      SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP, current_step = 1
      WHERE id = ?
    `, [id], function(err) {
      if (err) {
        return res.status(400).json({ error: 'Failed to submit requisition' });
      }

      logUserActivity(db, req.user.id, 'update', 
        `Submitted requisition: ${requisition.requisition_number}`, 
        'Status changed to submitted', req);

      res.json({ message: 'Requisition submitted successfully' });
    });
  });
});

// Approve/Reject requisition
router.post('/:id/approve', (req, res) => {
  const { id } = req.params;
  const { action, comments } = req.body; // 'approved', 'rejected', 'returned'
  const { db } = req.app.locals;

  if (!['approved', 'rejected', 'returned'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  // Get requisition and current workflow step
  const query = `
    SELECT r.*, ws.id as workflow_step_id, ws.step_order, ws.approver_role,
           (SELECT COUNT(*) FROM workflow_steps WHERE workflow_id = r.workflow_id) as total_steps
    FROM requisitions r
    LEFT JOIN workflow_steps ws ON r.workflow_id = ws.workflow_id AND ws.step_order = r.current_step
    WHERE r.id = ?
  `;

  db.get(query, [id], (err, requisition) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!requisition) {
      return res.status(404).json({ error: 'Requisition not found' });
    }

    // Check if user has permission to approve at this step
    if (requisition.approver_role !== req.user.role && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to approve this requisition' });
    }

    if (!['submitted', 'pending_approval'].includes(requisition.status)) {
      return res.status(400).json({ error: 'Requisition is not in a state that can be approved' });
    }

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Record the approval/rejection
      db.run(`
        INSERT INTO requisition_approvals (requisition_id, workflow_step_id, approver_id, action, comments)
        VALUES (?, ?, ?, ?, ?)
      `, [id, requisition.workflow_step_id, req.user.id, action, comments], function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(400).json({ error: 'Failed to record approval' });
        }

        let newStatus = requisition.status;
        let newStep = requisition.current_step;

        if (action === 'approved') {
          if (requisition.current_step >= requisition.total_steps) {
            // Final approval
            newStatus = 'approved';
            db.run(`
              UPDATE requisitions 
              SET status = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `, [newStatus, id]);
          } else {
            // Move to next step
            newStep = requisition.current_step + 1;
            newStatus = 'pending_approval';
            db.run(`
              UPDATE requisitions 
              SET status = ?, current_step = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `, [newStatus, newStep, id]);
          }
        } else if (action === 'rejected') {
          newStatus = 'rejected';
          db.run(`
            UPDATE requisitions 
            SET status = ?, rejected_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [newStatus, id]);
        } else if (action === 'returned') {
          newStatus = 'draft';
          newStep = 1;
          db.run(`
            UPDATE requisitions 
            SET status = ?, current_step = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [newStatus, newStep, id]);
        }

        db.run('COMMIT');

        logUserActivity(db, req.user.id, 'update', 
          `${action.charAt(0).toUpperCase() + action.slice(1)} requisition: ${requisition.requisition_number}`, 
          comments || `Action: ${action}`, req);

        res.json({ 
          message: `Requisition ${action} successfully`,
          newStatus,
          newStep
        });
      });
    });
  });
});

// Get requisitions pending approval for current user
router.get('/pending/approval', (req, res) => {
  const { db } = req.app.locals;
  
  const query = `
    SELECT r.*, 
           u.username as requested_by_name,
           ws.step_order,
           ws.approver_role,
           COUNT(ri.id) as item_count,
           SUM(ri.total_estimated_cost) as calculated_total_cost
    FROM requisitions r
    LEFT JOIN users u ON r.requested_by = u.id
    LEFT JOIN workflow_steps ws ON r.workflow_id = ws.workflow_id AND ws.step_order = r.current_step
    LEFT JOIN requisition_items ri ON r.id = ri.requisition_id
    WHERE r.status IN ('submitted', 'pending_approval')
    AND ws.approver_role = ?
    AND NOT EXISTS (
      SELECT 1 FROM requisition_approvals ra 
      WHERE ra.requisition_id = r.id 
      AND ra.workflow_step_id = ws.id 
      AND ra.approver_id = ?
    )
    GROUP BY r.id
    ORDER BY r.priority DESC, r.created_at ASC
  `;

  db.all(query, [req.user.role, req.user.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Update requisition (only draft status)
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, department, priority, justification, required_date, items } = req.body;
  const { db } = req.app.locals;

  // Check if user owns this requisition and it's in draft status
  db.get('SELECT * FROM requisitions WHERE id = ? AND requested_by = ? AND status = ?', 
    [id, req.user.id, 'draft'], (err, requisition) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!requisition) {
      return res.status(404).json({ error: 'Requisition not found or cannot be edited' });
    }

    // Calculate new total
    const total_estimated_cost = items ? items.reduce((sum, item) => 
      sum + (item.quantity_requested * (item.estimated_unit_cost || 0)), 0
    ) : requisition.total_estimated_cost;

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Update requisition
      db.run(`
        UPDATE requisitions 
        SET title = ?, description = ?, department = ?, priority = ?, 
            justification = ?, required_date = ?, total_estimated_cost = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [title, description, department, priority, justification, required_date, total_estimated_cost, id], (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(400).json({ error: 'Failed to update requisition' });
        }

        if (items) {
          // Delete existing items
          db.run('DELETE FROM requisition_items WHERE requisition_id = ?', [id], (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(400).json({ error: 'Failed to update items' });
            }

            // Insert new items
            let itemsInserted = 0;
            const insertItem = `
              INSERT INTO requisition_items (
                requisition_id, inventory_id, item_name, item_description, 
                quantity_requested, unit_id, estimated_unit_cost, total_estimated_cost, notes
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            items.forEach(item => {
              const itemTotalCost = item.quantity_requested * (item.estimated_unit_cost || 0);
              
              db.run(insertItem, [
                id, item.inventory_id, item.item_name, item.item_description,
                item.quantity_requested, item.unit_id, item.estimated_unit_cost, itemTotalCost, item.notes
              ], (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(400).json({ error: 'Failed to update requisition items' });
                }

                itemsInserted++;
                if (itemsInserted === items.length) {
                  db.run('COMMIT');
                  
                  logUserActivity(db, req.user.id, 'update', 
                    `Updated requisition: ${requisition.requisition_number}`, 
                    `${items.length} items, Total: $${total_estimated_cost}`, req);
                  
                  res.json({ message: 'Requisition updated successfully' });
                }
              });
            });
          });
        } else {
          db.run('COMMIT');
          
          logUserActivity(db, req.user.id, 'update', 
            `Updated requisition: ${requisition.requisition_number}`, 
            'Basic details updated', req);
          
          res.json({ message: 'Requisition updated successfully' });
        }
      });
    });
  });
});

// Delete requisition (only draft status)
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const { db } = req.app.locals;

  // Check if user owns this requisition and it's in draft status
  db.get('SELECT * FROM requisitions WHERE id = ? AND requested_by = ? AND status = ?', 
    [id, req.user.id, 'draft'], (err, requisition) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!requisition) {
      return res.status(404).json({ error: 'Requisition not found or cannot be deleted' });
    }

    // Delete requisition (items will be deleted by CASCADE)
    db.run('DELETE FROM requisitions WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Delete failed' });
      }

      logUserActivity(db, req.user.id, 'delete', 
        `Deleted requisition: ${requisition.requisition_number}`, null, req);

      res.json({ message: 'Requisition deleted successfully' });
    });
  });
});

// Get dashboard stats for requisitions
router.get('/stats/dashboard', (req, res) => {
  const { db } = req.app.locals;
  
  const stats = {};

  // Get total requisitions
  db.get('SELECT COUNT(*) as total FROM requisitions', [], (err, result) => {
    stats.totalRequisitions = result?.total || 0;

    // Get pending approvals for current user
    const pendingQuery = `
      SELECT COUNT(*) as total FROM requisitions r
      LEFT JOIN workflow_steps ws ON r.workflow_id = ws.workflow_id AND ws.step_order = r.current_step
      WHERE r.status IN ('submitted', 'pending_approval')
      AND ws.approver_role = ?
      AND NOT EXISTS (
        SELECT 1 FROM requisition_approvals ra 
        WHERE ra.requisition_id = r.id 
        AND ra.workflow_step_id = ws.id 
        AND ra.approver_id = ?
      )
    `;

    db.get(pendingQuery, [req.user.role, req.user.id], (err, result) => {
      stats.pendingApprovals = result?.total || 0;

      // Get user's requisitions
      db.get('SELECT COUNT(*) as total FROM requisitions WHERE requested_by = ?', [req.user.id], (err, result) => {
        stats.myRequisitions = result?.total || 0;

        // Get approved this month
        db.get(`
          SELECT COUNT(*) as total FROM requisitions 
          WHERE status = 'approved' 
          AND approved_at >= date('now', 'start of month')
        `, [], (err, result) => {
          stats.approvedThisMonth = result?.total || 0;

          res.json(stats);
        });
      });
    });
  });
});

export default router;