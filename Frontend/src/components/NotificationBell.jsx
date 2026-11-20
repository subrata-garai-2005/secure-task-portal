import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  Bell, CheckCheck, ClipboardList, FileEdit, CheckCircle2,
  MessageSquare, Clock, ShieldAlert, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatTimeAgo } from "../utils/date";

const renderTypeIcon = (type) => {
  const iconProps = { size: 14, className: "shrink-0" };
  switch (type) {
    case "task_assigned":
      return <ClipboardList {...iconProps} className="text-blue-400 shrink-0" />;
    case "task_updated":
      return <FileEdit {...iconProps} className="text-amber-400 shrink-0" />;
    case "task_completed":
      return <CheckCircle2 {...iconProps} className="text-emerald-400 shrink-0" />;
    case "comment_added":
      return <MessageSquare {...iconProps} className="text-purple-400 shrink-0" />;
    case "due_reminder":
      return <Clock {...iconProps} className="text-orange-400 shrink-0" />;
    case "security_alert":
      return <ShieldAlert {...iconProps} className="text-red-400 shrink-0" />;
    default:
      return <Info {...iconProps} className="text-zinc-400 shrink-0" />;
  }
};

const NotificationBell = () => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.getNotifications(token);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (_err) {
      // Ignore polling errors
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markRead = async (id) => {
    try {
      await api.markNotificationRead(token, id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (_err) {
      // ignore
    }
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (_err) {
      // ignore
    }
  };

  return (
    <div className="notification-bell">
      <button
        onClick={() => setOpen(!open)}
        className="notification-bell__btn"
        aria-label="Notifications"
        title="Notifications"
      >
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
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
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
                  <div className="notification-bell__empty">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`notification-item ${!n.read ? "notification-item--unread" : ""}`}
                      onClick={() => !n.read && markRead(n._id)}
                    >
                      <span className="notification-item__icon">{renderTypeIcon(n.type)}</span>
                      <div className="notification-item__content">
                        <div className="notification-item__top">
                          <span className="notification-item__title">{n.title}</span>
                          <span className="notification-item__time">{formatTimeAgo(n.createdAt)}</span>
                        </div>
                        <p className="notification-item__msg">{n.message}</p>
                      </div>
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
