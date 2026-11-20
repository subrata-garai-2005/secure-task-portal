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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <UserCheck size={18} className="text-blue-400" />
            Edit User #{displayId}
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
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
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Username</label>
            <input
              type="text"
              value={editForm.username}
              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              className="form-input"
              placeholder="Username"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Email Address</label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="form-input"
              placeholder="email@example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Role</label>
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
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Status</label>
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

        <div className="flex gap-2.5 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="btn btn--secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn btn--primary flex-1"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;
