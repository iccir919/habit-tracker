import { useState, useEffect } from 'react';
import { timeEntryService } from '../../services/timeEntryService';
import './TimeSlotModal.css';

function TimeSlotModal({ isOpen, onClose, habits, date, initialSlot, existingEntry, onUpdate }) {
  const [selectedHabit, setSelectedHabit] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingEntry) {
      // Editing existing entry
      const habit = habits.find(h => h.log?.id === existingEntry.habit_log_id);
      setSelectedHabit(habit?.id || '');
      setStartTime(existingEntry.start_time);
      setEndTime(existingEntry.end_time);
    } else if (initialSlot) {
      // Creating new entry from a time slot
      const slotTime = `${String(initialSlot.hour).padStart(2, '0')}:${String(initialSlot.minute).padStart(2, '0')}`;
      setStartTime(slotTime);
      
      // Default end time to 1 hour later
      const endHour = initialSlot.hour + 1;
      const endTimeStr = `${String(endHour).padStart(2, '0')}:${String(initialSlot.minute).padStart(2, '0')}`;
      setEndTime(endTimeStr);
      
      setSelectedHabit('');
    }
  }, [existingEntry, initialSlot, habits]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedHabit) {
      setError('Please select a habit');
      return;
    }

    if (!startTime || !endTime) {
      setError('Please enter both start and end times');
      return;
    }

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    if (end <= start) {
      setError('End time must be after start time');
      return;
    }

    setLoading(true);
    try {
      if (existingEntry) {
        // Delete old entry and create new one (simpler than updating)
        await timeEntryService.deleteTimeEntry(existingEntry.id);
      }
      
      await timeEntryService.addTimeEntry(selectedHabit, date, startTime, endTime);
      await onUpdate();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save time entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingEntry) return;
    
    if (!window.confirm('Delete this time entry?')) return;

    setLoading(true);
    try {
      await timeEntryService.deleteTimeEntry(existingEntry.id);
      await onUpdate();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete entry');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content time-slot-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{existingEntry ? 'Edit Time Entry' : 'Add Time Entry'}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="time-slot-form">
          <div className="form-group">
            <label htmlFor="habit">Habit</label>
            <select
              id="habit"
              className="input"
              value={selectedHabit}
              onChange={(e) => setSelectedHabit(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">Select a habit...</option>
              {habits.map(habit => (
                <option key={habit.id} value={habit.id}>
                  {habit.icon} {habit.name}
                </option>
              ))}
            </select>
          </div>

          <div className="time-inputs">
            <div className="form-group">
              <label htmlFor="startTime">Start Time</label>
              <input
                id="startTime"
                type="time"
                className="input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="endTime">End Time</label>
              <input
                id="endTime"
                type="time"
                className="input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <div className="modal-actions">
            {existingEntry && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </button>
            )}
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
              {loading ? 'Saving...' : existingEntry ? 'Update' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TimeSlotModal;