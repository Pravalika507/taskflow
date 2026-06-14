import { useCountUp } from '../hooks/useCountUp';

const CARDS = (stats) => [
  { label: 'Total tasks', value: stats?.total ?? 0, color: '#2563eb', bg: '#dbeafe' },
  { label: 'Pending',     value: stats?.pending ?? 0, color: '#d97706', bg: '#fef3c7' },
  { label: 'Completed',   value: stats?.completed ?? 0, color: '#16a34a', bg: '#dcfce7' },
  { label: 'Overdue',     value: stats?.overdue ?? 0, color: '#dc2626', bg: '#fee2e2' },
];

function StatCard({ card, delay }) {
  const count = useCountUp(card.value, 850);
  return (
    <div
      className="stat-card"
      style={{ '--stat-color': card.color, '--stat-bg': card.bg, animationDelay: `${delay}s` }}
    >
      <div className="stat-card-value">{count}</div>
      <div className="stat-card-label">{card.label}</div>
    </div>
  );
}

export default function StatsCards({ stats, loading }) {
  const cards = CARDS(stats);

  if (loading) {
    return (
      <div className="stats-grid">
        {[0,1,2,3].map(i => (
          <div key={i} className="stat-card">
            <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 10, marginBottom: 14 }} />
            <div className="skeleton" style={{ height: 34, width: 52, borderRadius: 6, marginBottom: 6 }} />
            <div className="skeleton" style={{ height: 10, width: 72, borderRadius: 4 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="stats-grid">
      {cards.map((card, i) => (
        <StatCard key={card.label} card={card} delay={0.06 + i * 0.08} />
      ))}
    </div>
  );
}
