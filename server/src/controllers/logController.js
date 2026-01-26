const { getDB } = require('../db/database');
const { validationResult } = require('express-validator');

// Helper function to normalize date to start of day
function normalizeDate(dateString) {
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
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

        const logs = await db.prepare(`
            SELECT * FROM habit_logs
            WHERE user_id = ? AND date = ?
        `).all(req.user.id, normalizedDate);

        res.json(logs)
    } catch (err) {
        console.error('Get logs by date error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get logs for a specific habit
exports.getHabitLogs = (req, res) => {
    try {
        const { habitId } = req.params;
        const { startDate, endDate, limit = 30 } = req.query;

        const db = getDB();
        let query = `
            SELECT * FROM habit_logs
            WHERE user_id = ? AND habit_id = ?
        `;
        const params = [habitId, req.user.id];

        if (startDate) {
            query += ' AND date >= ?';
            params.push(normalizeDate(startDate));
        }

        query += ' ORDER BY date DESC LIMIT ?';
        params.push(parseInt(limit));

        const logs = db.prepare(query).all(...params);

        res.json(logs);
    } catch (err) {
        console.error('Get habit logs error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create or update a log
exports.upsertLog = (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { habitId} = req.params;
        const { date, completed, duration, notes } = req.body;

        const normalizedDate = normalizeDate(date);
        const db = getDB();

        // Check if habit exists and belongs to user
        const habit = db.prepare(`
            SELECT * FROM habits WHERE id = ? AND user_id = ?
        `).get(habitId, req.user.id);

        if (!habit) {
            return res.status(404).json({ message: 'Habit not found' });
        }

        // Check if log already exists
        const existingLog = db.prepare(`
            SELECT * FROM habit_logs
            WHERE user_id = ? AND habit_id = ? AND date = ?
        `).get(habitId, req.user.id, normalizedDate);

        if (existingLog) {
            // Update existing log
            const stmt = db.prepare(`
                UPDATE habit_logs
                SET completed = ?, duration = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `);

            stmt.run(
                completed !== undefined ? (completed ? 1 : 0) : existingLog.completed,
                duration !== undefined ? duration : existingLog.duration,
                notes !== undefined ? notes : existingLog.notes,
                existingLog.id
            );

            const updatedLog = db.prepare(`SELECT * FROM habit_logs WHERE id = ?`).get(existingLog.id);

            res.json(updatedLog);
        } else {
            // Create new log
            const stmt = db.prepare(`
                INSERT INTO habit_logs (user_id, habit_id, date, completed, duration, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            const result = stmt.run(
                req.user.id,
                habitId,
                normalizedDate,
                completed ? 1 : 0,
                duration || 0,
                notes || null
            );

            const newLog = db.prepare(`SELECT * FROM habit_logs WHERE id = ?`).get(result.lastInsertRowid);

            res.status(201).json(newLog);
        }
    } catch (err) {
        console.error('Upsert log error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a log
exports.deleteLog = (req, res) => {
    try {
        const { habitId } = req.params;
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }

        const normalizedDate = normalizeDate(date);
        const db = getDB();

        const stmt = db.prepare(`
            DELETE FROM habit_logs
            WHERE user_id = ? AND habit_id = ? AND date = ?
        `);

        const result = stmt.run(habitId, req.user.id, normalizedDate);

        if (result.changes === 0) {
            res.status(404).json({ message: 'Log not found' });
        }

        res.json({ message: 'Log deleted successfully' });
    } catch (err) {
        console.error('Delete log error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get daily summary (all habits + their logs for a date)
exports.getDailySummary = (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }

        const normalizedDate = normalizeDate(date);
        const db = getDB();

        // Get all active habits
        const habits = db.prepare(`
            SELECT * FROM habits
            WHERE user_id = ? AND active = 1
            ORDER BY created_at ASC
        `).all(req.user.id);

        // Get all logs for this date
        const logs = db.prepare(`
            SELECT * FROM habit_logs
            WHERE user_id = ? AND date = ?
        `).all(req.user.id, normalizedDate);

        // Map logs by habit_id for easy lookup
        const logMap = {};
        logs.forEach(log => {
            logMap[log.habit_id] = log;
        });

        const summary = habits.map(habit => ({
            ...habit,
            log: logMap[habit.id] || null
        }));

        res.json({
            date: normalizeDate,
            habits: summary
        });
    } catch (err) {
        console.error('Get daily summary error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};