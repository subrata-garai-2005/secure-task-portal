import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { detectPayload } from "../utils/attackDetection";
import SecurityWarningModal from "../components/SecurityWarningModal";
import Sidebar from "../components/Sidebar";
import NotificationBell from "../components/NotificationBell";
import ThemeToggle from "../components/ThemeToggle";
import CommandPalette from "../components/CommandPalette";
import AddUserModal from "../components/AddUserModal";
import EditUserModal from "../components/EditUserModal";
import SkeletonLoader from "../components/SkeletonLoader";
import StatsCard from "../components/StatsCard";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Users, UserPlus, Edit2, Trash2, Menu, ChevronDown,
  LogOut, Settings as SettingsIcon, User as UserIcon, ArrowRight,
  UserCheck, Calendar, Flag, CheckCircle2, Clock, ListTodo
} from "lucide-react";
import { fireConfetti, playSuccessChime } from "../utils/confetti";

// Page imports
import TasksPage from "./TasksPage";
import AnalyticsPage from "./AnalyticsPage";
import ProfilePage from "./ProfilePage";
import SettingsPage from "./SettingsPage";
import ActivityPage from "./ActivityPage";

const Dashboard = () => {
  const { token, user, logout } = useAuth();
  const [activePage, setActivePage] = useState("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // User management state (for "users" page)
  const [data, setData] = useState({ users: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [warning, setWarning] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [threatsBlocked, setThreatsBlocked] = useState(0);
  const [editUser, setEditUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [dashboardTasks, setDashboardTasks] = useState([]);

  const fetchOverviewData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [usersRes, tasksRes] = await Promise.allSettled([
        api.getUsers(token),
        api.getTasks(token),
      ]);

      if (usersRes.status === "fulfilled") {
        const users = (usersRes.value.users || []).map((u) => ({
          id: u._id || u.id,
          name: u.username,
          username: u.username,
          email: u.email,
          role: u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : "Viewer",
          status: u.status || "Active",
        }));
        setData({ users });
      } else {
        setData({ users: [] });
      }

      if (tasksRes.status === "fulfilled") {
        setDashboardTasks(tasksRes.value.tasks || []);
      }
    } catch (_err) {
      setData({ users: [] });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (activePage === "users" || activePage === "overview") {
      fetchOverviewData();
    }
  }, [activePage, fetchOverviewData]);

  const handleDashboardCompleteTask = async (taskId) => {
    try {
      await api.updateTaskStatus(token, taskId, "done");
      fireConfetti();
      playSuccessChime();
      setDashboardTasks((prev) =>
        prev.map((t) => ((t._id || t.id) === taskId ? { ...t, status: "done" } : t))
      );
    } catch (err) {
      console.error("Failed to complete task:", err);
    }
  };

  const filteredUsers = (data?.users || []).filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.status?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  const handleSearch = (val) => {
    const threat = detectPayload(val);
    if (threat) {
      setWarning(threat);
      setThreatsBlocked((p) => p + 1);
      setSearchQuery("");
      return;
    }
    setSearchQuery(val);
  };

  const handleAddUser = async (newUser) => {
    await api.createUser(token, newUser);
    fetchOverviewData();
    setShowAddUser(false);
  };

  const handleEditSave = async (userId, editForm) => {
    await api.updateUser(token, userId, {
      username: editForm.username,
      email: editForm.email,
      role: editForm.role,
      status: editForm.status,
    });
    fetchOverviewData();
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.deleteUser(token, userId);
      setDeleteConfirm(null);
      fetchOverviewData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete user.");
    }
  };

  const handleWarning = (threat) => {
    setWarning(threat);
    setThreatsBlocked((p) => p + 1);
  };

  // ─── Render page content based on activePage ─────────────────────────────
  const renderPage = () => {
    switch (activePage) {
      case "tasks":
        return <TasksPage />;
      case "analytics":
        return <AnalyticsPage />;
      case "profile":
        return <ProfilePage />;
      case "settings":
        return <SettingsPage />;
      case "activity":
        return <ActivityPage />;

      case "users":
        return (
          <div className="page">
            <div className="page__header">
              <div>
                <h1 className="page__title">User Administration</h1>
                <p className="page__subtitle">Role-based access control and identity governance</p>
              </div>
              <div className="page__actions">
                {user?.role === "admin" && (
                  <button onClick={() => setShowAddUser(true)} className="btn btn--primary flex items-center gap-1.5">
                    <UserPlus size={15} />
                    Add User
                  </button>
                )}
              </div>
            </div>

            {/* Search Bar */}
            <div className="page__filters">
              <div className="search-bar">
                <Search size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="search-bar__input"
                  placeholder="Search by username, role, or status..."
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="search-bar__clear">✕</button>
                )}
              </div>
            </div>

            {loading ? (
              <SkeletonLoader type="table" count={5} />
            ) : (
              <div className="data-table">
                <table className="data-table__table">
                  <thead>
                    <tr>
                      {["Identifier", "Username", "Email", "Role", "Status", "Actions"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers?.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="data-table__empty">
                          No users found matching "{searchQuery}"
                        </td>
                      </tr>
                    ) : (
                      filteredUsers?.map((u) => (
                        <tr key={u.id}>
                          <td className="data-table__id">
                            #{typeof u.id === "string" ? u.id.slice(-6) : u.id}
                          </td>
                          <td className="data-table__name font-medium">{u.name}</td>
                          <td className="data-table__email">{u.email}</td>
                          <td>
                            <span className={`badge badge--role badge--role-${u.role.toLowerCase()}`}>
                              {u.role}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge--status badge--status-${u.status.toLowerCase()}`}>
                              {u.status}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setEditUser(u)}
                                className="btn btn--ghost btn--sm flex items-center gap-1 text-xs"
                              >
                                <Edit2 size={13} /> Edit
                              </button>
                              {user?.role === "admin" && u.name !== user.username && (
                                <button
                                  onClick={() => setDeleteConfirm(u)}
                                  className="btn btn--ghost btn--sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-1 text-xs"
                                >
                                  <Trash2 size={13} /> Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      default: // overview
        return (
          <div className="page">
            <div className="page__header">
              <div>
                <h1 className="page__title">Dashboard</h1>
                <p className="page__subtitle">
                  Welcome back, {user?.username}! Overview of tasks, team workload, and project progress.
                </p>
              </div>
              <div className="page__actions">
                <button
                  onClick={() => setActivePage("tasks")}
                  className="btn btn--primary flex items-center gap-1.5"
                >
                  <ListTodo size={14} />
                  Go to Tasks
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Signature 4-KPI Grid */}
            <div className="stats-grid">
              <StatsCard
                label="Total Tasks"
                value={String(dashboardTasks.length)}
                icon={<ListTodo size={24} />}
                color="#4880FF"
                trendText="All project tasks"
                delay={0}
              />
              <StatsCard
                label="Pending Tasks"
                value={String(dashboardTasks.filter((t) => t.status !== "done").length)}
                icon={<Clock size={24} />}
                color="#FEC53D"
                trendText="Awaiting completion"
                delay={0.05}
              />
              <StatsCard
                label="Completed Tasks"
                value={String(dashboardTasks.filter((t) => t.status === "done").length)}
                icon={<CheckCircle2 size={24} />}
                color="#00B69B"
                trendText={
                  dashboardTasks.length > 0
                    ? `${Math.round(
                        (dashboardTasks.filter((t) => t.status === "done").length /
                          dashboardTasks.length) *
                          100
                      )}% completion rate`
                    : "No tasks created yet"
                }
                delay={0.1}
              />
              <StatsCard
                label="Team Members"
                value={String(data?.users?.length || 1)}
                icon={<Users size={24} />}
                color="#8280FF"
                trendText="Active accounts"
                delay={0.15}
              />
            </div>

            {/* Assigned Tasks Section (What the user has to complete) */}
            {(() => {
              const myTasks = dashboardTasks.filter((t) => {
                if (user?.role === "viewer") return true;
                return (t.assignee?._id || t.assignee) === user?.id;
              });
              const pending = myTasks.filter((t) => t.status !== "done");
              const completed = myTasks.filter((t) => t.status === "done");

              return (
                <div className="mt-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <UserCheck size={18} className="text-[#4880FF]" />
                        <h3 className="text-base font-bold text-[var(--text-primary)]">
                          {user?.role === "viewer" ? "Tasks Assigned to You" : "Your Assigned Workload"}
                        </h3>
                        <span className="badge badge--info text-[11px] font-bold">
                          {pending.length} Pending
                        </span>
                        {completed.length > 0 && (
                          <span className="badge badge--success text-[11px] font-bold">
                            {completed.length} Completed
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {user?.role === "viewer"
                          ? "Tasks assigned by administrators that require your completion"
                          : "Tasks assigned to your user account across current sprints"}
                      </p>
                    </div>

                    <button
                      onClick={() => setActivePage("tasks")}
                      className="btn btn--secondary btn--sm flex items-center gap-1.5 text-xs font-bold"
                    >
                      Open Tasks Board <ArrowRight size={13} />
                    </button>
                  </div>

                  {pending.length > 0 && (
                    <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs text-amber-300">
                      <div className="flex items-center gap-2">
                        <Clock size={15} className="text-amber-400 shrink-0" />
                        <span>
                          <strong>Action Required:</strong> You have {pending.length} task{pending.length > 1 ? "s" : ""} pending completion.
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-amber-200">
                        Mark as complete when finished
                      </span>
                    </div>
                  )}

                  {myTasks.length === 0 ? (
                    <div className="text-center py-8 text-[var(--text-muted)] border border-dashed border-[var(--border-color)] rounded-xl">
                      <UserCheck size={28} className="mx-auto mb-2 opacity-40 text-[#4880FF]" />
                      <p className="text-xs font-semibold">No assigned tasks found.</p>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                        {user?.role === "admin"
                          ? "You can create and assign tasks to users on the Tasks page."
                          : "When an administrator assigns a task to you, it will appear here."}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {myTasks.slice(0, 6).map((task) => {
                        const isDone = task.status === "done";
                        return (
                          <div
                            key={task._id || task.id}
                            className={`p-4 rounded-xl bg-[var(--bg-primary)] border transition-all flex flex-col justify-between gap-3 ${
                              isDone
                                ? "border-emerald-500/30 opacity-90"
                                : "border-[var(--border-color)] hover:border-[#4880FF]/50 shadow-sm"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className={`badge badge--priority badge--priority-${task.priority} text-[10px]`}>
                                  <Flag size={9} /> {task.priority}
                                </span>
                                <span className={`badge badge--status badge--status-${task.status} text-[10px]`}>
                                  {task.status?.replace("_", " ")}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-[var(--text-primary)] line-clamp-1">
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-1 leading-relaxed">
                                  {task.description}
                                </p>
                              )}
                            </div>

                            <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between">
                              <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                                <Calendar size={11} />
                                {task.dueDate
                                  ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                  : "No due date"}
                              </span>

                              {isDone ? (
                                <span className="text-[11px] font-bold text-[#00B69B] flex items-center gap-1 bg-[#00B69B]/10 border border-[#00B69B]/20 px-2 py-0.5 rounded-md">
                                  <CheckCircle2 size={12} className="fill-[#00B69B]/20" /> Done
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDashboardCompleteTask(task._id || task.id)}
                                  className="text-[11px] font-bold py-1 px-2.5 rounded-lg bg-[#00B69B]/15 hover:bg-[#00B69B]/25 text-[#00B69B] border border-[#00B69B]/30 flex items-center gap-1 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm"
                                  title="Mark this assigned task as completed"
                                >
                                  <CheckCircle2 size={12} />
                                  <span>Complete Task</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Dashboard Sections: Team Directory + Security Architecture */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              {/* Left Column: Recent Users Quick Table */}
              <div className="lg:col-span-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">User Accounts Overview</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Active identities provisioned in system</p>
                  </div>
                  {user?.role === "admin" && (
                    <button
                      onClick={() => setActivePage("users")}
                      className="text-xs font-bold text-[#4880FF] hover:underline flex items-center gap-1"
                    >
                      Manage All →
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[var(--border-color)] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        <th className="py-2.5 px-3">User</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)] text-xs">
                      {(data?.users || []).slice(0, 5).map((u) => (
                        <tr key={u.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                          <td className="py-3 px-3 font-bold text-[var(--text-primary)] flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-blue-500/10 text-[#4880FF] font-bold flex items-center justify-center text-xs">
                              {u.name?.charAt(0)?.toUpperCase()}
                            </div>
                            {u.name}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`badge badge--role badge--role-${u.role?.toLowerCase()}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`badge badge--status badge--status-${u.status?.toLowerCase()}`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[var(--text-secondary)]">{u.email}</td>
                        </tr>
                      ))}
                      {(data?.users || []).length === 0 && (
                        <tr>
                          <td colSpan="4" className="text-center py-6 text-[var(--text-muted)]">
                            No users registered yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Task Status Breakdown */}
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-[var(--text-primary)]">Task Progress</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">Status breakdown across active tasks</p>
                    </div>
                    <span className="text-xs font-bold text-[#4880FF] bg-[#4880FF]/10 px-2.5 py-1 rounded-full border border-[#4880FF]/20">
                      {dashboardTasks.length > 0
                        ? `${Math.round(
                            (dashboardTasks.filter((t) => t.status === "done").length /
                              dashboardTasks.length) *
                              100
                          )}% Done`
                        : "0% Done"}
                    </span>
                  </div>

                  {(() => {
                    const total = dashboardTasks.length || 1;
                    const counts = {
                      todo: dashboardTasks.filter((t) => t.status === "todo").length,
                      in_progress: dashboardTasks.filter((t) => t.status === "in_progress").length,
                      review: dashboardTasks.filter((t) => t.status === "review").length,
                      done: dashboardTasks.filter((t) => t.status === "done").length,
                    };
                    const items = [
                      { label: "To Do", count: counts.todo, bg: "bg-gray-400" },
                      { label: "In Progress", count: counts.in_progress, bg: "bg-[#4880FF]" },
                      { label: "In Review", count: counts.review, bg: "bg-[#FEC53D]" },
                      { label: "Completed", count: counts.done, bg: "bg-[#00B69B]" },
                    ];

                    return (
                      <div className="flex flex-col gap-3 mt-2">
                        {items.map((it) => {
                          const pct = dashboardTasks.length > 0 ? Math.round((it.count / total) * 100) : 0;
                          return (
                            <div key={it.label} className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                                <span className="text-[var(--text-primary)] flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${it.bg}`} />
                                  {it.label}
                                </span>
                                <span className="text-[var(--text-muted)]">
                                  {it.count} task{it.count !== 1 ? "s" : ""} ({pct}%)
                                </span>
                              </div>
                              <div className="w-full bg-[var(--bg-secondary)] h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${it.bg} transition-all duration-500`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                <button
                  onClick={() => setActivePage("tasks")}
                  className="mt-4 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-[#4880FF] bg-[#4880FF]/10 hover:bg-[#4880FF]/20 border border-[#4880FF]/25 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  View All Tasks in Board <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app-layout">
      {warning && <SecurityWarningModal attackType={warning} onClose={() => setWarning(null)} />}
      {showAddUser && (
        <AddUserModal
          onClose={() => setShowAddUser(false)}
          onAdd={handleAddUser}
          onWarning={handleWarning}
        />
      )}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={handleEditSave}
          onWarning={handleWarning}
        />
      )}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">Delete User Account</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-5">
              Are you sure you want to permanently delete user <strong>{deleteConfirm.name}</strong>? This action is recorded in the audit log.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="btn btn--secondary flex-1">
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirm.id)}
                className="btn btn--primary bg-red-600 hover:bg-red-500 border-red-600 text-white flex-1"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <CommandPalette onNavigate={setActivePage} onLogout={logout} />

      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main className="app-main">
        {/* Top bar (DashStack Header) */}
        <div className="topbar">
          <div className="topbar__left">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="topbar__menu-btn"
              title="Toggle sidebar"
              aria-label="Toggle sidebar"
            >
              <Menu size={20} />
            </button>

            <div
              className="topbar__search cursor-pointer"
              onClick={() => {
                document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
              }}
            >
              <Search size={16} className="text-gray-400" />
              <input
                type="text"
                readOnly
                placeholder="Search anything... (⌘K)"
                className="topbar__search-input cursor-pointer"
              />
              <kbd className="topbar__shortcut">⌘K</kbd>
            </div>
          </div>

          <div className="topbar__right">
            <NotificationBell />
            <ThemeToggle />

            {/* DashStack User Profile Chip */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="topbar__user-chip"
                aria-expanded={userMenuOpen}
              >
                <div className="topbar__user-avatar">
                  {user?.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="hidden md:flex topbar__user-details">
                  <span className="topbar__user-name">{user?.username}</span>
                  <span className="topbar__user-role">{user?.role}</span>
                </div>
                <ChevronDown size={14} className="text-gray-400 hidden md:block" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="topbar__dropdown"
                    >
                      <div className="topbar__dropdown-header">
                        <span className="topbar__dropdown-name">{user?.username}</span>
                        <span className="topbar__dropdown-email">{user?.email || `${user?.role} account`}</span>
                      </div>
                      <button
                        onClick={() => {
                          setActivePage("profile");
                          setUserMenuOpen(false);
                        }}
                        className="topbar__dropdown-item"
                      >
                        <UserIcon size={15} className="text-[#4880FF]" />
                        <span>My Profile</span>
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("settings");
                          setUserMenuOpen(false);
                        }}
                        className="topbar__dropdown-item"
                      >
                        <SettingsIcon size={15} className="text-[#8280FF]" />
                        <span>Settings</span>
                      </button>
                      <div className="topbar__dropdown-divider" />
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="topbar__dropdown-item topbar__dropdown-item--danger"
                      >
                        <LogOut size={15} />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Page content */}
        <motion.div
          key={activePage}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16 }}
          className="app-content"
        >
          {renderPage()}
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
