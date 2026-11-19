import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";

// ─── App Root ─────────────────────────────────────────────────────────────────
const AppInner = () => {
  const { user } = useAuth();
  const [page, setPage] = useState("login");

  if (user) return <Dashboard />;
  if (page === "login") return <LoginPage onSwitch={() => setPage("register")} />;
  return <RegisterPage onSwitch={() => setPage("login")} />;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ThemeProvider>
  );
}