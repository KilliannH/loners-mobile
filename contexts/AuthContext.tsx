import { preloadUnreadCounts } from "@/services/notificationSocket";
import socket from "@/services/socket";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import api, { clearTokens, setTokens } from "../services/api";

interface User {
  _id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (googleUser: User, token: string, refreshToken?: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: User | null) => void;
  refreshUser: () => Promise<void>; 
}

export const AuthContext = createContext<AuthContextType>({} as any);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, _setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const setUser = (u: User | null) => {
    _setUser(u);
    if (u) SecureStore.setItemAsync("user", JSON.stringify(u));
    else SecureStore.deleteItemAsync("user");
  };

  const refreshUser = async () => {
    try {
      const me = await api.get<User>("/users/me", { headers: { "Cache-Control": "no-cache" }, params: { _ts: Date.now() }});
      setUser(me.data);
    } catch (e) {
      console.log("refreshUser failed", e);
    }
  };

  // Chargement initial
  useEffect(() => {
    (async () => {
      const storedUser = await SecureStore.getItemAsync("user");
      const token = await SecureStore.getItemAsync("token");

      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser));
          const me = await api.get("/users/me");
          setUser(me.data);
          await SecureStore.setItemAsync("user", JSON.stringify(me.data));
        } catch (err) {
          console.log("⚠️ Impossible de récupérer /me :", err);
        }
      }

      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    preloadUnreadCounts();
    const { data } = await api.post("/auth/login", { email, password });
    await setTokens(data.token, data.refreshToken);
    await SecureStore.setItemAsync("user", JSON.stringify(data.user));
    setUser(data.user);
    await socket.connect();
    await socket.identify(data.user._id);
  };

  const loginWithGoogle = async (googleUser: User, token: string, refreshToken?: string) => {
    preloadUnreadCounts();
    await setTokens(token, refreshToken);
    await SecureStore.setItemAsync("user", JSON.stringify(googleUser));
    setUser(googleUser);
  };

  const signup = async (username: string, email: string, password: string) => {
    const { data } = await api.post("/auth/signup", { username, email, password });
    await setTokens(data.token, data.refreshToken);
    await SecureStore.setItemAsync("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = async () => {
    console.log("🚪 Logout triggered for user:", user?.username);
    await clearTokens();
    await SecureStore.deleteItemAsync("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, loginWithGoogle, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
