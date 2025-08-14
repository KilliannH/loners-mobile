import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

interface User {
  _id: string;
  username: string;
  email: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (googleUser: User, token: string, refreshToken?: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({} as any);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Intercepteur pour refresh token si 401
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      res => res,
      async (err) => {
        if (err.response?.status === 401) {
          const refreshToken = await SecureStore.getItemAsync("refreshToken");
          if (refreshToken) {
            try {
              const { data } = await api.post("/auth/refresh", { refreshToken });
              await SecureStore.setItemAsync("token", data.token);
              await SecureStore.setItemAsync("refreshToken", data.refreshToken || refreshToken);
              err.config.headers.Authorization = `Bearer ${data.token}`;
              return api.request(err.config); // Rejoue la requête
            } catch (refreshErr) {
              console.log("❌ Refresh token failed", refreshErr);
              await logout();
            }
          } else {
            await logout();
          }
        }
        return Promise.reject(err);
      }
    );
    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  // 🔹 Chargement initial
  useEffect(() => {
    (async () => {
      const storedUser = await SecureStore.getItemAsync("user");
      const token = await SecureStore.getItemAsync("token");

      console.log("📦 Récupéré depuis SecureStore:", { token, storedUser });

      if (storedUser && token) {
        setUser(JSON.parse(storedUser));
        try {
          const me = await api.get("/users/me");
          setUser(me.data);
          await SecureStore.setItemAsync("user", JSON.stringify(me.data));
        } catch (err) {
          console.log("⚠️ Impossible de récupérer /me :", err);
          // Tentative de refresh dans un autre bloc si nécessaire
        }
      }

      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    await SecureStore.setItemAsync("token", data.token);
    await SecureStore.setItemAsync("refreshToken", data.refreshToken || "");
    await SecureStore.setItemAsync("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const loginWithGoogle = async (googleUser: User, token: string, refreshToken?: string) => {
    await SecureStore.setItemAsync("token", token);
    if (refreshToken) {
      await SecureStore.setItemAsync("refreshToken", refreshToken);
    }
    await SecureStore.setItemAsync("user", JSON.stringify(googleUser));
    setUser(googleUser);
  };

  const signup = async (username: string, email: string, password: string) => {
    const { data } = await api.post("/auth/signup", { username, email, password });
    await SecureStore.setItemAsync("token", data.token);
    await SecureStore.setItemAsync("refreshToken", data.refreshToken || "");
    await SecureStore.setItemAsync("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = async () => {
    console.log("🚪 Logout triggered for user:", user);
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("refreshToken");
    await SecureStore.deleteItemAsync("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);