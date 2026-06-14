export default function SkeletonLoader({ rows = 5 }) {
  return (
    <div className="skeleton-table">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-row">
          <div className="skeleton skeleton-title"></div>
          <div className="skeleton skeleton-badge"></div>
          <div className="skeleton skeleton-badge"></div>
          <div className="skeleton skeleton-date"></div>
          <div className="skeleton skeleton-actions"></div>
        </div>
      ))}
    </div>
  );
}
