const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const router = express.Router();

const dbPath = path.join(__dirname, '../database/warehouse.db');
const db = new Database(dbPath);

// Get all categories
router.get('/', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create new category
router.post('/', (req, res) => {
  try {
    const { name, parent_id, description } = req.body;
    
    const result = db.prepare(`
      INSERT INTO categories (name, parent_id, description)
      VALUES (?, ?, ?)
    `).run(name, parent_id || null, description || null);

    res.status(201).json({ 
      id: result.lastInsertRowid, 
      message: 'Category created successfully' 
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.put('/:id', (req, res) => {
  try {
    const { name, parent_id, description } = req.body;
    
    const result = db.prepare(`
      UPDATE categories 
      SET name = ?, parent_id = ?, description = ?
      WHERE id = ?
    `).run(name, parent_id || null, description || null, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;