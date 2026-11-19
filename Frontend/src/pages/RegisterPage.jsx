import { useState } from "react";
import api from "../services/api";
import { scanInputs } from "../utils/attackDetection";
import { validatePassword } from "../utils/validatePassword";
import SecurityWarningModal from "../components/SecurityWarningModal";
import PasswordStrength from "../components/PasswordStrength";

const RegisterPage = ({ onSwitch }) => {
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [warning, setWarning] = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    const { username, email, password, confirm } = form;
    if (!username || !email || !password || !confirm) { setError("All fields are required."); return; }

    // ─── PAYLOAD DETECTION ───
    const threat = scanInputs({ username, email });
    if (threat) { setWarning(threat); return; }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Invalid email address."); return; }
    const checks = validatePassword(password);
    if (!Object.values(checks).every(Boolean)) { setError("Password does not meet requirements."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    setLoading(true);
    setError("");
    try {
      await api.register(username, email, password);
      setSuccess(true);
    } catch (e) {
      const data = e.response?.data;
      if (data?.errors) {
        setError(data.errors.map((err) => err.msg).join(", "));
      } else {
        setError(data?.error || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-white mb-2">Account created!</h2>
        <p className="text-gray-400 text-sm mb-6">You can now sign in with your credentials.</p>
        <button onClick={onSwitch} className="text-sm text-emerald-400 hover:text-emerald-300">← Back to login</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {warning && <SecurityWarningModal attackType={warning} onClose={() => setWarning(null)} />}
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <span className="text-3xl">🛡️</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-gray-400 text-sm mt-1">Secure registration</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              ⚠ {error}
            </div>
          )}

          <div className="space-y-4">
            {[
              { key: "username", label: "Username", type: "text", ph: "johndoe" },
              { key: "email", label: "Email", type: "email", ph: "john@example.com" },
            ].map(({ key, label, type, ph }) => (
              <div key={key}>
                <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
                <input type={type} value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder={ph} />
              </div>
            ))}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Password</label>
              <input type="password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="••••••••" />
              {form.password && <PasswordStrength password={form.password} />}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Confirm Password</label>
              <input type="password" value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="••••••••" />
            </div>
          </div>

          <button onClick={handle} disabled={loading}
            className="mt-6 w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-950 font-semibold py-3 rounded-xl transition-all duration-200 text-sm">
            {loading ? "Creating Account…" : "Create Account"}
          </button>

          <div className="mt-4 text-center">
            <button onClick={onSwitch} className="text-xs text-gray-500 hover:text-emerald-400 transition-colors">
              Already have an account? Sign in →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
