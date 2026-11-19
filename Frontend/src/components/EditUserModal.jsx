import { useState } from "react";
import { scanInputs } from "../utils/attackDetection";

const EditUserModal = ({ user, onClose, onSave, onWarning }) => {
  const [editForm, setEditForm] = useState({
    username: user.name,
    email: user.email || "",
    role: user.role.toLowerCase(),
    status: user.status,
  });
  const [editError, setEditError] = useState("");

  const handleSave = async () => {
    const threat = scanInputs(editForm);
    if (threat) { onWarning(threat); return; }
    if (!editForm.username || !editForm.email) { setEditError("Username and email are required."); return; }
    try {
      await onSave(user.id, editForm);
      onClose();
    } catch (err) {
      setEditError(err.message || "Update failed.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-blue-400">✏️</span> Edit User #{user.id}
        </h3>
        {editError && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">⚠ {editError}</div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Username</label>
            <input type="text" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Username" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email</label>
            <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="email@example.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Role</label>
              <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors">
                <option value="admin">Admin</option><option value="editor">Editor</option><option value="viewer">Viewer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Status</label>
              <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors">
                <option value="Active">Active</option><option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-semibold py-3 rounded-xl transition-all text-sm">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 bg-blue-500 hover:bg-blue-400 text-white font-semibold py-3 rounded-xl transition-all text-sm">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;
