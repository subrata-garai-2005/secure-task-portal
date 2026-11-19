import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { scanInputs } from "../utils/attackDetection";
import SecurityWarningModal from "../components/SecurityWarningModal";

const LoginPage = ({ onSwitch }) => {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [warning, setWarning] = useState(null);

  const handle = async () => {
    if (locked) return;
    if (!form.username || !form.password) { setError("All fields required"); return; }

    // ─── PAYLOAD DETECTION ───
    const threat = scanInputs(form);
    if (threat) { setWarning(threat); return; }

    setLoading(true);
    setError("");
    try {
      const { token } = await api.login(form.username, form.password);
      login(token);
    } catch (e) {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= 5) {
        setLocked(true);
        setError("Too many attempts. Account locked for 30 seconds.");
        setTimeout(() => { setLocked(false); setAttempts(0); }, 30000);
      } else {
        const msg = e.response?.data?.error || "Invalid credentials.";
        setError(`${msg} ${5 - next} attempt(s) remaining.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {warning && <SecurityWarningModal attackType={warning} onClose={() => setWarning(null)} />}
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <span className="text-3xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">SecureVault</h1>
          <p className="text-gray-400 text-sm mt-1">Enterprise security dashboard</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-6">Sign in</h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
              <span className="mt-0.5">⚠</span> {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Username</label>
              <input type="text" autoComplete="username" value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Enter username" disabled={locked} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Password</label>
              <input type="password" autoComplete="current-password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handle()}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="••••••••" disabled={locked} />
            </div>
          </div>

          <button onClick={handle} disabled={loading || locked}
            className="mt-6 w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-950 font-semibold py-3 rounded-xl transition-all duration-200 text-sm">
            {loading ? "Authenticating…" : locked ? "Locked" : "Sign In"}
          </button>

          <div className="mt-4 text-center">
            <button onClick={onSwitch} className="text-xs text-gray-500 hover:text-emerald-400 transition-colors">
              Don't have an account? Register →
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-600 text-center">Demo: admin / Admin@123</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4">
          {["JWT Auth", "Rate Limited", "XSS Protected", "Payload Detection"].map((b) => (
            <span key={b} className="text-xs text-gray-600 flex items-center gap-1">
              <span className="text-emerald-600">✓</span> {b}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
