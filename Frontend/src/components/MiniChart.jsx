const MiniChart = ({ data = [], color = "#10b981", height = 60, type = "bar" }) => {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value), 1);

  if (type === "bar") {
    return (
      <div className="mini-chart mini-chart--bar" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="mini-chart__bar-wrapper" title={`${d.label}: ${d.value}`}>
            <div
              className="mini-chart__bar"
              style={{
                height: `${(d.value / max) * 100}%`,
                backgroundColor: color,
                opacity: 0.3 + (d.value / max) * 0.7,
              }}
            />
            {d.label && <span className="mini-chart__bar-label">{d.label}</span>}
          </div>
        ))}
      </div>
    );
  }

  // Donut chart
  if (type === "donut") {
    const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
    let offset = 0;
    const radius = 35;
    const circumference = 2 * Math.PI * radius;

    return (
      <div className="mini-chart mini-chart--donut">
        <svg width={height + 20} height={height + 20} viewBox="0 0 100 100">
          {data.map((d, i) => {
            const pct = d.value / total;
            const dashLength = pct * circumference;
            const gap = circumference - dashLength;
            const currentOffset = offset;
            offset += pct * circumference;

            return (
              <circle
                key={i}
                cx="50" cy="50" r={radius}
                fill="none"
                stroke={d.color || color}
                strokeWidth="8"
                strokeDasharray={`${dashLength} ${gap}`}
                strokeDashoffset={-currentOffset}
                strokeLinecap="round"
                opacity={0.85}
              />
            );
          })}
          <text x="50" y="48" textAnchor="middle" fontSize="14" fontWeight="700" className="mini-chart__donut-text">{total}</text>
          <text x="50" y="60" textAnchor="middle" fontSize="6" className="mini-chart__donut-sub">Total</text>
        </svg>
        <div className="mini-chart__legend">
          {data.map((d, i) => (
            <div key={i} className="mini-chart__legend-item">
              <span className="mini-chart__legend-dot" style={{ backgroundColor: d.color || color }} />
              <span>{d.label}: {d.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default MiniChart;
