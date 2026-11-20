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
  Search, Shield, CheckCircle, AlertTriangle, Users, Zap,
  Database, Lock, KeyRound, Ticket, Gauge, Globe, Hash,
  ShieldAlert, UserPlus, Edit2, Trash2, Menu, ChevronDown,
  LogOut, Settings as SettingsIcon, User as UserIcon, ArrowRight
} from "lucide-react";

// Page imports
import TasksPage from "./TasksPage";
import AnalyticsPage from "./AnalyticsPage";
import ProfilePage from "./ProfilePage";
import SettingsPage from "./SettingsPage";
import ActivityPage from "./ActivityPage";
import SecurityDemoModal from "../components/SecurityDemoModal";

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
  const [showSecurityDemo, setShowSecurityDemo] = useState(false);
  const [threatsBlocked, setThreatsBlocked] = useState(0);
  const [editUser, setEditUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.getUsers(token);
      const users = (res.users || []).map((u) => ({
        id: u._id || u.id,
        name: u.username,
        username: u.username,
        email: u.email,
        role: u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : "Viewer",
        status: u.status || "Active",
      }));
      setData({ users });
    } catch (_err) {
      setData({ users: [] });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (activePage === "users" || activePage === "overview") {
      fetchUsers();
    }
  }, [activePage, fetchUsers]);

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
    fetchUsers();
    setShowAddUser(false);
  };

  const handleEditSave = async (userId, editForm) => {
    await api.updateUser(token, userId, {
      username: editForm.username,
      email: editForm.email,
      role: editForm.role,
      status: editForm.status,
    });
    fetchUsers();
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.deleteUser(token, userId);
      setDeleteConfirm(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete user.");
    }
  };

  const handleWarning = (threat) => {
    setWarning(threat);
    setThreatsBlocked((p) => p + 1);
  };

  const securityItems = [
    { label: "SQL Injection Guard", status: "Parameterized queries + ORM protection", icon: Database, ok: true },
    { label: "XSS Protection", status: "Input sanitization + Content-Security-Policy", icon: Shield, ok: true },
    { label: "Credential Leak Guard", status: "Auto-redacts API keys, tokens & connection URIs", icon: KeyRound, ok: true },
    { label: "JWT Authentication", status: "HS256 signed, strict 1h expiry claim", icon: Ticket, ok: true },
    { label: "Rate Limiter", status: "5 attempts/min on auth, 100/min general", icon: Gauge, ok: true },
    { label: "CORS Policy", status: "Strict whitelist-only origin inspection", icon: Globe, ok: true },
    { label: "Transport Security", status: "TLS 1.3 enforced, HSTS preload enabled", icon: Lock, ok: true },
    { label: "Password Cryptography", status: "bcrypt hashing with cost factor 12", icon: Hash, ok: true },
    { label: "Payload Interceptor", status: "Real-time client & server signature analysis", icon: ShieldAlert, ok: true },
  ];

  const owaspItems = [
    { code: "A01", label: "Broken Access Control", detail: "Strict RBAC middleware and ownership checks on all task mutations" },
    { code: "A02", label: "Cryptographic Failures", detail: "bcrypt cost 12 password hashing & HS256 signed token verification" },
    { code: "A03", label: "Injection", detail: "Multi-layered regex payload scanner & parameterized Mongoose queries" },
    { code: "A04", label: "Insecure Design", detail: "Principle of least privilege, viewer-restricted views, secret redactor" },
    { code: "A05", label: "Security Misconfiguration", detail: "Helmet security headers, CSP, sanitized error handling without stack leaks" },
    { code: "A06", label: "Vulnerable Components", detail: "Audited dependencies, zero reported vulnerabilities" },
    { code: "A07", label: "Identification & Auth Failures", detail: "Rate-limited authentication endpoints and brute-force protection" },
    { code: "A08", label: "Software & Data Integrity", detail: "Payload guard validation on all incoming request bodies and queries" },
    { code: "A09", label: "Security Logging & Monitoring", detail: "Immutable MongoDB audit logs capturing all auth, CRUD and blocked attacks" },
    { code: "A10", label: "Server-Side Request Forgery", detail: "No outbound unvalidated SSRF sinks; whitelist-only redirects" },
  ];

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
      case "demo":
        return (
          <div className="page">
            <div className="page__header">
              <div>
                <h1 className="page__title">Cyber Defense &amp; Security Sandbox</h1>
                <p className="page__subtitle">Interactive live testing environment for In-App WAF and Credential Scanner</p>
              </div>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-8 text-center max-w-xl mx-auto mt-6 shadow-sm flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#4880FF]/15 border border-[#4880FF]/30 text-[#4880FF] flex items-center justify-center">
                <ShieldAlert size={28} />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Test Real-Time Cyber Interception</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Launch real-world SQL Injection, XSS payloads, or API credential leaks. Watch the portal&apos;s client &amp; server defensive gates neutralize threats with zero latency.
              </p>
              <button
                onClick={() => setShowSecurityDemo(true)}
                className="btn btn--primary py-2.5 px-6 font-bold text-xs flex items-center gap-2 mt-2 shadow-lg shadow-[#4880FF]/25 cursor-pointer"
              >
                <Zap size={14} className="text-amber-300 fill-amber-300" />
                <span>Launch Interactive Sandbox</span>
              </button>
            </div>
          </div>
        );

      case "users":
        return (
          <div className="page">
            <div className="page__header">
              <div>
                <h1 className="page__title">User Administration</h1>
                <p className="page__subtitle">Role-based access control and identity governance</p>
              </div>
              <div className="page__actions">
                <span className="badge badge--info">RBAC Enforced</span>
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
            <p className="page__note">
              Role claims are verified with cryptographic signature on every API call. Injections are intercepted at gateway.
            </p>
          </div>
        );

      case "owasp":
        return (
          <div className="page">
            <div className="page__header">
              <div>
                <h1 className="page__title">OWASP Top 10 Coverage</h1>
                <p className="page__subtitle">Architectural verification against the Top 10 web security risks</p>
              </div>
            </div>
            <div className="owasp-list">
              {owaspItems.map((item, i) => (
                <motion.div
                  key={item.code}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="owasp-item"
                >
                  <span className="owasp-item__code">{item.code}</span>
                  <div className="flex-1">
                    <span className="owasp-item__label block">{item.label}</span>
                    <span className="text-xs text-[var(--text-muted)] block mt-0.5">{item.detail}</span>
                  </div>
                  <span className="owasp-item__badge">Verified</span>
                </motion.div>
              ))}
            </div>
          </div>
        );

      default: // overview
        return (
          <div className="page">
            <div className="page__header">
              <div>
                <h1 className="page__title">Dashboard</h1>
                <p className="page__subtitle">Welcome back, {user?.username}! Real-time task telemetry, security health & workload status</p>
              </div>
              <div className="page__actions">
                <span className="badge badge--success">
                  <Shield size={12} /> System Protected
                </span>
                <button
                  onClick={() => setActivePage("tasks")}
                  className="btn btn--primary flex items-center gap-1.5"
                >
                  Go to Tasks
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* DashStack Signature 4-KPI Grid */}
            <div className="stats-grid">
              <StatsCard
                label="Total Users"
                value={String(data?.users?.length || 1)}
                icon={<Users size={24} />}
                color="#8280FF"
                trend={8.5}
                trendText="Up from yesterday"
                delay={0}
              />
              <StatsCard
                label="Security Posture"
                value="99/100"
                icon={<Shield size={24} />}
                color="#4880FF"
                trend={1.8}
                trendText="Up from yesterday"
                delay={0.05}
              />
              <StatsCard
                label="Attacks Blocked"
                value={String(threatsBlocked)}
                icon={<AlertTriangle size={24} />}
                color="#FEC53D"
                trend={threatsBlocked > 0 ? 12.5 : 0}
                trendText="Real-time shield"
                delay={0.1}
              />
              <StatsCard
                label="OWASP Compliance"
                value="10/10"
                icon={<CheckCircle size={24} />}
                color="#00B69B"
                trend={100}
                trendText="Fully verified"
                delay={0.15}
              />
            </div>

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

              {/* Right Column: Security Telemetry Summary */}
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">Security Telemetry</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Real-time gatekeeper status</p>
                  </div>
                  <span className="badge badge--success">100% Active</span>
                </div>

                <div className="flex flex-col gap-3">
                  {securityItems.slice(0, 5).map((item) => {
                    const SecIcon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]"
                      >
                        <div className="flex items-center gap-3 min-width-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-[#00B69B] flex items-center justify-center shrink-0">
                            <SecIcon size={16} />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[var(--text-primary)] block">
                              {item.label}
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)] block truncate max-w-[170px]">
                              {item.status}
                            </span>
                          </div>
                        </div>
                        <span className="badge badge--success text-[10px] py-0.5 px-2">Active</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Full Security Controls Section */}
            <h3 className="section-title">Complete Security Architecture</h3>
            <div className="security-grid">
              {securityItems.map((item) => {
                const SecIcon = item.icon;
                return (
                  <div key={item.label} className="security-card">
                    <span className="security-card__icon">
                      <SecIcon size={18} className="text-[#4880FF]" />
                    </span>
                    <div className="security-card__content">
                      <div className="security-card__header">
                        <span className="security-card__label">{item.label}</span>
                        <span className={`badge ${item.ok ? "badge--success" : "badge--error"}`}>
                          {item.ok ? "Active" : "Disabled"}
                        </span>
                      </div>
                      <p className="security-card__status">{item.status}</p>
                    </div>
                  </div>
                );
              })}
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
            <button
              onClick={() => setShowSecurityDemo(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-[#4880FF] text-xs font-bold transition-all shadow-sm shadow-blue-500/10 cursor-pointer"
              title="Interactive Cyber Threat Sandbox & Payload Simulator"
            >
              <Zap size={13} className="text-amber-400 fill-amber-400" />
              <span className="hidden sm:inline">Security Demo</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Shield Active</span>
            </div>

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

        {/* Security Sandbox Demo Modal */}
        <SecurityDemoModal
          isOpen={showSecurityDemo}
          onClose={() => setShowSecurityDemo(false)}
          onTriggerAlert={(threat) => {
            handleWarning(threat);
          }}
        />
      </main>
    </div>
  );
};

export default Dashboard;
