import './StatsCard.css';

function StatsCard({ icon, label, value, suffix = '', color = '#3b82f6' }) {
  return (
    <div className="stats-card" style={{ borderTopColor: color }}>
      <div className="stats-icon" style={{ backgroundColor: `${color}20`, color }}>
        {icon}
      </div>
      <div className="stats-content">
        <div className="stats-value">
          {value}{suffix}
        </div>
        <div className="stats-label">{label}</div>
      </div>
    </div>
  );
}

export default StatsCard;