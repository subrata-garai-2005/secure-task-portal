import { useState, createContext, useContext } from "react";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("jwt_token"));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("jwt_token");
    if (!saved) return null;
    try {
      const parts = saved.split(".");
      if (parts.length < 2) return null;
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp && payload.exp * 1000 > Date.now()) {
        return { id: payload.id, username: payload.sub, role: payload.role };
      }
      localStorage.removeItem("jwt_token");
      return null;
    } catch {
      localStorage.removeItem("jwt_token");
      return null;
    }
  });

  const logout = () => {
    localStorage.removeItem("jwt_token");
    setToken(null);
    setUser(null);
  };

  const login = (jwt) => {
    localStorage.setItem("jwt_token", jwt);
    setToken(jwt);
    try {
      const parts = jwt.split(".");
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1]));
        setUser({ id: payload.id, username: payload.sub, role: payload.role });
      } else {
        setUser({ username: "user", role: "viewer" });
      }
    } catch {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
