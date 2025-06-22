import express from 'express';
import { logUserActivity } from '../utils/activityLogger.js';

const router = express.Router();

// Get all workflows
router.get('/', (req, res) => {
  const { db } = req.app.locals;
  
  const query = `
    SELECT w.*, 
           COUNT(ws.id) as step_count
    FROM approval_workflows w
    LEFT JOIN workflow_steps ws ON w.id = ws.workflow_id
    WHERE w.is_active = 1
    GROUP BY w.id
    ORDER BY w.name
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Database error in workflows:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get workflow with steps
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const { db } = req.app.locals;

  // Get workflow details
  const workflowQuery = `
    SELECT * FROM approval_workflows WHERE id = ?
  `;

  db.get(workflowQuery, [id], (err, workflow) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Get workflow steps
    const stepsQuery = `
      SELECT * FROM workflow_steps 
      WHERE workflow_id = ? 
      ORDER BY step_order
    `;

    db.all(stepsQuery, [id], (err, steps) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        ...workflow,
        steps
      });
    });
  });
});

// Create workflow
router.post('/', (req, res) => {
  const { name, description, steps } = req.body;
  const { db } = req.app.locals;

  if (!name || !steps || steps.length === 0) {
    return res.status(400).json({ error: 'Name and steps are required' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Insert workflow
    db.run(`INSERT INTO approval_workflows (name, description) VALUES (?, ?)`,
      [name, description],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(400).json({ error: 'Workflow creation failed' });
        }

        const workflowId = this.lastID;

        // Insert steps
        let stepsInserted = 0;
        const insertStep = `
          INSERT INTO workflow_steps (workflow_id, step_order, approver_role, required_approvers, is_parallel)
          VALUES (?, ?, ?, ?, ?)
        `;

        steps.forEach((step, index) => {
          db.run(insertStep, [
            workflowId, 
            step.step_order || (index + 1), 
            step.approver_role, 
            step.required_approvers || 1,
            step.is_parallel || 0
          ], (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(400).json({ error: 'Failed to create workflow steps' });
            }

            stepsInserted++;
            if (stepsInserted === steps.length) {
              db.run('COMMIT');
              
              logUserActivity(db, req.user.id, 'create', `Created workflow: ${name}`, 
                `${steps.length} steps`, req);
              
              res.json({ 
                message: 'Workflow created successfully', 
                id: workflowId 
              });
            }
          });
        });
      }
    );
  });
});

// Update workflow
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, is_active } = req.body;
  const { db } = req.app.locals;

  db.run('UPDATE approval_workflows SET name = ?, description = ?, is_active = ? WHERE id = ?',
    [name, description, is_active !== undefined ? is_active : 1, id],
    function(err) {
      if (err) {
        return res.status(400).json({ error: 'Workflow update failed' });
      }
      
      logUserActivity(db, req.user.id, 'update', `Updated workflow: ${name}`, null, req);
      
      res.json({ message: 'Workflow updated successfully' });
    }
  );
});

// Delete workflow
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const { db } = req.app.locals;

  // Get workflow info for logging
  db.get('SELECT name FROM approval_workflows WHERE id = ?', [id], (err, workflow) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Check if workflow is used in requisitions
    db.get('SELECT COUNT(*) as count FROM requisitions WHERE workflow_id = ?', [id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (result.count > 0) {
        return res.status(400).json({ error: 'Cannot delete workflow used in requisitions' });
      }

      // Delete workflow (steps will be deleted by CASCADE)
      db.run('DELETE FROM approval_workflows WHERE id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Delete failed' });
        }
        
        if (workflow) {
          logUserActivity(db, req.user.id, 'delete', `Deleted workflow: ${workflow.name}`, null, req);
        }
        
        res.json({ message: 'Workflow deleted successfully' });
      });
    });
  });
});

export default router;