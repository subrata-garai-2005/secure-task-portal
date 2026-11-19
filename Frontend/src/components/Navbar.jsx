import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between bg-gray-900/80 backdrop-blur sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <span className="text-xl">🔐</span>
        <span className="font-bold text-white">SecureVault</span>
        <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">Protected</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">
          {user?.username} · <span className="text-emerald-400">{user?.role}</span>
        </span>
        <button onClick={logout}
          className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded-lg transition-colors">
          Sign out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
