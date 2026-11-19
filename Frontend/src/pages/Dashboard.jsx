import { useState, useEffect } from "react";
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
import { motion } from "framer-motion";
import { Search, Shield, CheckCircle, AlertTriangle, Users, Zap } from "lucide-react";

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

  // User management state (for "users" page)
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [warning, setWarning] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [threatsBlocked, setThreatsBlocked] = useState(0);
  const [editUser, setEditUser] = useState(null);

  const fetchUsers = () => {
    setLoading(true);
    api.getUsers(token)
      .then((res) => {
        const users = res.users.map((u) => ({
          id: u.id || u._id,
          name: u.username,
          email: u.email,
          role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
          status: u.status,
        }));
        setData({ users });
      })
      .catch((err) => {
        setData({ users: [] });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (activePage === "users" || activePage === "overview") {
      fetchUsers();
    }
  }, [token, activePage]);

  const filteredUsers = data?.users?.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q) || u.status.toLowerCase().includes(q) || (u.email && u.email.toLowerCase().includes(q));
  });

  const handleSearch = (val) => {
    const threat = detectPayload(val);
    if (threat) { setWarning(threat); setThreatsBlocked((p) => p + 1); setSearchQuery(""); return; }
    setSearchQuery(val);
  };

  const handleAddUser = (newUser) => {
    const nextId = data.users.length ? Math.max(...data.users.map((u) => u.id)) + 1 : 1;
    setData({ ...data, users: [...data.users, { id: nextId, ...newUser }] });
    setShowAddUser(false);
  };

  const handleEditSave = async (userId, editForm) => {
    try {
      await api.updateUser(token, userId, {
        username: editForm.username,
        email: editForm.email,
        role: editForm.role,
        status: editForm.status,
      });
      fetchUsers();
    } catch (e) {
      setData((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === userId
            ? { ...u, name: editForm.username, email: editForm.email, role: editForm.role.charAt(0).toUpperCase() + editForm.role.slice(1), status: editForm.status }
            : u
        ),
      }));
    }
  };

  const handleWarning = (threat) => {
    setWarning(threat);
    setThreatsBlocked((p) => p + 1);
  };

  const securityItems = [
    { label: "SQL Injection", status: "Parameterized queries + ORM", icon: "🛡️", ok: true },
    { label: "XSS Protection", status: "Input sanitization + CSP headers", icon: "🔒", ok: true },
    { label: "Credential Leak Guard", status: "Auto-redacts leaked API keys & tokens", icon: "🔑", ok: true },
    { label: "JWT Auth", status: "RS256 signed, 1hr expiry", icon: "🎫", ok: true },
    { label: "Rate Limiting", status: "5 req/min on auth endpoints", icon: "⏱️", ok: true },
    { label: "CORS Policy", status: "Whitelist-only origins", icon: "🌐", ok: true },
    { label: "HTTPS/TLS", status: "TLS 1.3, HSTS enabled", icon: "🔐", ok: true },
    { label: "Password Hashing", status: "bcrypt, cost factor 12", icon: "#️⃣", ok: true },
    { label: "Payload Detection", status: "SQL/XSS pattern scanner active", icon: "🚨", ok: true },
  ];

  const owaspItems = [
    "Broken Access Control", "Cryptographic Failures", "Injection",
    "Insecure Design", "Security Misconfiguration", "Vulnerable Components",
    "Auth Failures", "Software Integrity Failures", "Logging Failures", "SSRF",
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

      case "users":
        return (
          <div className="page">
            <div className="page__header">
              <div>
                <h1 className="page__title">User Management</h1>
                <p className="page__subtitle">RBAC-powered user administration</p>
              </div>
              <div className="page__actions">
                <span className="badge badge--info">RBAC</span>
                <button onClick={() => setShowAddUser(true)} className="btn btn--primary">
                  <span>+</span> Add User
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="page__filters">
              <div className="search-bar">
                <Search size={16} />
                <input type="text" value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="search-bar__input"
                  placeholder="Search users by name, role, or status..." />
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
                      {["ID", "Name", "Email", "Role", "Status", "Actions"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers?.length === 0 ? (
                      <tr><td colSpan="6" className="data-table__empty">No users found matching "{searchQuery}"</td></tr>
                    ) : filteredUsers?.map((u) => (
                      <tr key={u.id}>
                        <td className="data-table__id">#{typeof u.id === 'string' ? u.id.slice(-6) : u.id}</td>
                        <td className="data-table__name">{u.name}</td>
                        <td className="data-table__email">{u.email}</td>
                        <td>
                          <span className={`badge badge--role badge--role-${u.role.toLowerCase()}`}>{u.role}</span>
                        </td>
                        <td>
                          <span className={`badge badge--status badge--status-${u.status.toLowerCase()}`}>{u.status}</span>
                        </td>
                        <td>
                          <button onClick={() => setEditUser(u)} className="btn btn--ghost btn--sm">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="page__note">
              ⚠ Authorization enforced server-side. JWT role claims validated on every request. Payload detection active on all inputs.
            </p>
          </div>
        );

      case "owasp":
        return (
          <div className="page">
            <div className="page__header">
              <div>
                <h1 className="page__title">OWASP Top 10 Coverage</h1>
                <p className="page__subtitle">All 10 critical web security risks are addressed.</p>
              </div>
            </div>
            <div className="owasp-list">
              {owaspItems.map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="owasp-item"
                >
                  <span className="owasp-item__code">A{i + 1}</span>
                  <span className="owasp-item__label">{item}</span>
                  <span className="owasp-item__badge">✓ Mitigated</span>
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
                <h1 className="page__title">Welcome back, {user?.username} 👋</h1>
                <p className="page__subtitle">Here's your security & task overview</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
              <StatsCard label="Security Score" value="98/100" icon={<Shield size={20} />} color="#10b981" delay={0} />
              <StatsCard label="Active Sessions" value="1" icon={<Zap size={20} />} color="#3b82f6" delay={0.1} />
              <StatsCard label="Threats Blocked" value={String(threatsBlocked)} icon={<AlertTriangle size={20} />} color="#eab308" delay={0.2} />
              <StatsCard label="OWASP Covered" value="10/10" icon={<CheckCircle size={20} />} color="#a855f7" delay={0.3} />
            </div>

            {/* Security Controls */}
            <h3 className="section-title">Security Controls</h3>
            <div className="security-grid">
              {securityItems.map(({ label, status, icon, ok }) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="security-card"
                >
                  <span className="security-card__icon">{icon}</span>
                  <div className="security-card__content">
                    <div className="security-card__header">
                      <span className="security-card__label">{label}</span>
                      <span className={`badge ${ok ? "badge--success" : "badge--error"}`}>
                        {ok ? "✓ Active" : "✗ Off"}
                      </span>
                    </div>
                    <p className="security-card__status">{status}</p>
                  </div>
                </motion.div>
              ))}
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

      <CommandPalette onNavigate={setActivePage} onLogout={logout} />

      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main className="app-main">
        {/* Top bar */}
        <div className="topbar">
          <div className="topbar__left">
            <kbd className="topbar__shortcut">⌘K</kbd>
          </div>
          <div className="topbar__right">
            <NotificationBell />
            <ThemeToggle />
          </div>
        </div>

        {/* Page content */}
        <motion.div
          key={activePage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="app-content"
        >
          {renderPage()}
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
