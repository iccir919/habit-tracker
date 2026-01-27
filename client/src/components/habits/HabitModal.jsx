import { useState, useEffect } from 'react';
import './HabitModal.css';

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
];

function HabitModal({ isOpen, onClose, onSave, habit }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trackingType: 'completion',
    targetDuration: '',
    targetDays: [],
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
        targetDays: habit.target_days || [],
        category: habit.category || '',
        color: habit.color || '#3b82f6',
        icon: habit.icon || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        trackingType: 'completion',
        targetDuration: '',
        targetDays: [],
        category: '',
        color: '#3b82f6',
        icon: ''
      });
    }
  }, [habit, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDayToggle = (day) => {
    setFormData(prev => {
      const targetDays = prev.targetDays.includes(day)
        ? prev.targetDays.filter(d => d !== day)
        : [...prev.targetDays, day];
      
      return {
        ...prev,
        targetDays
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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

  const isDaily = formData.targetDays.length === 0;

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
              required
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
                <label htmlFor="targetDuration">Target Duration (minutes) *</label>
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

        <div className="form-group">
            <label>Schedule</label>
                {formData.targetDays.length === 0 ? (
                    <p className="form-hint">
                    This habit will show <strong>every day</strong>. Select specific days below to customize.
                    </p>
                ) : (
                    <p className="form-hint">
                    This habit will show on:{' '}
                    {formData.targetDays
                        .map(d => <strong key={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</strong>)
                        .reduce((prev, curr) => [prev, ', ', curr])
                    }
                    </p>
                )}
            <div className="days-selector">
                {DAYS_OF_WEEK.map(day => (
                <button
                    key={day.value}
                    type="button"
                    className={`day-btn ${formData.targetDays.includes(day.value) ? 'selected' : ''}`}
                    onClick={() => handleDayToggle(day.value)}
                >
                    {day.label.substring(0, 3)}
                </button>
                ))}
            </div>
        </div>

          <div className="form-row">
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
                maxLength="2"
              />
            </div>
          </div>

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