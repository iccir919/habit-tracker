import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { habitService } from '../services/habitService';
import { useAuth } from '../hooks/useAuth';
import './Dashboard.css';

function Dashboard() {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      setLoading(true);
      const data = await habitService.getHabits();
      setHabits(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatSchedule = (targetDays) => {
    if (!targetDays || targetDays.length === 0) {
      return 'Every day';
    }
    
    if (targetDays.length === 7) {
      return 'Every day';
    }
    
    const dayNames = {
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun'
    };
    
    return targetDays.map(d => dayNames[d]).join(', ');
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading your habits...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {user?.name}! 👋</h1>
          <p className="dashboard-subtitle">
            {habits.length === 0 
              ? "Let's create your first habit to get started"
              : `You have ${habits.length} active habit${habits.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
        <Link to="/habits" className="btn btn-primary">
          Manage Habits
        </Link>
      </div>

      {error && <div className="error">{error}</div>}

      {habits.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h2>No habits yet</h2>
          <p>Create your first habit to start tracking your progress</p>
          <Link to="/habits" className="btn btn-primary">
            Create Habit
          </Link>
        </div>
      ) : (
        <div className="habits-grid">
          {habits.map((habit) => (
            <div key={habit.id} className="habit-card" style={{ borderLeftColor: habit.color }}>
              <div className="habit-header">
                <span className="habit-icon">{habit.icon || '⭐'}</span>
                <span className="habit-type-badge">
                  {habit.tracking_type === 'completion' ? '✓ Completion' : '⏱️ Duration'}
                </span>
              </div>
              <h3>{habit.name}</h3>
              {habit.description && <p className="habit-description">{habit.description}</p>}
              {habit.tracking_type === 'duration' && (
                <p className="habit-target">Target: {habit.target_duration} minutes</p>
              )}
              <div className="habit-meta">
                <span>📅 {formatSchedule(habit.target_days)}</span>
                {habit.category && <span>🏷️ {habit.category}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;