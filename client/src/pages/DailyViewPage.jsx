import { useState, useEffect } from 'react';
import { logService } from '../services/logService';
import { timeEntryService } from '../services/timeEntryService';
import HabitLogEntry from '../components/logs/HabitLogEntry.jsx';
import TimeCalendar from '../components/calendar/TimeCalendar.jsx';
import { formatDate, getToday, addDays, isToday, toDateString } from '../utils/dateHelpers';
import './DailyViewPage.css';

function DailyViewPage() {
  const [currentDate, setCurrentDate] = useState(getToday());
  const [allHabits, setAllHabits] = useState([]);
  const [habits, setHabits] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDailySummary();
  }, [currentDate]);

  const loadDailySummary = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await logService.getDailySummary(toDateString(currentDate));
      
      setAllHabits(data.habits || []);
      
      // Show all habits (no day filtering with weekly goals)
      setHabits(data.habits || []);

      // Load all time entries for duration habits
      await loadTimeEntries(data.habits || []);
    } catch (err) {
      setError(err.message || 'Failed to load habits');
    } finally {
      setLoading(false);
    }
  };

  const loadTimeEntries = async (habitsList) => {
    try {
      const allEntries = [];
      
      // Get time entries for each duration habit that has a log
      for (const habit of habitsList) {
        if (habit.tracking_type === 'duration' && habit.log?.id) {
          const entries = await timeEntryService.getTimeEntries(habit.log.id);
          allEntries.push(...entries);
        }
      }
      
      setTimeEntries(allEntries);
    } catch (err) {
      console.error('Failed to load time entries:', err);
    }
  };

  const handlePreviousDay = () => {
    setCurrentDate(addDays(currentDate, -1));
  };

  const handleNextDay = () => {
    setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(getToday());
  };

  const handleUpdateLog = async (habitId, logData) => {
    try {
      if (logData) {
        await logService.upsertLog(habitId, {
          date: toDateString(currentDate),
          ...logData
        });
      }
      
      await loadDailySummary();
    } catch (err) {
      alert(err.message || 'Failed to update log');
    }
  };

  const handleCalendarUpdate = async () => {
    await loadDailySummary();
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading daily view...</div>
      </div>
    );
  }

  const completionHabits = habits.filter(h => h.tracking_type === 'completion');
  const durationHabits = habits.filter(h => h.tracking_type === 'duration');

  return (
    <div className="container">
      <div className="daily-view-header">
        <h1>Daily Tracker</h1>
        
        <div className="date-navigation">
          <button className="btn btn-secondary" onClick={handlePreviousDay}>
            ← Previous
          </button>
          
          <div className="current-date">
            <div className="date-display">{formatDate(currentDate)}</div>
            {!isToday(currentDate) && (
              <button className="btn-link" onClick={handleToday}>
                Jump to Today
              </button>
            )}
          </div>
          
          <button 
            className="btn btn-secondary" 
            onClick={handleNextDay}
            disabled={isToday(currentDate)}
          >
            Next →
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={loadDailySummary} className="btn btn-secondary btn-sm">
            Retry
          </button>
        </div>
      )}

      {habits.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h2>No habits yet</h2>
          <p>Create your first habit to start tracking</p>
          <a href="/habits" className="btn btn-primary">
            Create Habit
          </a>
        </div>
      ) : (
        <div className="daily-view-content">
          {/* Left Column - Habits List */}
          <div className="habits-column">
            <h2 className="column-title">Habits</h2>
            
            {completionHabits.length > 0 && (
              <div className="habits-section">
                <h3 className="section-subtitle">Completion Habits</h3>
                <div className="habits-list">
                  {completionHabits.map((habit) => (
                    <HabitLogEntry
                      key={habit.id}
                      habit={habit}
                      log={habit.log}
                      date={currentDate}
                      onUpdate={handleUpdateLog}
                      onRefresh={loadDailySummary}
                    />
                  ))}
                </div>
              </div>
            )}

            {durationHabits.length > 0 && (
              <div className="habits-section">
                <h3 className="section-subtitle">Duration Habits</h3>
                <div className="habits-list">
                  {durationHabits.map((habit) => (
                    <HabitLogEntry
                      key={habit.id}
                      habit={habit}
                      log={habit.log}
                      date={currentDate}
                      onUpdate={handleUpdateLog}
                      onRefresh={loadDailySummary}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Time Calendar */}
          {durationHabits.length > 0 && (
            <div className="calendar-column">
              <TimeCalendar
                date={toDateString(currentDate)}
                habits={habits}
                timeEntries={timeEntries}
                onUpdate={handleCalendarUpdate}
              />
            </div>
          )}
        </div>
      )}

      <div className="daily-summary">
        <div className="summary-stat">
          <span className="stat-label">Completed:</span>
          <span className="stat-value">
            {habits.filter(h => h.log?.completed === true || h.log?.completed === 1).length} / {habits.length}
          </span>
        </div>
        {habits.some(h => h.tracking_type === 'duration') && (
          <div className="summary-stat">
            <span className="stat-label">Total Time:</span>
            <span className="stat-value">
              {habits.reduce((sum, h) => sum + (h.log?.duration || 0), 0)} min
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default DailyViewPage;