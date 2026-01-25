import { useState, useEffect } from 'react';
// import './HabitModal.css';

function HabitModal({ isOpen, onClose, onSave, habit}) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        trackingType: 'completion',
        targetDuration: '',
        frequency: 'daily',
        category: '',
        color: '#3b82f6',
        icon: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (habit) {
            setFormData({
                name: habit.name || '',
                description: habit.description || '',
                trackingType: habit.tracking_type || 'completion',
                targetDuration: habit.target_duration || '',
                frequency: habit.frequency || 'daily',
                category: habit.category || '',
                color: habit.color || '#3b82f6',
                icon: habit.icon || ''
            })
        } else {
            setFormData({
                name: '',
                description: '',
                trackingType: 'completion',
                targetDuration: '',
                frequency: 'daily',
                category: '',
                color: '#3b82f6',
                icon: ''
            })
        }
    }, [habit, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.name.trim()) {
            setError('Name is required');
            return;
        }

        if (formData.trackingType === 'duration' && !formData.targetDuration) {
            setError('Target duration is required for duration habits');
            return;
        }

        setLoading(true);

        try {
            await onSave(formData);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to save habit');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{habit ? 'Edit Habit' : 'Create New Habit'}</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="habit-form">
                    <div className="form-group">
                        <label htmlFor="name">Habit Name *</label>
                        <input 
                            id="name"
                            name="name"
                            type="text"
                            className="input"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g., Morning Exercise"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea 
                            id="description"
                            name="description"
                            className="input"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Optional description"
                            rows="3"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="trackingType">Tracking Type *</label>
                            <select
                                id="trackingType"
                                name="trackingType"
                                className="input"
                                value={formData.trackingType}
                                onChange={handleChange}
                            >
                                <option value="completion">Completion (Yes/No)</option>
                                <option value="duration">Duration (Minutes)</option>  
                            </select>
                        </div>

                        {formData.trackingType === 'duration' && (
                            <div className="form-group">
                                <label htmlFor="targetDuration">Target Duration (min) *</label>
                                <input 
                                    id="targetDuration"
                                    name="targetDuration"
                                    type="number"
                                    className="input"
                                    value={formData.targetDuration}
                                    onChange={handleChange}
                                    min="1"
                                    placeholder="30"
                                    required={formData.trackingType === 'duration'}
                                />
                            </div>
                        )}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="frequency">Frequency</label>
                            <select
                                id="frequency"
                                name="frequency"
                                className="input"
                                value={formData.frequency}
                                onChange={handleChange}
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="category">Category</label>
                            <input
                                id="category"
                                name="category"
                                type="text"
                                className="input"
                                value={formData.category}
                                onChange={handleChange}
                                placeholder="e.g., Health, Learning"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="color">Color</label>
                            <input 
                                id="color"
                                name="color"
                                type="color"
                                className="input color-input"
                                value={formData.color}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="icon">Icon (Emoji)</label>
                            <input 
                                id="icon"
                                name="icon"
                                type="text"
                                className="input"
                                value={formData.icon}
                                onChange={handleChange}
                                placeholder="📚 💪 🎯"
                                maxLength={2}
                            />
                        </div>
                    </div>

                    {error && <div className="error">{error}</div>}

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : habit ? 'Update Habit' : 'Create Habit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default HabitModal;