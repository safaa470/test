import express from 'express';
import DatabaseMigrator from '../database/migrator.js';
import { logUserActivity } from '../utils/activityLogger.js';

const router = express.Router();

// Get database status
router.get('/status', async (req, res) => {
  try {
    const { db } = req.app.locals;
    const migrator = new DatabaseMigrator(db);
    const status = await migrator.getMigrationStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get database status' });
  }
});

// Run migrations
router.post('/migrate', async (req, res) => {
  try {
    const { db } = req.app.locals;
    const migrator = new DatabaseMigrator(db);
    await migrator.runMigrations();
    
    logUserActivity(db, req.user.id, 'system', 'Database migration executed', null, req);
    
    res.json({ message: 'Migrations completed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Migration failed: ' + error.message });
  }
});

// Create migration
router.post('/create-migration', (req, res) => {
  const { name, description } = req.body;
  const { db } = req.app.locals;
  
  if (!name) {
    return res.status(400).json({ error: 'Migration name is required' });
  }

  try {
    const migrator = new DatabaseMigrator(db);
    const filename = migrator.createMigration(name, description || '');
    
    logUserActivity(db, req.user.id, 'system', `Created migration: ${filename}`, description, req);
    
    res.json({ message: 'Migration file created', filename });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create migration: ' + error.message });
  }
});

export default router;