import { useState } from "react";
import api from "../services/api";
import { scanInputs } from "../utils/attackDetection";
import { validatePassword } from "../utils/validatePassword";
import SecurityWarningModal from "../components/SecurityWarningModal";
import PasswordStrength from "../components/PasswordStrength";
import { Layers, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

const RegisterPage = ({ onSwitch }) => {
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [warning, setWarning] = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    const { username, email, password, confirm } = form;
    if (!username.trim() || !email.trim() || !password || !confirm) {
      setError("All fields are required.");
      return;
    }

    // ─── PAYLOAD DETECTION (Scan for XSS / SQLi) ───
    const threat = scanInputs({ username, email });
    if (threat) {
      setWarning(threat);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please provide a valid email address.");
      return;
    }

    const checks = validatePassword(password);
    if (!Object.values(checks).every(Boolean)) {
      setError("Password must have at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await api.register(username.trim(), email.trim(), password);
      setSuccess(true);
    } catch (e) {
      console.error("Registration error:", e);
      if (e.code === "ERR_NETWORK" || e.message?.includes("Network Error")) {
        setError("Cannot connect to server. Please verify backend is running and VITE_API_URL is configured.");
        return;
      }
      const data = e.response?.data;
      if (data?.errors && Array.isArray(data.errors)) {
        setError(data.errors.map((err) => err.msg).join(", "));
      } else {
        setError(data?.error || data?.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-wrapper">
        <div className="auth-container">
          <div className="auth-card" style={{ textAlign: "center", alignItems: "center" }}>
            <div className="auth-brand__icon" style={{ margin: "0 auto 12px auto" }}>
              <CheckCircle2 size={30} />
            </div>
            <h2 className="auth-card__title" style={{ fontSize: "22px" }}>Account Created</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.5", margin: "4px 0 16px 0" }}>
              Your credentials have been securely provisioned. You can now sign in with your username and password.
            </p>
            <button
              onClick={onSwitch}
              className="auth-btn-submit"
            >
              Proceed to Sign In <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      {warning && <SecurityWarningModal attackType={warning} onClose={() => setWarning(null)} />}

      <div className="auth-container">
        {/* Brand Header */}
        <div className="auth-brand">
          <div className="auth-brand__icon">
            <Layers size={28} />
          </div>
          <h1 className="auth-brand__title">
            Dash<span>Stack</span>
          </h1>
          <p className="auth-brand__subtitle">Enterprise Access & Secure Task Management</p>
        </div>

        {/* Card */}
        <div className="auth-card">
          <div className="auth-card__header">
            <div>
              <h2 className="auth-card__title">Create Account</h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">Sign up for a secure account</p>
            </div>
            <span className="badge badge--success">OWASP A07</span>
          </div>

          {error && (
            <div className="auth-alert auth-alert--error">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="auth-form">
            <div className="auth-field">
              <label htmlFor="reg-username">Username</label>
              <input
                id="reg-username"
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handle()}
                className="auth-input"
                placeholder="e.g. sarah_connor"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="reg-email">Email Address</label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handle()}
                className="auth-input"
                placeholder="sarah@example.com"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handle()}
                className="auth-input"
                placeholder="••••••••"
              />
              {form.password && <PasswordStrength password={form.password} />}
            </div>

            <div className="auth-field">
              <label htmlFor="reg-confirm">Confirm Password</label>
              <input
                id="reg-confirm"
                type="password"
                autoComplete="new-password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handle()}
                className="auth-input"
                placeholder="••••••••"
              />
            </div>

            <button
              onClick={handle}
              disabled={loading}
              className="auth-btn-submit"
            >
              {loading ? "Creating Account…" : "Create Account"}
              {!loading && <ArrowRight size={15} />}
            </button>
          </div>

          <button onClick={onSwitch} className="auth-switch-link">
            Already have an account? <span className="font-bold underline">Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
