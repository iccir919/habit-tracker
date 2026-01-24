import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { habitService } from '../services/habitService';
import { useAuth } from '../hooks/useAuth';
import './Dashboard.css'

function Dashboard() {
    const { user } = useAuth();
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
    }

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
                    <h1>Welcome, {user.name}! 👋</h1>
                    <p>
                        {habits.length === 0
                            ? "Let's create your first habit to get started" :
                            `You have ${habits.length} habit${habits.length > 1 ? 's' : ''}`
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
                    <h2>No Habits Yet</h2>
                    <p>Create your first habit to start tracking your progress</p>
                    <Link to="/habits" className="btn btn-primary">
                        Create Habit
                    </Link>
                </div>
            ) : (
                <div className="habits-grid">
                    {habits.map(habit => (
                        <div key={habit._id} className="habit-card" style={{ borderLeftColor: habit.color }}>
                            <div className="habit-header">
                                <span className="habit-icon">{habit.icon || '⭐'}</span>
                                <span className="habit-type-badge">
                                    {habit.tracking_type === 'completion' ? '✓ Completion' : '⏱️ Duration' }
                                </span>
                            </div>
                            <h3>{habit.name}</h3>
                            {habit.description && <p className="habit-description">{habit.description}</p>}
                            {habit.tracking_type === 'duration' && (
                                <p className="habit-target">Target: {habit.target_duration}</p>
                            )}
                            <div className="habit-meta">
                                <span>📅 {habit.frequency}</span>
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