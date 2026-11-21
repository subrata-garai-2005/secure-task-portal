import { useState } from "react";
import { scanInputs } from "../utils/attackDetection";
import { UserPlus, X } from "lucide-react";

const AddUserModal = ({ onClose, onAdd, onWarning }) => {
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "viewer",
    status: "Active",
  });
  const [addError, setAddError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAddUser = async () => {
    if (!newUser.username.trim() || !newUser.email.trim()) {
      setAddError("Username and email are required.");
      return;
    }
    const threat = scanInputs(newUser);
    if (threat) {
      onWarning(threat);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      setAddError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    setAddError("");
    try {
      await onAdd({
        username: newUser.username.trim(),
        email: newUser.email.trim(),
        password: newUser.password.trim() || "User@12345",
        role: newUser.role.toLowerCase(),
        status: newUser.status,
      });
      onClose();
    } catch (err) {
      setAddError(err.response?.data?.error || err.message || "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <UserPlus size={18} className="text-emerald-400" />
            Add New User
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {addError && (
          <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            ⚠ {addError}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Username</label>
            <input
              type="text"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              className="form-input"
              placeholder="e.g. alexandra"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Email Address</label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="form-input"
              placeholder="alexandra@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Initial Password <span className="text-[var(--text-muted)]">(optional, defaults to User@12345)</span>
            </label>
            <input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="form-input"
              placeholder="Min 8 chars, mixed case & symbol"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="form-input"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Status</label>
              <select
                value={newUser.status}
                onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                className="form-input"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[var(--border-color)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAddUser}
            disabled={submitting}
            className="btn btn--primary px-5 py-2 text-sm font-medium"
          >
            {submitting ? "Creating…" : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;
