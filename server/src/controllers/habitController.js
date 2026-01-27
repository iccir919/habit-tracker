const { getDB } = require('../db/database');
const { validationResult } = require('express-validator');

exports.createHabit = (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const db = getDB();
    const {
      name,
      description = '',
      trackingType,
      targetDuration = null,
      targetDays = [],
      category = '',
      color = '#3b82f6',
      icon = ''
    } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO habits (
        user_id, name, description, tracking_type, target_duration,
        target_days, category, color, icon
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      req.user.id,
      name,
      description,
      trackingType,
      targetDuration,
      JSON.stringify(targetDays),
      category,
      color,
      icon
    );
    
    const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(result.lastInsertRowid);
    
    if (habit.target_days) {
      habit.target_days = JSON.parse(habit.target_days);
    }
    
    res.status(201).json(habit);
  } catch (err) {
    console.error('Create habit error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getHabits = (req, res) => {
  try {
    const db = getDB();
    const habits = db.prepare(`
      SELECT * FROM habits
      WHERE user_id = ? AND active = 1
      ORDER BY created_at DESC
    `).all(req.user.id);
    
    // Parse target_days for each habit
    habits.forEach(habit => {
      if (habit.target_days) {
        habit.target_days = JSON.parse(habit.target_days);
      }
    });
    
    res.json(habits);
  } catch (err) {
    console.error('Get habits error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getHabit = (req, res) => {
  try {
    const db = getDB();
    const habit = db.prepare(`
      SELECT * FROM habits WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);
    
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    if (habit.target_days) {
      habit.target_days = JSON.parse(habit.target_days);
    }
    
    res.json(habit);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateHabit = (req, res) => {
  try {
    const db = getDB();
    const updates = [];
    const values = [];
    
    const allowedFields = ['name', 'description', 'trackingType', 'targetDuration', 'targetDays', 'category', 'color', 'icon', 'active'];
    
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updates.push(`${dbKey} = ?`);
        
        if (key === 'targetDays') {
          values.push(JSON.stringify(req.body[key]));
        } else {
          values.push(req.body[key]);
        }
      }
    });
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(req.params.id, req.user.id);
    
    const stmt = db.prepare(`
      UPDATE habits SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `);
    
    const result = stmt.run(...values);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id);
    
    if (habit.target_days) {
      habit.target_days = JSON.parse(habit.target_days);
    }
    
    res.json(habit);
  } catch (err) {
    console.error('Update habit error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteHabit = (req, res) => {
  try {
    const db = getDB();
    
    const stmt = db.prepare(`
      DELETE FROM habits
      WHERE id = ? AND user_id = ?
    `);
    
    const result = stmt.run(req.params.id, req.user.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    // Delete associated logs
    db.prepare('DELETE FROM habit_logs WHERE habit_id = ?').run(req.params.id);
    
    res.json({ message: 'Habit deleted successfully' });
  } catch (err) {
    console.error('Delete habit error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};