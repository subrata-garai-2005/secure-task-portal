import { motion } from "framer-motion";

const actionIcons = {
  LOGIN_SUCCESS: "🔓",
  FAILED_LOGIN: "🚫",
  REGISTER: "📝",
  CREATE_USER: "👤",
  UPDATE_USER: "✏️",
  SEARCH_USERS: "🔍",
  CREATE_TASK: "📋",
  UPDATE_TASK: "📝",
  DELETE_TASK: "🗑️",
  PASSWORD_CHANGED: "🔑",
  FAILED_PASSWORD_CHANGE: "⚠️",
  ATTACK_BLOCKED: "🛡️",
};

const getIcon = (action) => {
  for (const [key, icon] of Object.entries(actionIcons)) {
    if (action?.startsWith(key)) return icon;
  }
  return "📌";
};

const getColor = (action) => {
  if (action?.includes("ATTACK") || action?.includes("FAILED")) return "#ef4444";
  if (action?.includes("CREATE") || action?.includes("REGISTER")) return "#22c55e";
  if (action?.includes("UPDATE") || action?.includes("PASSWORD")) return "#3b82f6";
  if (action?.includes("DELETE")) return "#f97316";
  if (action?.includes("LOGIN")) return "#10b981";
  return "#6b7280";
};

const ActivityTimeline = ({ activities = [] }) => {
  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatAction = (action) => {
    if (!action) return "Unknown action";
    return action.replace(/_/g, " ").replace(/:/g, " → ");
  };

  return (
    <div className="activity-timeline">
      {activities.map((a, i) => {
        const color = getColor(a.action);
        return (
          <motion.div
            key={a._id || i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="activity-timeline__item"
          >
            <div className="activity-timeline__line" />
            <div className="activity-timeline__dot" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}40` }} />
            <div className="activity-timeline__content">
              <div className="activity-timeline__header">
                <span className="activity-timeline__icon">{getIcon(a.action)}</span>
                <span className="activity-timeline__action">{formatAction(a.action)}</span>
                <span className="activity-timeline__time">{formatTime(a.createdAt)}</span>
              </div>
              {a.detail && (
                <p className="activity-timeline__detail">{a.detail}</p>
              )}
              {a.ip && (
                <span className="activity-timeline__ip">IP: {a.ip}</span>
              )}
            </div>
          </motion.div>
        );
      })}

      {activities.length === 0 && (
        <div className="activity-timeline__empty">
          <span>No activity recorded yet</span>
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;
