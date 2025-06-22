import express from 'express';

const router = express.Router();

// Get dashboard stats
router.get('/stats', (req, res) => {
  const { db } = req.app.locals;
  const stats = {};

  // Get total items
  db.get('SELECT COUNT(*) as total FROM inventory', [], (err, result) => {
    stats.totalItems = result?.total || 0;

    // Get low stock items
    db.get('SELECT COUNT(*) as total FROM inventory WHERE quantity <= min_quantity', [], (err, result) => {
      stats.lowStockItems = result?.total || 0;

      // Get total value
      db.get('SELECT SUM(total_value) as total FROM inventory', [], (err, result) => {
        stats.totalValue = result?.total || 0;

        // Get categories count
        db.get('SELECT COUNT(*) as total FROM categories', [], (err, result) => {
          stats.totalCategories = result?.total || 0;

          res.json(stats);
        });
      });
    });
  });
});

export default router;