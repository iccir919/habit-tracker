const { getDB } = require('../db/database');

// Helper to calculate duration in minutes
function calculateDuration(startTime, endTime) {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  const diffMs = end - start;
  return Math.round(diffMs / 1000 / 60);
}

// Add a time entry
exports.addTimeEntry = (req, res) => {
  try {
    const { habitId, date } = req.params;
    const { startTime, endTime } = req.body;
    
    const db = getDB();
    
    // Normalize date
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

    const normalizedDate = normalizeDate(date);
    
    // Step 1: Verify habit exists and belongs to user
    const habit = db.prepare('SELECT * FROM habits WHERE id = ? AND user_id = ?').get(habitId, req.user.id);
    
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
  
    
    // Step 2: Get or create habit_log
    let log = db.prepare(`
      SELECT * FROM habit_logs WHERE habit_id = ? AND user_id = ? AND date = ?
    `).get(habitId, req.user.id, normalizedDate);
    
    if (!log) {
      const stmt = db.prepare(`
        INSERT INTO habit_logs (user_id, habit_id, date, completed, duration)
        VALUES (?, ?, ?, 0, 0)
      `);
      const result = stmt.run(req.user.id, habitId, normalizedDate);
      log = db.prepare('SELECT * FROM habit_logs WHERE id = ?').get(result.lastInsertRowid);
    } 
    
    // Step 3: Calculate duration
    const durationMinutes = calculateDuration(startTime, endTime);
    
    if (durationMinutes <= 0) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }
    
    // Step 4: Insert time entry
    const stmt = db.prepare(`
      INSERT INTO time_entries (habit_log_id, start_time, end_time, duration_minutes)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(log.id, startTime, endTime, durationMinutes);;
    
    // Step 5: Calculate total duration for the day
    const totalDuration = db.prepare(`
      SELECT SUM(duration_minutes) as total FROM time_entries WHERE habit_log_id = ?
    `).get(log.id).total;
    
    console.log('Total duration for day:', totalDuration);
    
    // Step 6: Check if completed (duration >= target)
    const isCompleted = totalDuration >= (habit.target_duration || 0);
    
    // Step 7: Update habit_log with new totals
    db.prepare(`
      UPDATE habit_logs SET duration = ?, completed = ? WHERE id = ?
    `).run(totalDuration, isCompleted ? 1 : 0, log.id);
    
    // Step 8: Return the created entry
    const entry = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(result.lastInsertRowid);
    
    
    res.status(201).json({
      entry,
      totalDuration,
      isCompleted
    });
  } catch (err) {
    console.error('ERROR adding time entry:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get time entries for a specific log
exports.getTimeEntries = (req, res) => {
  try {
    const { logId } = req.params;
    
    const db = getDB();
    
    // Verify log belongs to user
    const log = db.prepare(`
      SELECT * FROM habit_logs WHERE id = ? AND user_id = ?
    `).get(logId, req.user.id);
    
    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }
    
    
    // Get all time entries for this log
    const entries = db.prepare(`
      SELECT * FROM time_entries WHERE habit_log_id = ? ORDER BY start_time ASC
    `).all(logId);

    
    res.json(entries);
  } catch (err) {
    console.error('ERROR getting time entries:', err);
    res.status(500).json({ error: 'Server error' });
  }
};