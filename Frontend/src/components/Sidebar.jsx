import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { motion } from "framer-motion";
import {
  LayoutDashboard, ListTodo, BarChart3, User, Settings, Activity,
  Shield, LogOut, ChevronLeft, ChevronRight, Sparkles
} from "lucide-react";

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "users", label: "Users", icon: User },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "owasp", label: "OWASP", icon: Shield },
  { id: "profile", label: "Profile", icon: User },
  { id: "settings", label: "Settings", icon: Settings },
];

const Sidebar = ({ activePage, onNavigate, collapsed, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}
    >
      {/* Logo / Brand */}
      <div className="sidebar__brand">
        <div className="sidebar__logo">
          <Sparkles size={20} />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <span className="sidebar__brand-text">SecureVault</span>
            <span className="sidebar__brand-sub">Enterprise Portal</span>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {navItems.map(({ id, label, icon: Icon }) => {
          // Only show "Users" tab to admins
          if (id === "users" && user?.role !== "admin") return null;

          const isActive = activePage === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`sidebar__item ${isActive ? "sidebar__item--active" : ""}`}
              title={collapsed ? label : ""}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 }}
                  className="sidebar__label"
                >
                  {label}
                </motion.span>
              )}
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="sidebar__indicator"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="sidebar__bottom">
        <button
          onClick={onToggleCollapse}
          className="sidebar__item sidebar__toggle"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span className="sidebar__label">Collapse</span>}
        </button>

        <div className="sidebar__user">
          <div className="sidebar__avatar">
            {user?.username?.charAt(0)?.toUpperCase() || "U"}
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="sidebar__user-info"
            >
              <span className="sidebar__username">{user?.username}</span>
              <span className="sidebar__role">{user?.role}</span>
            </motion.div>
          )}
          <button onClick={logout} className="sidebar__logout" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
