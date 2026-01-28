const { getDB } = require('../db/database');

// Get user statistics
exports.getUserStats = (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.id;
    
    // Get total habits
    const totalHabits = db.prepare(`
      SELECT COUNT(*) as count FROM habits WHERE user_id = ? AND active = 1
    `).get(userId).count;
    
    // Get total logs (all time)
    const totalLogs = db.prepare(`
      SELECT COUNT(*) as count FROM habit_logs WHERE user_id = ?
    `).get(userId).count;
    
    // Get completion rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    const completionStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed
      FROM habit_logs
      WHERE user_id = ? AND date >= ?
    `).get(userId, thirtyDaysAgoStr);
    
    const completionRate = completionStats.total > 0 
      ? Math.round((completionStats.completed / completionStats.total) * 100)
      : 0;
    
    // Get current streaks for each habit
    const habits = db.prepare(`
      SELECT id, name, icon FROM habits WHERE user_id = ? AND active = 1
    `).all(userId);
    
    const streaks = habits.map(habit => {
      const streak = calculateStreak(db, habit.id);
      return {
        habitId: habit.id,
        habitName: habit.name,
        habitIcon: habit.icon,
        currentStreak: streak.current,
        longestStreak: streak.longest
      };
    });
    
    // Get total time logged (for duration habits)
    const totalMinutes = db.prepare(`
      SELECT SUM(duration) as total
      FROM habit_logs
      WHERE user_id = ?
    `).get(userId).total || 0;
    
    res.json({
      totalHabits,
      totalLogs,
      completionRate,
      totalMinutes,
      totalHours: Math.round(totalMinutes / 60),
      streaks: streaks.sort((a, b) => b.currentStreak - a.currentStreak)
    });
  } catch (err) {
    console.error('Get user stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Helper function to calculate streak
function calculateStreak(db, habitId) {
  // Get all completed logs ordered by date descending
  const logs = db.prepare(`
    SELECT date, completed
    FROM habit_logs
    WHERE habit_id = ?
    ORDER BY date DESC
  `).all(habitId);
  
  if (logs.length === 0) {
    return { current: 0, longest: 0 };
  }
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let expectedDate = new Date();
  expectedDate.setHours(0, 0, 0, 0);
  
  for (const log of logs) {
    const logDate = new Date(log.date);
    logDate.setHours(0, 0, 0, 0);
    
    // Check if this log is for the expected date
    if (logDate.getTime() === expectedDate.getTime()) {
      if (log.completed === 1) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        // Move to previous day
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        // Not completed, break current streak
        if (currentStreak === 0) {
          currentStreak = tempStreak;
        }
        tempStreak = 0;
        expectedDate.setDate(expectedDate.getDate() - 1);
      }
    } else if (logDate.getTime() < expectedDate.getTime()) {
      // Gap in dates, break streak
      if (currentStreak === 0) {
        currentStreak = tempStreak;
      }
      tempStreak = 0;
      // Continue from this date
      expectedDate = new Date(logDate);
      expectedDate.setDate(expectedDate.getDate() - 1);
      
      if (log.completed === 1) {
        tempStreak = 1;
      }
    }
  }
  
  // If we finished the loop, the temp streak is the current streak
  if (currentStreak === 0) {
    currentStreak = tempStreak;
  }
  
  return { current: currentStreak, longest: longestStreak };
}

// Get habit-specific stats
exports.getHabitStats = (req, res) => {
  try {
    const { habitId } = req.params;
    const db = getDB();
    
    // Verify habit belongs to user
    const habit = db.prepare(`
      SELECT * FROM habits WHERE id = ? AND user_id = ?
    `).get(habitId, req.user.id);
    
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    // Get total completions
    const totalCompletions = db.prepare(`
      SELECT COUNT(*) as count
      FROM habit_logs
      WHERE habit_id = ? AND completed = 1
    `).get(habitId).count;
    
    // Get streak
    const streak = calculateStreak(db, habitId);
    
    // Get completion rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    const recentStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed
      FROM habit_logs
      WHERE habit_id = ? AND date >= ?
    `).get(habitId, thirtyDaysAgoStr);
    
    const completionRate = recentStats.total > 0
      ? Math.round((recentStats.completed / recentStats.total) * 100)
      : 0;
    
    // Get last 7 days of data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
    
    const recentLogs = db.prepare(`
      SELECT date, completed, duration
      FROM habit_logs
      WHERE habit_id = ? AND date >= ?
      ORDER BY date DESC
    `).all(habitId, sevenDaysAgoStr);
    
    res.json({
      habitName: habit.name,
      totalCompletions,
      currentStreak: streak.current,
      longestStreak: streak.longest,
      completionRate,
      recentLogs
    });
  } catch (err) {
    console.error('Get habit stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};