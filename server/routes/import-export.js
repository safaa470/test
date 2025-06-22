import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import createCsvWriter from 'csv-writer';
import fs from 'fs';
import { logUserActivity } from '../utils/activityLogger.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Export inventory to CSV
router.get('/inventory/export', (req, res) => {
  const { db } = req.app.locals;
  
  const query = `
    SELECT i.name, i.sku, i.description, c.name as category, 
           bu.name as base_unit, iu.name as issue_unit,
           l.name as location, s.name as supplier, i.quantity, i.min_quantity,
           i.max_quantity, i.unit_price, i.last_purchase_price, i.average_price, i.total_value
    FROM inventory i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN units bu ON i.base_unit_id = bu.id
    LEFT JOIN units iu ON i.issue_unit_id = iu.id
    LEFT JOIN locations l ON i.location_id = l.id
    LEFT JOIN suppliers s ON i.supplier_id = s.id
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const csvWriter = createCsvWriter.createObjectCsvWriter({
      path: 'exports/inventory.csv',
      header: [
        { id: 'name', title: 'Name' },
        { id: 'sku', title: 'SKU' },
        { id: 'description', title: 'Description' },
        { id: 'category', title: 'Category' },
        { id: 'base_unit', title: 'Base Unit' },
        { id: 'issue_unit', title: 'Issue Unit' },
        { id: 'location', title: 'Location' },
        { id: 'supplier', title: 'Supplier' },
        { id: 'quantity', title: 'Quantity' },
        { id: 'min_quantity', title: 'Min Quantity' },
        { id: 'max_quantity', title: 'Max Quantity' },
        { id: 'unit_price', title: 'Current Price' },
        { id: 'last_purchase_price', title: 'Last Purchase Price' },
        { id: 'average_price', title: 'Average Price' },
        { id: 'total_value', title: 'Total Value' }
      ]
    });

    if (!fs.existsSync('exports')) {
      fs.mkdirSync('exports');
    }

    csvWriter.writeRecords(rows)
      .then(() => {
        logUserActivity(db, req.user.id, 'export', 'Exported inventory to CSV', 
          `${rows.length} items exported`, req);
        res.download('exports/inventory.csv', 'inventory.csv');
      })
      .catch(error => {
        res.status(500).json({ error: 'Export failed' });
      });
  });
});

// Import inventory from CSV
router.post('/inventory/import', upload.single('file'), (req, res) => {
  const { db } = req.app.locals;
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const results = [];
  const errors = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      let processed = 0;
      let imported = 0;

      results.forEach((row, index) => {
        const { name, sku, description, quantity, unit_price } = row;
        
        if (!name || !sku) {
          errors.push(`Row ${index + 1}: Name and SKU are required`);
          processed++;
          return;
        }

        const total_value = (quantity || 0) * (unit_price || 0);
        const last_purchase_price = unit_price || 0;
        const average_price = unit_price || 0;

        db.run(`INSERT OR IGNORE INTO inventory (name, sku, description, quantity, unit_price, last_purchase_price, average_price, total_value) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [name, sku, description || '', quantity || 0, unit_price || 0, last_purchase_price, average_price, total_value],
          function(err) {
            if (err) {
              errors.push(`Row ${index + 1}: ${err.message}`);
            } else if (this.changes > 0) {
              imported++;
            }
            processed++;

            if (processed === results.length) {
              fs.unlinkSync(req.file.path); // Clean up uploaded file
              
              logUserActivity(db, req.user.id, 'import', 'Imported inventory from CSV', 
                `${imported} items imported, ${errors.length} errors`, req);
              
              res.json({
                message: `Import completed. ${imported} items imported.`,
                errors: errors
              });
            }
          }
        );
      });
    });
});

export default router;