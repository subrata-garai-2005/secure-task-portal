import { useState, useEffect, createContext, useContext } from "react";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("jwt_token"));

  useEffect(() => {
    if (token) {
      try {
        // Decode JWT payload (base64) — never trust this for auth, only display
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.exp * 1000 > Date.now()) {
          setUser({ username: payload.sub, role: payload.role });
        } else {
          logout();
        }
      } catch {
        logout();
      }
    }
  }, [token]);

  const login = (jwt) => {
    localStorage.setItem("jwt_token", jwt);
    setToken(jwt);
  };

  const logout = () => {
    localStorage.removeItem("jwt_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
