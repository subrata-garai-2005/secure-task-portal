import { useAuth } from "../context/AuthContext";
import { Layers, ShieldCheck, LogOut } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="h-[70px] border-b border-[var(--border-color)] px-8 flex items-center justify-between bg-[var(--bg-secondary)] sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#4880FF] text-white flex items-center justify-center shadow-md shadow-[#4880FF]/30">
          <Layers size={18} />
        </div>
        <div className="flex items-center">
          <span className="font-extrabold text-lg text-[var(--text-primary)]">Dash<span className="text-[#4880FF]">Stack</span></span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4880FF] to-[#8280FF] text-white font-bold flex items-center justify-center text-xs">
            {user?.username?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-[var(--text-primary)]">{user?.username}</span>
            <span className="text-[10px] font-semibold text-[var(--text-muted)] capitalize">{user?.role}</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="btn btn--ghost btn--sm text-red-400 hover:text-red-500 hover:bg-red-500/10"
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
