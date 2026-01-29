const { getDB } = require('../db/database');
const { validationResult } = require('express-validator');

exports.createHabit = async (req, res) => {
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
    
    const result = await db.query(
      `INSERT INTO habits (
        user_id, name, description, tracking_type, target_duration,
        target_days, category, color, icon
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        req.user.id,
        name,
        description,
        trackingType,
        targetDuration,
        JSON.stringify(targetDays),
        category,
        color,
        icon
      ]
    );
    
    const habit = result.rows[0];
    
    if (habit.target_days) {
      habit.target_days = JSON.parse(habit.target_days);
    }
    
    res.status(201).json(habit);
  } catch (err) {
    console.error('Create habit error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getHabits = async (req, res) => {
  try {
    const db = getDB();
    const result = await db.query(
      `SELECT * FROM habits
       WHERE user_id = $1 AND active = true
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    
    const habits = result.rows;
    
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

exports.getHabit = async (req, res) => {
  try {
    const db = getDB();
    const result = await db.query(
      'SELECT * FROM habits WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    
    const habit = result.rows[0];
    
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

exports.updateHabit = async (req, res) => {
  try {
    const db = getDB();
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    const allowedFields = ['name', 'description', 'trackingType', 'targetDuration', 'targetDays', 'category', 'color', 'icon', 'active'];
    
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updates.push(`${dbKey} = $${paramCount}`);
        
        if (key === 'targetDays') {
          values.push(JSON.stringify(req.body[key]));
        } else {
          values.push(req.body[key]);
        }
        paramCount++;
      }
    });
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(req.params.id);
    values.push(req.user.id);
    
    const result = await db.query(
      `UPDATE habits SET ${updates.join(', ')}
       WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
       RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    const habit = result.rows[0];
    
    if (habit.target_days) {
      habit.target_days = JSON.parse(habit.target_days);
    }
    
    res.json(habit);
  } catch (err) {
    console.error('Update habit error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteHabit = async (req, res) => {
  try {
    const db = getDB();
    
    const result = await db.query(
      'DELETE FROM habits WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    res.json({ message: 'Habit deleted successfully' });
  } catch (err) {
    console.error('Delete habit error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};