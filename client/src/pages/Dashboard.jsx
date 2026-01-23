import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { habitService } from '../services/habitService';
import { useAuth } from "../hooks/useAuth";

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
                <h1>Welcome, {user.name}! 👋</h1>
                <p>
                    {habits.length === 0
                        ? "Let's create your first habit to get started" :
                        `You have ${habits.length} habit${habits.length > 1 ? 's' : ''}`
                    }
                </p>
            </div>

            {error && <div className="error">{error}</div>}

            {habits.length === 0 ? (
                <div className="empty-state">
                    
                </div>
            ) : (
                <div className="habits-grid">

                </div>
            )}
        </div>
    );
}

export default Dashboard;