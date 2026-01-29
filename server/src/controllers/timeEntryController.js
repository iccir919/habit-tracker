const { getDB } = require('../db/database');
const { validationResult } = require('express-validator');

// Helper to calculate duration in minutes
function calculateDuration(startTime, endTime) {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  const diffMs = end - start;
  return Math.round(diffMs / 1000 / 60);
}

// Helper to normalize date
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

// Add a time entry
exports.addTimeEntry = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { habitId, date } = req.params;
    const { startTime, endTime } = req.body;
    
    const db = getDB();
    const normalizedDate = normalizeDate(date);
    
    // Step 1: Verify habit exists and belongs to user
    const habitResult = await db.query(
      'SELECT * FROM habits WHERE id = $1 AND user_id = $2',
      [habitId, req.user.id]
    );
    
    const habit = habitResult.rows[0];
    
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    // Step 2: Get or create habit_log
    let logResult = await db.query(
      'SELECT * FROM habit_logs WHERE habit_id = $1 AND user_id = $2 AND date = $3',
      [habitId, req.user.id, normalizedDate]
    );
    
    let log = logResult.rows[0];
    
    if (!log) {
      const insertResult = await db.query(
        `INSERT INTO habit_logs (user_id, habit_id, date, completed, duration)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [req.user.id, habitId, normalizedDate, false, 0]
      );
      log = insertResult.rows[0];
    }
    
    // Step 3: Calculate duration
    const durationMinutes = calculateDuration(startTime, endTime);
    
    if (durationMinutes <= 0) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }
    
    // Step 4: Insert time entry
    const entryResult = await db.query(
      `INSERT INTO time_entries (habit_log_id, start_time, end_time, duration_minutes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [log.id, startTime, endTime, durationMinutes]
    );
    
    const entry = entryResult.rows[0];
    
    // Step 5: Calculate total duration for the day
    const totalResult = await db.query(
      'SELECT SUM(duration_minutes) as total FROM time_entries WHERE habit_log_id = $1',
      [log.id]
    );
    
    const totalDuration = totalResult.rows[0].total || 0;
    
    // Step 6: Check if completed
    const isCompleted = totalDuration >= (habit.target_duration || 0);
    
    // Step 7: Update habit_log
    await db.query(
      'UPDATE habit_logs SET duration = $1, completed = $2 WHERE id = $3',
      [totalDuration, isCompleted, log.id]
    );
    
    res.status(201).json({
      entry,
      totalDuration,
      isCompleted
    });
  } catch (err) {
    console.error('Add time entry error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get time entries for a specific log
exports.getTimeEntries = async (req, res) => {
  try {
    const { logId } = req.params;
    const db = getDB();
    
    // Verify log belongs to user
    const logResult = await db.query(
      'SELECT * FROM habit_logs WHERE id = $1 AND user_id = $2',
      [logId, req.user.id]
    );
    
    if (logResult.rows.length === 0) {
      return res.status(404).json({ error: 'Log not found' });
    }
    
    // Get all time entries for this log
    const entriesResult = await db.query(
      'SELECT * FROM time_entries WHERE habit_log_id = $1 ORDER BY start_time ASC',
      [logId]
    );
    
    res.json(entriesResult.rows);
  } catch (err) {
    console.error('Get time entries error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete a time entry
exports.deleteTimeEntry = async (req, res) => {
  try {
    const { entryId } = req.params;
    const db = getDB();
    
    // Get entry and verify ownership
    const entryResult = await db.query(
      `SELECT te.*, hl.user_id, hl.id as log_id, hl.habit_id
       FROM time_entries te
       JOIN habit_logs hl ON te.habit_log_id = hl.id
       WHERE te.id = $1`,
      [entryId]
    );
    
    const entry = entryResult.rows[0];
    
    if (!entry) {
      return res.status(404).json({ error: 'Time entry not found' });
    }
    
    if (entry.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Delete the entry
    await db.query('DELETE FROM time_entries WHERE id = $1', [entryId]);
    
    // Recalculate total duration
    const totalResult = await db.query(
      'SELECT SUM(duration_minutes) as total FROM time_entries WHERE habit_log_id = $1',
      [entry.log_id]
    );
    
    const totalDuration = totalResult.rows[0].total || 0;
    
    // Get habit to check target
    const habitResult = await db.query(
      'SELECT * FROM habits WHERE id = $1',
      [entry.habit_id]
    );
    
    const habit = habitResult.rows[0];
    const isCompleted = totalDuration >= (habit.target_duration || 0);
    
    // Update habit_log
    await db.query(
      'UPDATE habit_logs SET duration = $1, completed = $2 WHERE id = $3',
      [totalDuration, isCompleted, entry.log_id]
    );
    
    res.json({
      message: 'Time entry deleted',
      totalDuration,
      isCompleted
    });
  } catch (err) {
    console.error('Delete time entry error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};