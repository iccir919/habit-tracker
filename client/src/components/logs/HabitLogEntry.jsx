import { useState } from 'react';
import TimeEntryModal from './TimeEntryModal.jsx';
import './HabitLogEntry.css';

function HabitLogEntry({ habit, log, date, onUpdate, onRefresh }) {
  const [notes, setNotes] = useState(log?.notes || '');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

  const isCompleted = log?.completed === true || log?.completed === 1;
  const isCompletion = habit.tracking_type === 'completion';
  const isDuration = habit.tracking_type === 'duration';

  const handleToggleComplete = async () => {
    if (isSaving) return; // Prevent double-clicks
    setIsSaving(true);
    try {
      await onUpdate(habit.id, {
        completed: !isCompleted,
        duration: log?.duration || 0,
        notes: notes || ''
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotesBlur = async () => {
    if (notes === (log?.notes || '')) return;
    
    setIsSaving(true);
    try {
      await onUpdate(habit.id, {
        completed: isCompleted,
        duration: log?.duration || 0,
        notes: notes || ''
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className={`habit-log-entry ${isCompleted ? 'completed' : ''}`}>
        <div className="habit-log-main">
          <div className="habit-log-left">
            <div className="habit-icon">{habit.icon || '⭐'}</div>
            <div className="habit-info">
              <h3 className="habit-name">{habit.name}</h3>
              {habit.description && (
                <p className="habit-desc">{habit.description}</p>
              )}
              {isDuration && (
                <p className="habit-target">
                  {log?.duration || 0} / {habit.target_duration} min
                </p>
              )}
            </div>
          </div>

          <div className="habit-log-right">
            {isCompletion && (
              <button
                className={`checkbox-btn ${isCompleted ? 'checked' : ''}`}
                onClick={handleToggleComplete}
                disabled={isSaving}
              >
                {isCompleted ? '✓' : ''}
              </button>
            )}

            {isDuration && (
              <button
                className="btn btn-primary log-time-btn"
                onClick={() => setShowTimeModal(true)}
                disabled={isSaving}
              >
                Log Time
              </button>
            )}

            <button
              className="expand-btn"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="habit-log-expanded">
            <div className="form-group">
              <label>Notes</label>
              <textarea
                className="input notes-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleNotesBlur}
                placeholder="Add notes about today's progress..."
                rows="3"
                disabled={isSaving}
              />
            </div>
          </div>
        )}
      </div>

      {isDuration && showTimeModal && (
        <TimeEntryModal
          isOpen={showTimeModal}
          onClose={() => setShowTimeModal(false)}
          habit={habit}
          date={date}
          logId={log?.id}
          onUpdate={onRefresh}
        />
      )}
    </>
  );
}

export default HabitLogEntry;