import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import { motion } from "framer-motion";
import {
  Sun, Moon, Bell, Shield, Download, Monitor, Palette,
  Lock, Eye, FileText
} from "lucide-react";

const SettingsPage = () => {
  const { token, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [exporting, setExporting] = useState(false);

  const handleExportAudit = async () => {
    setExporting(true);
    try {
      const blob = await api.exportAuditCSV(token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "audit_logs.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">Settings</h1>
        <p className="page__subtitle">Manage your preferences and security</p>
      </div>

      <div className="settings-grid">
        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="settings-card"
        >
          <div className="settings-card__header">
            <Palette size={18} />
            <h3>Appearance</h3>
          </div>
          <div className="settings-card__body">
            <div className="settings-item">
              <div className="settings-item__info">
                <span className="settings-item__label">
                  {theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
                  Theme
                </span>
                <span className="settings-item__desc">Switch between dark and light mode</span>
              </div>
              <button onClick={toggleTheme} className="settings-toggle">
                <div className={`settings-toggle__track ${theme === "light" ? "settings-toggle__track--on" : ""}`}>
                  <div className="settings-toggle__thumb" />
                </div>
                <span>{theme === "dark" ? "Dark" : "Light"}</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="settings-card"
        >
          <div className="settings-card__header">
            <Bell size={18} />
            <h3>Notifications</h3>
          </div>
          <div className="settings-card__body">
            <div className="settings-item">
              <div className="settings-item__info">
                <span className="settings-item__label">Push Notifications</span>
                <span className="settings-item__desc">Receive alerts for task updates and assignments</span>
              </div>
              <button onClick={() => setNotifications(!notifications)} className="settings-toggle">
                <div className={`settings-toggle__track ${notifications ? "settings-toggle__track--on" : ""}`}>
                  <div className="settings-toggle__thumb" />
                </div>
                <span>{notifications ? "On" : "Off"}</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="settings-card"
        >
          <div className="settings-card__header">
            <Shield size={18} />
            <h3>Security</h3>
          </div>
          <div className="settings-card__body">
            <div className="settings-item">
              <div className="settings-item__info">
                <span className="settings-item__label"><Lock size={14} /> Two-Factor Authentication</span>
                <span className="settings-item__desc">Add an extra layer of security to your account</span>
              </div>
              <span className="settings-badge settings-badge--coming">Coming Soon</span>
            </div>

            <div className="settings-item">
              <div className="settings-item__info">
                <span className="settings-item__label"><Eye size={14} /> Active Sessions</span>
                <span className="settings-item__desc">Manage your active login sessions</span>
              </div>
              <span className="settings-badge settings-badge--coming">Coming Soon</span>
            </div>
          </div>
        </motion.div>

        {/* Data */}
        {user?.role === "admin" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="settings-card"
          >
            <div className="settings-card__header">
              <FileText size={18} />
              <h3>Data & Export</h3>
            </div>
            <div className="settings-card__body">
              <div className="settings-item">
                <div className="settings-item__info">
                  <span className="settings-item__label"><Download size={14} /> Export Audit Logs</span>
                  <span className="settings-item__desc">Download all audit logs as CSV file</span>
                </div>
                <button onClick={handleExportAudit} disabled={exporting} className="btn btn--secondary btn--sm">
                  {exporting ? "Exporting..." : "Export CSV"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="settings-footer">
        <p>Keyboard shortcut: <kbd>Ctrl</kbd> + <kbd>K</kbd> to open Command Palette</p>
      </div>
    </div>
  );
};

export default SettingsPage;
