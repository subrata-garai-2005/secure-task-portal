import { useState } from "react";
import { scanInputs } from "../utils/attackDetection";

const AddUserModal = ({ onClose, onAdd, onWarning }) => {
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "Viewer", status: "Active" });
  const [addError, setAddError] = useState("");

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) { setAddError("Name and email are required."); return; }
    const threat = scanInputs(newUser);
    if (threat) { onWarning(threat); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) { setAddError("Invalid email."); return; }
    onAdd(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-emerald-400">+</span> Add New User
        </h3>
        {addError && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">⚠ {addError}</div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Full Name</label>
            <input type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="e.g. John Doe" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email</label>
            <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="john@example.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Role</label>
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors">
                <option>Admin</option><option>Editor</option><option>Viewer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Status</label>
              <select value={newUser.status} onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors">
                <option>Active</option><option>Inactive</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-semibold py-3 rounded-xl transition-all text-sm">
            Cancel
          </button>
          <button onClick={handleAddUser}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold py-3 rounded-xl transition-all text-sm">
            Add User
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;
