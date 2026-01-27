import { useState, useEffect } from 'react';
import { logService } from '../services/logService';
import HabitLogEntry from '../components/logs/HabitLogEntry';
import { formatDate, getToday, addDays, isToday, toDateString } from '../utils/dateHelpers';
import './DailyViewPage.css';

function DailyViewPage() {
    const [currentDate, setCurrentDate] = useState(getToday());
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadDailySummary()
    }, [currentDate]);

    const loadDailySummary = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await logService.getDailySummary(toDateString(currentDate));
            setHabits(data.habits || []);
        } catch (err) {
            setError(err.message || 'Failed to load habits.');
        } finally {
            setLoading(false);
        }
    };

    const shouldShowHabit = (habit) => {
        // If no target_days specified (empty array), show every day
        if (!habit.target_days || habit.target_days.length === 0) {
            return true;
        }
        
        // If target_days specified, check if today is one of them
        const dayOfWeek = getDayOfWeek(currentDate);
        return habit.target_days.includes(dayOfWeek);
    };

    const handlePreviousDay = () => {
        setCurrentDate(addDays(currentDate, -1));
    };

    const handleNextDay = () => {
        setCurrentDate(addDays(currentDate, 1));
    };

    const handleToday = () => {
        setCurrentDate(getToday());
    }

    const handleUpdateLog = async (habitId, logData) => {
        try {
            await logService.updateLog(habitId, {
                date: toDateString(currentDate),
                ...logData,
            });
            await loadDailySummary();
        } catch (err) {
            alert(err.message || 'Failed to update log.');
        }
    };

    if (loading) {
        <div className="container">
            <div className="loading">Loading daily view...</div>
        </div>
    }

    return (
        <div className="container">
            <div className="daily-view-header">
                <h1>Daily Tacker</h1>

                <div className="date-navigation">
                    <button className="btn btn-secondary" onClick={handlePreviousDay}>
                        ← Previous
                    </button>

                    <div className="current-date">
                        <div className="date-display">{formatDate(currentDate)}</div>
                        {!isToday(currentDate) && (
                            <button className="btn btn-link" onClick={handleToday}>
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
                    <button onClick={loadDailySummary} className="btn btn-secondary">
                        Retry
                    </button>
                </div>
            )}

            {habits.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📝</div>
                    <h2>No habits to track</h2>
                    <p>Create your first habit to start tracking your progress.</p>
                    <a href="/habits" className="btn btn-primary">
                        Create a new habit
                    </a>
                </div>
            ) : (
                <div className="habits-list">
                    {habits.map((habit) => (
                        <HabitLogEntry
                            key={habit.id}
                            habit={habit}
                            log={habit.log}
                            onUpdate={handleUpdateLog}
                        />
                    ))}
                </div>
            )}

            <div className="daily-summary">
                <div className="summary-stat">
                    <span className="stat-label">Completed:</span>
                    <span className="stat-value">
                        {habits.filter(h => h.log?.completed === 1).length} / {habits.length}
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