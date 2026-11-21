import { useState } from "react";
import { scanInputs } from "../utils/attackDetection";
import { UserCheck, X } from "lucide-react";

const EditUserModal = ({ user, onClose, onSave, onWarning }) => {
  const [editForm, setEditForm] = useState({
    username: user.name || user.username || "",
    email: user.email || "",
    role: (user.role || "viewer").toLowerCase(),
    status: user.status || "Active",
  });
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const threat = scanInputs(editForm);
    if (threat) {
      onWarning(threat);
      return;
    }
    if (!editForm.username.trim() || !editForm.email.trim()) {
      setEditError("Username and email are required.");
      return;
    }
    setSaving(true);
    setEditError("");
    try {
      await onSave(user.id, editForm);
      onClose();
    } catch (err) {
      setEditError(err.response?.data?.error || err.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const displayId = typeof user.id === "string" ? user.id.slice(-6) : user.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#4880FF] flex items-center justify-center shrink-0">
              <UserCheck size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Edit User Account</h3>
              <span className="text-[11px] text-[var(--text-muted)] font-mono">User ID: #{displayId}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {editError && (
          <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            ⚠ {editError}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">Username</label>
            <input
              type="text"
              value={editForm.username}
              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              className="form-input"
              placeholder="Username"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">Email Address</label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="form-input"
              placeholder="email@example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">Role</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="form-input"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="form-input"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[var(--border-color)]">
          <button
            type="button"
            onClick={onClose}
            className="btn btn--secondary px-4 py-2 text-xs font-bold rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn btn--primary px-5 py-2 text-xs font-bold rounded-xl shadow-md shadow-blue-500/20"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;
