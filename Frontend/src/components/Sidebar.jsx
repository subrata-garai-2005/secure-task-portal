import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  LayoutDashboard, ListTodo, BarChart3, Users, Settings, Activity,
  LogOut, ChevronLeft, ChevronRight, Layers, User
} from "lucide-react";

const navGroups = [
  {
    title: "Dashboard",
    items: [
      { id: "overview", label: "Dashboard", icon: LayoutDashboard },
      { id: "tasks", label: "Tasks", icon: ListTodo },
      { id: "analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Pages",
    items: [
      { id: "users", label: "Users", icon: Users, adminOnly: true },
      { id: "activity", label: "Activity Logs", icon: Activity },
    ],
  },
  {
    title: "Settings",
    items: [
      { id: "profile", label: "Profile", icon: User },
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
];

const Sidebar = ({ activePage, onNavigate, collapsed, onToggleCollapse }) => {
  const { user, logout } = useAuth();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 76 : 260 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}
    >
      {/* Brand Header */}
      <div className="sidebar__brand">
        <div className="sidebar__logo">
          <Layers size={22} />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col"
          >
            <span className="sidebar__brand-text">
              Dash<span>Stack</span>
            </span>
            <span className="sidebar__brand-sub">Secure Admin Portal</span>
          </motion.div>
        )}
      </div>

      {/* Categorized Navigation */}
      <nav className="sidebar__nav">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.adminOnly || user?.role === "admin"
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="mb-2">
              {!collapsed && (
                <div className="sidebar__section-title">
                  {group.title}
                </div>
              )}
              {visibleItems.map((item) => {
                const NavIcon = item.icon;
                const isActive = activePage === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`sidebar__item ${isActive ? "sidebar__item--active" : ""}`}
                    title={collapsed ? item.label : ""}
                  >
                    <NavIcon size={19} strokeWidth={isActive ? 2.4 : 1.9} />
                    {!collapsed && (
                      <span className="sidebar__label">
                        {item.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="sidebar__bottom">
        <button
          onClick={onToggleCollapse}
          className="sidebar__item sidebar__toggle"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span className="sidebar__label">Collapse Sidebar</span>}
        </button>

        <div className="sidebar__user">
          <div className="sidebar__avatar">
            {user?.username?.charAt(0)?.toUpperCase() || "U"}
          </div>
          {!collapsed && (
            <div className="sidebar__user-info">
              <span className="sidebar__username">{user?.username}</span>
              <span className="sidebar__role">{user?.role}</span>
            </div>
          )}
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
