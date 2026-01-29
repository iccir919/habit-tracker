import { useState, useEffect } from 'react';
import { timeEntryService } from '../../services/timeEntryService.js';
import './TimeEntryModal.css';

function TimeEntryModal({ isOpen, onClose, habit, date, logId, onUpdate }) {
  const [entries, setEntries] = useState([]);
  const [currentLogId, setCurrentLogId] = useState(logId); // DEFINE THIS FIRST
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update currentLogId when logId prop changes
  useEffect(() => {
    setCurrentLogId(logId);
  }, [logId]);

  // Load entries when modal opens or logId changes
  useEffect(() => {
    if (isOpen && currentLogId) {
      loadEntries();
    } else if (isOpen) {
      setEntries([]);
    }
  }, [isOpen, currentLogId]);

  const loadEntries = async () => {
    if (!currentLogId) {
      setEntries([]);
      return;
    }

    try {
      const data = await timeEntryService.getTimeEntries(currentLogId);
      setEntries(data);
    } catch (err) {
      console.error('Failed to load entries:', err);
      setEntries([]);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    setError('');

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
      await timeEntryService.addTimeEntry(habit.id, date, startTime, endTime);
      
      setStartTime('');
      setEndTime('');
      
      await onUpdate();
      
      setTimeout(() => {
        if (currentLogId) {
          loadEntries();
        }
      }, 500);
      
    } catch (err) {
      console.error('Add entry error:', err);
      setError(err.message || 'Failed to add time entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Delete this time entry?')) return;

    try {
      await timeEntryService.deleteTimeEntry(entryId);
      await loadEntries();
      await onUpdate();
    } catch (err) {
      alert(err.message || 'Failed to delete entry');
    }
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const totalMinutes = entries.reduce((sum, e) => sum + e.duration_minutes, 0);
  const targetMinutes = habit.target_duration || 0;
  const progress = targetMinutes > 0 ? Math.round((totalMinutes / targetMinutes) * 100) : 0;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content time-entry-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{habit.icon} {habit.name}</h2>
            <p className="modal-subtitle">Log time entries</p>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="time-entry-content">
          {/* Progress Bar */}
          <div className="progress-section">
            <div className="progress-info">
              <span className="progress-label">
                {totalMinutes} / {targetMinutes} minutes
              </span>
              <span className="progress-percentage">{progress}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {/* Add Time Entry Form */}
          <form onSubmit={handleAddEntry} className="time-entry-form">
            <h3>Add Time Entry</h3>
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
                />
              </div>
            </div>

            {error && <div className="error">{error}</div>}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Entry'}
            </button>
          </form>

          {/* Time Entries List */}
          <div className="entries-list">
            <h3>Today's Entries ({entries.length})</h3>
            {entries.length === 0 ? (
              <p className="empty-message">
                {currentLogId ? 'No time entries yet. Add one above!' : 'Add your first time entry above'}
              </p>
            ) : (
              <div className="entries">
                {entries.map((entry) => (
                  <div key={entry.id} className="entry-item">
                    <div className="entry-time">
                      <span className="time-range">
                        {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                      </span>
                      <span className="duration">{entry.duration_minutes} min</span>
                    </div>
                    <button
                      className="delete-entry-btn"
                      onClick={() => handleDeleteEntry(entry.id)}
                      title="Delete entry"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimeEntryModal;