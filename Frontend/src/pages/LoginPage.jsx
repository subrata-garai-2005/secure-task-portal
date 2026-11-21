import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { scanInputs } from "../utils/attackDetection";
import SecurityWarningModal from "../components/SecurityWarningModal";
import { Layers, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";

const LoginPage = ({ onSwitch }) => {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [warning, setWarning] = useState(null);

  const handle = async () => {
    if (locked) return;
    if (!form.username.trim() || !form.password) {
      setError("Please enter both username/email and password.");
      return;
    }

    // ─── PAYLOAD DETECTION ───
    const threat = scanInputs({ username: form.username });
    if (threat) {
      setWarning(threat);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { token } = await api.login(form.username.trim(), form.password);
      login(token);
    } catch (e) {
      console.error("Login failed:", e);
      const data = e.response?.data;
      if (e.code === "ERR_NETWORK" || e.message?.includes("Network Error")) {
        setError("Cannot connect to server. Please verify backend is running and VITE_API_URL is configured.");
        return;
      }

      const next = attempts + 1;
      setAttempts(next);
      if (next >= 5) {
        setLocked(true);
        setError("Too many failed attempts. Account login locked for 30 seconds.");
        setTimeout(() => {
          setLocked(false);
          setAttempts(0);
        }, 30000);
      } else {
        const msg = data?.error || data?.message || "Invalid credentials provided.";
        setError(`${msg} (${5 - next} attempt${5 - next === 1 ? "" : "s"} remaining)`);
      }
    } finally {
      setLoading(false);
    }
  };

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
              <h2 className="auth-card__title">Login to Account</h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">Please enter your email and password to continue</p>
            </div>
          </div>

          {error && (
            <div className="auth-alert auth-alert--error">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="auth-form">
            <div className="auth-field">
              <label htmlFor="login-username">Username or Email</label>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handle()}
                className="auth-input"
                placeholder="admin or name@example.com"
                disabled={locked}
              />
            </div>

            <div className="auth-field">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-[#4880FF] hover:underline flex items-center gap-1"
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handle()}
                className="auth-input"
                placeholder="••••••••"
                disabled={locked}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[var(--border-color)] text-[#4880FF] focus:ring-[#4880FF]"
                />
                Remember Password
              </label>
              <span className="text-[#4880FF] cursor-pointer hover:underline">Forgot Password?</span>
            </div>

            <button
              onClick={handle}
              disabled={loading || locked}
              className="auth-btn-submit"
            >
              {loading ? "Authenticating…" : locked ? "Account Locked" : "Sign In"}
              {!loading && !locked && <ArrowRight size={15} />}
            </button>
          </div>

          <button onClick={onSwitch} className="auth-switch-link">
            Don't have an account? <span className="font-bold underline">Create Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
