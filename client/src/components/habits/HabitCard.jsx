
function HabitCard({ habit, onEdit, onDelete }) {
    return (
        <div className="habit-card" style={{ borderLeftColor: habit.color }}>
            <div className="habit-card-header">
                <div className="habit-icon">{habit.icon || '⭐'}</div>
                <div className="habit-actions">
                    <button
                        className="icon-btn"
                        onClick={() => onEdit(habit)}
                        title="Edit habit"
                    >
                        ✏️
                    </button>
                    <button
                        className="icon-btn delete-btn"
                        onClick={() => onDelete(habit)}
                        title="Delete habit"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            <h3 className="habit-name">{habit.name}</h3>

            {habit.description && (
                <p className="habit-description">{habit.description}</p>
            )}

            <div className="habit-details">
                <div className="habit-detail">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">
                        {habit.tracking_type === 'completion' ? '✓ Completion' : '⏱️ Duration'}
                    </span>
                </div>

                {habit.tracking_type === 'duration' && (
                    <div className="habit-detail">
                        <span className="detail-label">Target:</span>
                        <span className="detail-value">{habit.target_duration}</span>
                    </div>
                )}

                <div className="habit-detail">
                    <span className="detail-label">Frequency:</span>
                    <span className="detail-value">{habit.frequency}</span>
                </div>

                {habit.category && (
                    <div className="habit-detail">
                        <span className="detail-label">Category:</span>
                        <span className="detail-value">{habit.category}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default HabitCard;