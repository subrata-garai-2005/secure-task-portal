import { motion } from "framer-motion";

const StatsCard = ({ label, value, icon, color = "#10b981", trend, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="stats-card"
    >
      <div className="stats-card__icon" style={{ backgroundColor: `${color}15`, color }}>
        {icon}
      </div>
      <div className="stats-card__content">
        <span className="stats-card__value" style={{ color }}>{value}</span>
        <span className="stats-card__label">{label}</span>
        {trend !== undefined && (
          <span className={`stats-card__trend ${trend >= 0 ? "stats-card__trend--up" : "stats-card__trend--down"}`}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default StatsCard;
