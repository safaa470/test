import express from 'express';
import { logUserActivity } from '../utils/activityLogger.js';

const router = express.Router();

// Get all units
router.get('/', (req, res) => {
  const { db } = req.app.locals;
  
  const query = `
    SELECT u.*, bu.name as base_unit_name, bu.abbreviation as base_unit_abbr
    FROM units u
    LEFT JOIN units bu ON u.base_unit_id = bu.id
    ORDER BY u.unit_type, u.name
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Create unit
router.post('/', (req, res) => {
  const { name, abbreviation, unit_type, base_unit_id, conversion_factor } = req.body;
  const { db } = req.app.locals;

  db.run('INSERT INTO units (name, abbreviation, unit_type, base_unit_id, conversion_factor) VALUES (?, ?, ?, ?, ?)',
    [name, abbreviation, unit_type || 'general', base_unit_id || null, conversion_factor || 1],
    function(err) {
      if (err) {
        return res.status(400).json({ error: 'Unit creation failed' });
      }
      
      logUserActivity(db, req.user.id, 'create', `Created unit: ${name} (${abbreviation})`, 
        `Type: ${unit_type}`, req);
      
      res.json({ message: 'Unit created successfully', id: this.lastID });
    }
  );
});

// Update unit
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, abbreviation, unit_type, base_unit_id, conversion_factor } = req.body;
  const { db } = req.app.locals;

  db.run('UPDATE units SET name = ?, abbreviation = ?, unit_type = ?, base_unit_id = ?, conversion_factor = ? WHERE id = ?',
    [name, abbreviation, unit_type || 'general', base_unit_id || null, conversion_factor || 1, id],
    function(err) {
      if (err) {
        return res.status(400).json({ error: 'Unit update failed' });
      }
      
      logUserActivity(db, req.user.id, 'update', `Updated unit: ${name} (${abbreviation})`, 
        `Type: ${unit_type}`, req);
      
      res.json({ message: 'Unit updated successfully' });
    }
  );
});

// Delete unit
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const { db } = req.app.locals;

  // Get unit info for logging
  db.get('SELECT name, abbreviation FROM units WHERE id = ?', [id], (err, unit) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Check if unit is used in inventory
    db.get('SELECT COUNT(*) as count FROM inventory WHERE base_unit_id = ? OR issue_unit_id = ?', [id, id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (result.count > 0) {
        return res.status(400).json({ error: 'Cannot delete unit used in inventory items' });
      }

      // Delete unit
      db.run('DELETE FROM units WHERE id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Delete failed' });
        }
        
        if (unit) {
          logUserActivity(db, req.user.id, 'delete', `Deleted unit: ${unit.name} (${unit.abbreviation})`, null, req);
        }
        
        res.json({ message: 'Unit deleted successfully' });
      });
    });
  });
});

// Unit conversion
router.get('/convert/:fromId/:toId/:quantity', (req, res) => {
  const { fromId, toId, quantity } = req.params;
  const { db } = req.app.locals;

  if (fromId === toId) {
    return res.json({ convertedQuantity: parseFloat(quantity) });
  }

  // Get both units with their base unit information
  const query = `
    SELECT u1.id as from_id, u1.name as from_name, u1.unit_type as from_type,
           u1.base_unit_id as from_base_id, u1.conversion_factor as from_factor,
           u2.id as to_id, u2.name as to_name, u2.unit_type as to_type,
           u2.base_unit_id as to_base_id, u2.conversion_factor as to_factor
    FROM units u1, units u2
    WHERE u1.id = ? AND u2.id = ?
  `;

  db.get(query, [fromId, toId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!result) {
      return res.status(404).json({ error: 'Units not found' });
    }

    // Check if units are of the same type or compatible
    if (result.from_type !== result.to_type && 
        result.from_type !== 'general' && result.to_type !== 'general') {
      return res.status(400).json({ error: 'Cannot convert between different unit types' });
    }

    let convertedQuantity = parseFloat(quantity);

    // If both units have the same base unit, convert directly
    if (result.from_base_id === result.to_base_id) {
      convertedQuantity = (convertedQuantity * result.from_factor) / result.to_factor;
    } else {
      // More complex conversion logic would go here
      // For now, we'll handle simple cases
      return res.status(400).json({ error: 'Complex unit conversion not supported yet' });
    }

    res.json({ convertedQuantity: Math.round(convertedQuantity * 1000000) / 1000000 });
  });
});

// Get compatible units
router.get('/compatible/:unitId', (req, res) => {
  const { unitId } = req.params;
  const { db } = req.app.locals;

  const query = `
    SELECT u1.unit_type
    FROM units u1
    WHERE u1.id = ?
  `;

  db.get(query, [unitId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!result) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    // Get all units of the same type
    const compatibleQuery = `
      SELECT u.*, bu.name as base_unit_name
      FROM units u
      LEFT JOIN units bu ON u.base_unit_id = bu.id
      WHERE u.unit_type = ? OR u.unit_type = 'general'
      ORDER BY u.name
    `;

    db.all(compatibleQuery, [result.unit_type], (err, compatibleUnits) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(compatibleUnits);
    });
  });
});

export default router;