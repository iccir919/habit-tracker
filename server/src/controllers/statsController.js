const { getDB } = require('../db/database');

// Helper function to normalize date to local timezone
function normalizeDate(date) {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get user statistics
exports.getUserStats = async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.id;
    
    // Get total active habits
    const totalHabitsResult = await db.query(
      'SELECT COUNT(*) as count FROM habits WHERE user_id = $1 AND active = true',
      [userId]
    );
    const totalHabits = parseInt(totalHabitsResult.rows[0].count);
    
    // Get total days logged (unique dates where user logged anything)
    const totalDaysResult = await db.query(
      'SELECT COUNT(DISTINCT date) as count FROM habit_logs WHERE user_id = $1',
      [userId]
    );
    const totalDays = parseInt(totalDaysResult.rows[0].count);
    
    // Get today's progress (use local timezone)
    const today = normalizeDate(new Date());
    
    // Get all active habits
    const allHabitsResult = await db.query(
      'SELECT id, weekly_goal FROM habits WHERE user_id = $1 AND active = true',
      [userId]
    );
    
    const allHabits = allHabitsResult.rows;
    const todayTotal = allHabits.length;
    
    // Get completed habits for today
    const todayCompletedResult = await db.query(
      `SELECT COUNT(*) as count 
       FROM habit_logs 
       WHERE user_id = $1 
       AND date = $2 
       AND completed = true`,
      [userId, today]
    );
    
    const todayCompleted = parseInt(todayCompletedResult.rows[0].count);
    
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
    
    res.json({
      totalHabits,
      totalDays,
      todayTotal,
      todayCompleted,
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
    const thirtyDaysAgoStr = normalizeDate(thirtyDaysAgo);
    
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
    const sevenDaysAgoStr = normalizeDate(sevenDaysAgo);
    
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