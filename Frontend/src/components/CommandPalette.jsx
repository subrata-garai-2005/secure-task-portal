import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ListTodo, BarChart3, User, Settings, Activity,
  Shield, Search, LogOut
} from "lucide-react";

const CommandPalette = ({ onNavigate, onLogout }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigate = (page) => {
    onNavigate?.(page);
    setOpen(false);
  };

  const items = [
    { id: "overview", label: "Go to Overview", icon: <LayoutDashboard size={16} />, group: "Navigation" },
    { id: "tasks", label: "Go to Tasks", icon: <ListTodo size={16} />, group: "Navigation" },
    { id: "analytics", label: "Go to Analytics", icon: <BarChart3 size={16} />, group: "Navigation" },
    { id: "users", label: "Go to Users", icon: <User size={16} />, group: "Navigation" },
    { id: "activity", label: "Go to Activity", icon: <Activity size={16} />, group: "Navigation" },
    { id: "profile", label: "Go to Profile", icon: <User size={16} />, group: "Navigation" },
    { id: "settings", label: "Go to Settings", icon: <Settings size={16} />, group: "Navigation" },
    {
      id: "logout",
      label: "Logout",
      icon: <LogOut size={16} />,
      group: "Actions",
      action: () => {
        onLogout?.();
        setOpen(false);
      },
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="cmd-overlay"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -16 }}
            transition={{ duration: 0.15 }}
            className="cmd-palette"
            onClick={(e) => e.stopPropagation()}
          >
            <Command>
              <div className="cmd-search">
                <Search size={16} className="text-zinc-400" />
                <Command.Input placeholder="Type a command or jump to page..." className="cmd-input" />
                <kbd className="cmd-kbd">ESC</kbd>
              </div>
              <Command.List className="cmd-list">
                <Command.Empty className="cmd-empty">No results found.</Command.Empty>
                {["Navigation", "Actions"].map((group) => (
                  <Command.Group key={group} heading={group} className="cmd-group">
                    {items.filter((i) => i.group === group).map((item) => (
                      <Command.Item
                        key={item.id}
                        value={item.label}
                        onSelect={() => (item.action ? item.action() : navigate(item.id))}
                        className="cmd-item"
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))}
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
