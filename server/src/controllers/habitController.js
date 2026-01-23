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
            frequency = 'daily',
            targetDays = [],
            targetCount = null,
            category = '',
            color = '#3b82f6',
            icon = ''
        } = req.body;

        const stmt = db.prepare(`
            INSERT INTO habits (
                user_id, name, description, tracking_type, target_duration,
                frequency, target_days, target_count, category, color, icon
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            req.user.id,
            name,
            description,
            trackingType,
            targetDuration,
            frequency,
            JSON.stringify(targetDays),
            targetCount,
            category,
            color,
            icon
        );

        const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(result.lastInsertRowid);

        habit.target_days = JSON.parse(habit.target_days);

        res.status(201).json(habit);
    } catch (err) {
        console.error('Error creating habit:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getHabits = (req, res) => {
    try {
        const db = getDB();
        const active = req.query.arctive !== 'false' ? 1 : 0;
        const archived = req.query.archived === 'true' ? 1 : 0;

        const habits = db.prepare(`
            SELECT * FROM habits
            WHERE user_id = ? AND active = ? and archived = ?
            ORDER BY created_at DESC
        `).all(req.user.id, active, archived);

        habits.forEach(habit => {
            habit.target_days = JSON.parse(habit.target_days);
        });

        res.json(habits);
    } catch (err) {
        console.error('Get habits error', err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getHabit = (req, res) => {
    try {
        const db = getDB();
        const habit = db.prepare(`
            SELECT * FROM habits
            WHERE id = ? AND user_id = ?
        `).get(req.params.habitId, req.user.id);

        if (!habit) {
            return res.status(404).json({ error: 'Habit not found' });
        }

        habit.target_days = JSON.parse(habit.target_days);
        
        res.json(habit);
    } catch (err) {
        console.error('Get habit error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateHabit = (req, res) => {
    try {
        const db = getDB();
        const {
            name,
            description,
            trackingType,
            targetDuration,
            frequency,
            targetDays,
            targetCount,
            category,
            color,
            icon,
            active,
            archived
        } = req.body;

        // Build dynamic update query based on provided fields
        const updates = [];
        const values = [];

        if (name !== undefined) { updates.push('name = ?'); values.push(name); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (trackingType !== undefined) { updates.push('tracking_type = ?'); values.push(trackingType); }
        if (targetDuration !== undefined) { updates.push('target_duration = ?'); values.push(targetDuration); }
        if (frequency !== undefined) { updates.push('frequency = ?'); values.push(frequency); }
        if (targetDays !== undefined) { updates.push('target_days = ?'); values.push(JSON.stringify(targetDays)); }
        if (targetCount !== undefined) { updates.push('target_count = ?'); values.push(targetCount); }
        if (category !== undefined) { updates.push('category = ?'); values.push(category); }
        if (color !== undefined) { updates.push('color = ?'); values.push(color); }
        if (icon !== undefined) { updates.push('icon = ?'); values.push(icon); }
        if (active !== undefined) { updates.push('active = ?'); values.push(active ? 1 : 0); }
        if (archived !== undefined) { updates.push('archived = ?'); values.push(archived ? 1 : 0); }

        updates.push('updated_at = CURRENT_TIMESTAMP');

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(req.params.id, req.user.id);

        const stmt = db.prepare(`
            UPDATE habits
            SET ${updates.join(', ')}
            WHERE id = ? AND user_id = ?
        `);

        const result = stmt.run(...values);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Habit not found' });
        }

        const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id);
        habit.target_days = JSON.parse(habit.target_days);

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

        // Delete associated logs (CASCADE should handle this, but explicit is good)
        db.prepare(`
            DELETE FROM habit_logs
            WHERE habit_id = ?
        `).run(req.params.id);

        res.json({ message: 'Habit deleted successfully' });
    } catch (err) {
        console.error('Delete habit error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};