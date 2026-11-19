const SkeletonLoader = ({ type = "card", count = 3 }) => {
  const items = Array.from({ length: count }, (_, i) => i);

  if (type === "card") {
    return (
      <div className="skeleton-grid">
        {items.map((i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton skeleton--sm" />
            <div className="skeleton skeleton--lg" />
            <div className="skeleton skeleton--md" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "table") {
    return (
      <div className="skeleton-table">
        {items.map((i) => (
          <div key={i} className="skeleton-row">
            <div className="skeleton skeleton--xs" />
            <div className="skeleton skeleton--md" />
            <div className="skeleton skeleton--sm" />
            <div className="skeleton skeleton--sm" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "stats") {
    return (
      <div className="skeleton-stats">
        {items.map((i) => (
          <div key={i} className="skeleton-stat">
            <div className="skeleton skeleton--circle" />
            <div className="skeleton skeleton--lg" />
            <div className="skeleton skeleton--sm" />
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default SkeletonLoader;
