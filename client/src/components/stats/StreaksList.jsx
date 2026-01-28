import './StreaksList.css';

function StreaksList({ streaks }) {
  if (!streaks || streaks.length === 0) {
    return (
      <div className="streaks-empty">
        <p>Start completing habits to build streaks! 🔥</p>
      </div>
    );
  }

  return (
    <div className="streaks-list">
      <h3 className="streaks-title">Current Streaks 🔥</h3>
      <div className="streaks-items">
        {streaks.slice(0, 5).map((streak) => (
          <div key={streak.habitId} className="streak-item">
            <div className="streak-info">
              <span className="streak-icon">{streak.habitIcon || '⭐'}</span>
              <span className="streak-name">{streak.habitName}</span>
            </div>
            <div className="streak-stats">
              <div className="streak-current">
                <span className="streak-number">{streak.currentStreak}</span>
                <span className="streak-label">days</span>
              </div>
              {streak.longestStreak > streak.currentStreak && (
                <div className="streak-longest">
                  <span className="streak-best-label">Best:</span>
                  <span className="streak-best-number">{streak.longestStreak}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StreaksList;