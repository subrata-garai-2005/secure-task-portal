import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { motion } from "framer-motion";
import { User, Mail, Shield, Calendar, Key, CheckCircle } from "lucide-react";
import PasswordStrength from "../components/PasswordStrength";

const ProfilePage = () => {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Password change
  const [showPwChange, setShowPwChange] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.getMe(token);
        setProfile(data.user);
      } catch (err) {
        setProfile({ username: user?.username, role: user?.role, email: "—" });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const handlePasswordChange = async () => {
    setPwError("");
    setPwSuccess(false);

    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirm) {
      setPwError("All fields are required"); return;
    }
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwError("New passwords do not match"); return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwError("Password must be at least 8 characters"); return;
    }

    setPwLoading(true);
    try {
      await api.changePassword(token, pwForm.currentPassword, pwForm.newPassword);
      setPwSuccess(true);
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (e) {
      setPwError(e.response?.data?.error || "Password change failed");
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page__header"><h1 className="page__title">Profile</h1></div>
        <div className="profile-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">Profile</h1>
      </div>

      <div className="profile-grid">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="profile-card"
        >
          <div className="profile-card__avatar">
            {profile?.username?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <h2 className="profile-card__name">{profile?.username}</h2>
          <span className="profile-card__role-badge">{profile?.role}</span>

          <div className="profile-card__details">
            <div className="profile-card__detail">
              <Mail size={14} />
              <span>{profile?.email || "—"}</span>
            </div>
            <div className="profile-card__detail">
              <Shield size={14} />
              <span>Role: {profile?.role}</span>
            </div>
            <div className="profile-card__detail">
              <Calendar size={14} />
              <span>Joined: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "N/A"}</span>
            </div>
          </div>
        </motion.div>

        {/* Password Change */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="profile-section"
        >
          <h3 className="profile-section__title">
            <Key size={16} /> Change Password
          </h3>

          {pwSuccess && (
            <div className="alert alert--success">
              <CheckCircle size={14} /> Password changed successfully!
            </div>
          )}

          {pwError && (
            <div className="alert alert--error">⚠ {pwError}</div>
          )}

          <div className="form-stack">
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                className="form-input"
                placeholder="••••••••"
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                className="form-input"
                placeholder="••••••••"
              />
              {pwForm.newPassword && <PasswordStrength password={pwForm.newPassword} />}
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={pwForm.confirm}
                onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                className="form-input"
                placeholder="••••••••"
              />
            </div>

            <button onClick={handlePasswordChange} disabled={pwLoading} className="btn btn--primary">
              {pwLoading ? "Changing..." : "Change Password"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
