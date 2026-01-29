import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsService } from '../services/statsService';
import { useAuth } from '../hooks/useAuth';
import StatsCard from '../components/stats/StatsCard';
import StreaksList from '../components/stats/StreaksList';
import './Dashboard.css';

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const statsData = await statsService.getUserStats();
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {user?.name}! 👋</h1>
          <p className="dashboard-subtitle">
            {stats?.totalHabits === 0 
              ? "Let's create your first habit to get started"
              : `Keep up the great work!`
            }
          </p>
        </div>
        <div className="dashboard-actions">
          <Link to="/today" className="btn btn-primary">
            Track Today
          </Link>
          <Link to="/habits" className="btn btn-secondary">
            Manage Habits
          </Link>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {stats && stats.totalHabits === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h2>No habits yet</h2>
          <p>Create your first habit to start tracking your progress and building streaks!</p>
          <Link to="/habits" className="btn btn-primary">
            Create Your First Habit
          </Link>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          {stats && (
            <div className="stats-grid">
              <StatsCard
                icon="✅"
                label="Today's Progress"
                value={`${stats.todayCompleted}/${stats.todayTotal}`}
                color="#10b981"
              />
              <StatsCard
                icon="📊"
                label="Active Habits"
                value={stats.totalHabits}
                color="#3b82f6"
              />
              <StatsCard
                icon="📝"
                label="Total Days Logged"
                value={stats.totalDays}
                color="#ec4899"
              />
            </div>
          )}

          {/* Streaks */}
          {stats && stats.streaks && stats.streaks.length > 0 && (
            <StreaksList streaks={stats.streaks} />
          )}

          {/* Quick Actions */}
          <div className="quick-actions">
            <h2 className="section-title">Quick Actions</h2>
            <div className="actions-grid">
              <Link to="/today" className="action-card">
                <div className="action-icon">📅</div>
                <h3>Log Today</h3>
                <p>Track your habits for today</p>
              </Link>
              <Link to="/habits" className="action-card">
                <div className="action-icon">⚙️</div>
                <h3>Manage Habits</h3>
                <p>Create, edit, or delete habits</p>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;