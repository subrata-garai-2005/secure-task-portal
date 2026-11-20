import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

const StatsCard = ({ label, value, icon, color = "#4880FF", trend, trendText, delay = 0 }) => {
  const isUp = trend >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      className="stats-card"
    >
      <div className="stats-card__content">
        <span className="stats-card__label">{label}</span>
        <span className="stats-card__value">{value}</span>
        {trend !== undefined && (
          <div className="stats-card__trend-row">
            <span className={`stats-card__trend ${isUp ? "stats-card__trend--up" : "stats-card__trend--down"}`}>
              {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {isUp ? "+" : ""}{trend}%
            </span>
            <span className="stats-card__trend-text">
              {trendText || (isUp ? "Up from yesterday" : "Down from yesterday")}
            </span>
          </div>
        )}
      </div>

      <div
        className="stats-card__icon"
        style={{
          backgroundColor: `${color}18`,
          color: color,
        }}
      >
        {icon}
      </div>
    </motion.div>
  );
};

export default StatsCard;
