import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import { motion } from "framer-motion";
import {
  Sun, Moon, Bell, Shield, Download, Palette,
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
        <h1 className="page__title">Platform Settings</h1>
        <p className="page__subtitle">Client preferences, visual appearance and security configuration</p>
      </div>

      <div className="settings-grid">
        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="settings-card"
        >
          <div className="settings-card__header">
            <Palette size={18} className="text-[#4880FF]" />
            <h3>Interface Theme</h3>
          </div>
          <div className="settings-card__body">
            <div className="settings-item">
              <div className="settings-item__info">
                <span className="settings-item__label flex items-center gap-1.5">
                  {theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
                  Theme Mode
                </span>
                <span className="settings-item__desc">Toggle between high-contrast dark and light themes</span>
              </div>
              <button onClick={toggleTheme} className="settings-toggle cursor-pointer" aria-label="Toggle Theme">
                <div className={`settings-toggle__track ${theme === "light" ? "settings-toggle__track--on" : ""}`}>
                  <div className="settings-toggle__thumb" />
                </div>
                <span className="text-xs font-bold text-[#4880FF]">{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="settings-card"
        >
          <div className="settings-card__header">
            <Bell size={18} className="text-[#8280FF]" />
            <h3>Notification Preferences</h3>
          </div>
          <div className="settings-card__body">
            <div className="settings-item">
              <div className="settings-item__info">
                <span className="settings-item__label">Activity & Assignment Alerts</span>
                <span className="settings-item__desc">Receive real-time notifications for task assignments and status updates</span>
              </div>
              <button onClick={() => setNotifications(!notifications)} className="settings-toggle cursor-pointer" aria-label="Toggle notifications">
                <div className={`settings-toggle__track ${notifications ? "settings-toggle__track--on" : ""}`}>
                  <div className="settings-toggle__thumb" />
                </div>
                <span className="text-xs font-bold text-[#4880FF]">{notifications ? "Enabled" : "Muted"}</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="settings-card"
        >
          <div className="settings-card__header">
            <Shield size={18} className="text-[#00B69B]" />
            <h3>Security Architecture</h3>
          </div>
          <div className="settings-card__body">
            <div className="settings-item">
              <div className="settings-item__info">
                <span className="settings-item__label flex items-center gap-1.5">
                  <Lock size={14} /> Two-Factor Authentication (2FA)
                </span>
                <span className="settings-item__desc">Hardware key / TOTP authenticator protection</span>
              </div>
              <span className="badge badge--info">Enterprise OAuth</span>
            </div>

            <div className="settings-item">
              <div className="settings-item__info">
                <span className="settings-item__label flex items-center gap-1.5">
                  <Eye size={14} /> Active Session Integrity
                </span>
                <span className="settings-item__desc">Automatic token invalidation and device fingerprinting</span>
              </div>
              <span className="badge badge--success">Active</span>
            </div>
          </div>
        </motion.div>

        {/* Data & Export */}
        {user?.role === "admin" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="settings-card"
          >
            <div className="settings-card__header">
              <FileText size={18} className="text-[#FEC53D]" />
              <h3>Audit & Compliance Export</h3>
            </div>
            <div className="settings-card__body">
              <div className="settings-item">
                <div className="settings-item__info">
                  <span className="settings-item__label flex items-center gap-1.5">
                    <Download size={14} /> Export Audit Log Records
                  </span>
                  <span className="settings-item__desc">Download complete cryptographic audit trails as CSV</span>
                </div>
                <button
                  onClick={handleExportAudit}
                  disabled={exporting}
                  className="btn btn--primary btn--sm flex items-center gap-1.5"
                >
                  <Download size={14} />
                  {exporting ? "Generating CSV..." : "Export CSV"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
