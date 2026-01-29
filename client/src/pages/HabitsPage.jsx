import { useState, useEffect } from 'react';
import { habitService } from '../services/habitService.js';
import HabitModal from '../components/habits/HabitModal.jsx';
import HabitCard from '../components/habits/HabitCard.jsx';
import './HabitsPage.css';

function HabitsPage() {
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHabit, setEditingHabit] = useState(null);

    useEffect(() => {
        loadHabits()
    }, []);

    const loadHabits = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await habitService.getHabits();
            setHabits(data);
        } catch (err) {
            setError(err.message || 'Failed to load habits');
        } finally {
            setLoading(false);
        }
    }

    const handleCreateNew = () => {
        setEditingHabit(null);
        setIsModalOpen(true);
    }

    const handleEdit = (habit) => {
        setEditingHabit(habit);
        setIsModalOpen(true);
    }

    const handleSave = async (formData) => {
        try {
            if (editingHabit) {
                // Update existing habit
                await habitService.updateHabit(editingHabit.id, formData)
            } else {
                // Create new habit
                await habitService.createHabit(formData);
            }
            await loadHabits();
            setIsModalOpen(false);
            setEditingHabit(null);
        } catch (err) {
            throw err; // Let modal handle the error
        }
    }

    const handleDelete = async (habit) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete ${habit.name}? This will also delete all logs for this habit.`
        )

        if (!confirmed) return;

        try {
            await habitService.deleteHabit(habit.id);
            await loadHabits();
        } catch (err) {
            alert(err.message || 'Failed to delete habit')
        }
    }

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingHabit(null);
    }

    if (loading) {
        return (
            <div className="container">
                <div className="loading">Loading habits...</div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="habits-page-header">
                <div>
                    <h1>My Habits</h1>
                    <p className="page-subtitle">
                        {habits.length === 0
                            ? "Create your first habit to get started"
                            : `Managing ${habits.length} habit${habits.length !== 1 ? 's' : ''}`
                        }
                    </p>
                </div>
                <button className="btn btn-primary" onClick={handleCreateNew}>
                    + Create Habit
                </button>
            </div>

            {error && (
                <div className="error-banner">
                    {error}
                    <button onClick={loadHabits} className="btn btn-secondary btn-sm">
                        Retry
                    </button>
                </div>
            )}

            {habits.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📝</div>
                    <h2>No Habits Yet</h2>
                    <p>Create your first habit to start tracking your progress</p>
                    <button className="btn btn-primary" onClick={handleCreateNew}>
                        Create Your First Habit
                    </button>
                </div>
            ) : (
                <div className="habits-grid">
                    {habits.map(habit => (
                        <HabitCard 
                            key={habit.id} 
                            habit={habit} 
                            onEdit={() => handleEdit(habit)}
                            onDelete={() => handleDelete(habit)}
                        />
                    ))}
                </div>
            )}

            <HabitModal 
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSave={handleSave}
                habit={editingHabit}
            />
        </div>
    );
}

export default HabitsPage;