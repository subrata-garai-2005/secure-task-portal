import { motion } from "framer-motion";
import {
  LogIn, ShieldAlert, FilePlus, FileEdit, Trash2, Key,
  UserPlus, Search, Activity, AlertOctagon, CheckCircle2
} from "lucide-react";
import { formatTimeAgo } from "../utils/date";

const getActionDetails = (action = "") => {
  if (action.startsWith("ATTACK_BLOCKED") || action.includes("FAILED")) {
    return {
      icon: ShieldAlert,
      color: "#FF5B5B",
      bg: "rgba(255, 91, 91, 0.15)",
    };
  }
  if (action.startsWith("CREATE_USER") || action.startsWith("REGISTER")) {
    return {
      icon: UserPlus,
      color: "#00B69B",
      bg: "rgba(0, 182, 155, 0.15)",
    };
  }
  if (action.startsWith("CREATE_TASK")) {
    return {
      icon: FilePlus,
      color: "#00B69B",
      bg: "rgba(0, 182, 155, 0.15)",
    };
  }
  if (action.startsWith("UPDATE_TASK") || action.startsWith("UPDATE_USER")) {
    return {
      icon: FileEdit,
      color: "#4880FF",
      bg: "rgba(72, 128, 255, 0.15)",
    };
  }
  if (action.startsWith("DELETE_TASK") || action.startsWith("DELETE_USER")) {
    return {
      icon: Trash2,
      color: "#FEC53D",
      bg: "rgba(254, 197, 61, 0.18)",
    };
  }
  if (action.includes("PASSWORD")) {
    return {
      icon: Key,
      color: "#8280FF",
      bg: "rgba(130, 128, 255, 0.15)",
    };
  }
  if (action.startsWith("LOGIN_SUCCESS")) {
    return {
      icon: LogIn,
      color: "#00B69B",
      bg: "rgba(0, 182, 155, 0.15)",
    };
  }
  if (action.startsWith("SEARCH")) {
    return {
      icon: Search,
      color: "#64748B",
      bg: "rgba(100, 116, 139, 0.15)",
    };
  }
  return {
    icon: Activity,
    color: "#4880FF",
    bg: "rgba(72, 128, 255, 0.15)",
  };
};

const ActivityTimeline = ({ activities = [] }) => {
  const formatAction = (action) => {
    if (!action) return "System Event";
    return action.replace(/_/g, " ").replace(/:/g, " → ");
  };

  return (
    <div className="activity-timeline">
      {activities.map((a, i) => {
        const { icon: ActionIcon, color, bg } = getActionDetails(a.action);
        return (
          <motion.div
            key={a._id || i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.02, 0.3) }}
            className="activity-timeline__item"
          >
            <div className="activity-timeline__line" />
            <div
              className="activity-timeline__dot"
              style={{ backgroundColor: color }}
            />
            <div className="activity-timeline__content">
              <div className="activity-timeline__header">
                <span
                  className="p-1 rounded-md flex items-center justify-center mr-1"
                  style={{ backgroundColor: bg, color }}
                >
                  <ActionIcon size={13} />
                </span>
                <span className="activity-timeline__action">{formatAction(a.action)}</span>
                <span className="activity-timeline__time">{formatTimeAgo(a.createdAt)}</span>
              </div>
              {a.detail && (
                <p className="activity-timeline__detail">{a.detail}</p>
              )}
              {a.ip && (
                <span className="activity-timeline__ip">Client IP: {a.ip}</span>
              )}
            </div>
          </motion.div>
        );
      })}

      {activities.length === 0 && (
        <div className="activity-timeline__empty">
          <span>No activity logged yet</span>
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;
