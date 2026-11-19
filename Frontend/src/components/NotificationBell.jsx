import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Bell, Check, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const typeIcons = {
  task_assigned: "📋",
  task_updated: "✏️",
  task_completed: "✅",
  comment_added: "💬",
  due_reminder: "⏰",
  security_alert: "🚨",
  system: "ℹ️",
};

const NotificationBell = () => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications(token);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      // silently fail
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [token]);

  const markRead = async (id) => {
    try {
      await api.markNotificationRead(token, id);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {}
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {}
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="notification-bell">
      <button onClick={() => setOpen(!open)} className="notification-bell__btn">
        <Bell size={18} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="notification-bell__badge"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="notification-bell__overlay" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="notification-bell__dropdown"
            >
              <div className="notification-bell__header">
                <span className="notification-bell__title">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="notification-bell__read-all">
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>

              <div className="notification-bell__list">
                {notifications.length === 0 ? (
                  <div className="notification-bell__empty">
                    <Bell size={24} strokeWidth={1} />
                    <span>No notifications yet</span>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`notification-bell__item ${!n.read ? "notification-bell__item--unread" : ""}`}
                      onClick={() => !n.read && markRead(n._id)}
                    >
                      <span className="notification-bell__icon">{typeIcons[n.type] || "📌"}</span>
                      <div className="notification-bell__content">
                        <span className="notification-bell__item-title">{n.title}</span>
                        <span className="notification-bell__message">{n.message}</span>
                        <span className="notification-bell__time">{timeAgo(n.createdAt)}</span>
                      </div>
                      {!n.read && (
                        <span className="notification-bell__dot" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
