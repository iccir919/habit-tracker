const { getDB } = require('../db/database');

// Get user statistics
exports.getUserStats = async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.id;
    
    // Get total habits
    const totalHabitsResult = await db.query(
      'SELECT COUNT(*) as count FROM habits WHERE user_id = $1 AND active = true',
      [userId]
    );
    const totalHabits = parseInt(totalHabitsResult.rows[0].count);
    
    // Get total logs (all time)
    const totalLogsResult = await db.query(
      'SELECT COUNT(*) as count FROM habit_logs WHERE user_id = $1',
      [userId]
    );
    const totalLogs = parseInt(totalLogsResult.rows[0].count);
    
    // Get completion rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    const completionStatsResult = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN completed = true THEN 1 ELSE 0 END) as completed
       FROM habit_logs
       WHERE user_id = $1 AND date >= $2`,
      [userId, thirtyDaysAgoStr]
    );
    
    const completionStats = completionStatsResult.rows[0];
    const completionRate = completionStats.total > 0 
      ? Math.round((completionStats.completed / completionStats.total) * 100)
      : 0;
    
    // Get current streaks for each habit
    const habitsResult = await db.query(
      'SELECT id, name, icon FROM habits WHERE user_id = $1 AND active = true',
      [userId]
    );
    
    const habits = habitsResult.rows;
    
    const streaks = await Promise.all(habits.map(async (habit) => {
      const streak = await calculateStreak(db, habit.id);
      return {
        habitId: habit.id,
        habitName: habit.name,
        habitIcon: habit.icon,
        currentStreak: streak.current,
        longestStreak: streak.longest
      };
    }));
    
    // Get total time logged (for duration habits)
    const totalMinutesResult = await db.query(
      'SELECT SUM(duration) as total FROM habit_logs WHERE user_id = $1',
      [userId]
    );
    
    const totalMinutes = parseInt(totalMinutesResult.rows[0].total) || 0;
    
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
async function calculateStreak(db, habitId) {
  // Get all completed logs ordered by date descending
  const logsResult = await db.query(
    `SELECT date, completed
     FROM habit_logs
     WHERE habit_id = $1
     ORDER BY date DESC`,
    [habitId]
  );
  
  const logs = logsResult.rows;
  
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
      if (log.completed) {
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
      
      if (log.completed) {
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
exports.getHabitStats = async (req, res) => {
  try {
    const { habitId } = req.params;
    const db = getDB();
    
    // Verify habit belongs to user
    const habitResult = await db.query(
      'SELECT * FROM habits WHERE id = $1 AND user_id = $2',
      [habitId, req.user.id]
    );
    
    const habit = habitResult.rows[0];
    
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    // Get total completions
    const totalCompletionsResult = await db.query(
      'SELECT COUNT(*) as count FROM habit_logs WHERE habit_id = $1 AND completed = true',
      [habitId]
    );
    const totalCompletions = parseInt(totalCompletionsResult.rows[0].count);
    
    // Get streak
    const streak = await calculateStreak(db, habitId);
    
    // Get completion rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    const recentStatsResult = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN completed = true THEN 1 ELSE 0 END) as completed
       FROM habit_logs
       WHERE habit_id = $1 AND date >= $2`,
      [habitId, thirtyDaysAgoStr]
    );
    
    const recentStats = recentStatsResult.rows[0];
    const completionRate = recentStats.total > 0
      ? Math.round((recentStats.completed / recentStats.total) * 100)
      : 0;
    
    // Get last 7 days of data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
    
    const recentLogsResult = await db.query(
      `SELECT date, completed, duration
       FROM habit_logs
       WHERE habit_id = $1 AND date >= $2
       ORDER BY date DESC`,
      [habitId, sevenDaysAgoStr]
    );
    
    res.json({
      habitName: habit.name,
      totalCompletions,
      currentStreak: streak.current,
      longestStreak: streak.longest,
      completionRate,
      recentLogs: recentLogsResult.rows
    });
  } catch (err) {
    console.error('Get habit stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};