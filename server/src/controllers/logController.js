const { getDB } = require('../db/database');
const { validationResult } = require('express-validator');

// Helper function to normalize date to local timezone
function normalizeDate(dateString) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get all logs for a specific date
exports.getLogsByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const normalizedDate = normalizeDate(date);
    const db = getDB();

    const result = await db.query(
      'SELECT * FROM habit_logs WHERE user_id = $1 AND date = $2',
      [req.user.id, normalizedDate]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get logs by date error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get logs for a specific habit
exports.getHabitLogs = async (req, res) => {
  try {
    const { habitId } = req.params;
    const { startDate, endDate, limit = 30 } = req.query;

    const db = getDB();
    let query = `
      SELECT * FROM habit_logs
      WHERE user_id = $1 AND habit_id = $2
    `;
    const params = [req.user.id, habitId];
    let paramCount = 3;

    if (startDate) {
      query += ` AND date >= $${paramCount}`;
      params.push(normalizeDate(startDate));
      paramCount++;
    }

    query += ` ORDER BY date DESC LIMIT $${paramCount}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    res.json(result.rows);
  } catch (err) {
    console.error('Get habit logs error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create or update a log
exports.upsertLog = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { habitId } = req.params;
    const { date, completed, duration, notes } = req.body;

    const normalizedDate = normalizeDate(date);
    const db = getDB();

    // Check if habit exists and belongs to user
    const habitResult = await db.query(
      'SELECT * FROM habits WHERE id = $1 AND user_id = $2',
      [habitId, req.user.id]
    );

    if (habitResult.rows.length === 0) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Check if log already exists
    const existingLogResult = await db.query(
      'SELECT * FROM habit_logs WHERE user_id = $1 AND habit_id = $2 AND date = $3',
      [req.user.id, habitId, normalizedDate]
    );

    const existingLog = existingLogResult.rows[0];

    if (existingLog) {
      // Update existing log
      const result = await db.query(
        `UPDATE habit_logs
         SET completed = $1, duration = $2, notes = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [
          completed !== undefined ? completed : existingLog.completed,
          duration !== undefined ? duration : existingLog.duration,
          notes !== undefined ? notes : existingLog.notes,
          existingLog.id
        ]
      );

      res.json(result.rows[0]);
    } else {
      // Create new log
      const result = await db.query(
        `INSERT INTO habit_logs (user_id, habit_id, date, completed, duration, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          req.user.id,
          habitId,
          normalizedDate,
          completed || false,
          duration || 0,
          notes || null
        ]
      );

      res.status(201).json(result.rows[0]);
    }
  } catch (err) {
    console.error('Upsert log error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a log
exports.deleteLog = async (req, res) => {
  try {
    const { habitId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const normalizedDate = normalizeDate(date);
    const db = getDB();

    const result = await db.query(
      'DELETE FROM habit_logs WHERE user_id = $1 AND habit_id = $2 AND date = $3',
      [req.user.id, habitId, normalizedDate]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Log not found' });
    }

    res.json({ message: 'Log deleted successfully' });
  } catch (err) {
    console.error('Delete log error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get daily summary (all habits + their logs for a date)
exports.getDailySummary = async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    const normalizedDate = normalizeDate(date);
    const db = getDB();
    
    // Get all active habits
    const habitsResult = await db.query(
      'SELECT * FROM habits WHERE user_id = $1 AND active = true ORDER BY created_at ASC',
      [req.user.id]
    );
    
    const habits = habitsResult.rows;
    
    // Get all logs for this date
    const logsResult = await db.query(
      'SELECT * FROM habit_logs WHERE user_id = $1 AND date = $2',
      [req.user.id, normalizedDate]
    );
    
    const logs = logsResult.rows;
    
    // Create a map of logs by habit_id
    const logMap = {};
    logs.forEach(log => {
      logMap[log.habit_id] = log;
    });
    
    // Combine habits with their logs
    const summary = habits.map(habit => ({
      ...habit,
      log: logMap[habit.id] || null
    }));
    
    res.json({
      date: normalizedDate,
      habits: summary
    });
  } catch (err) {
    console.error('Get daily summary error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};