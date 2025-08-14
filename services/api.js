import axios from "axios";
import * as SecureStore from "expo-secure-store";

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer le refresh token
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  res => res,
  async (err) => {
    if (err.response?.status === 401) {
      const refreshToken = await SecureStore.getItemAsync("refreshToken");

      if (!refreshToken) {
        console.log("❌ No refresh token available");
        return Promise.reject(err);
      }

      try {
        const { data } = await api.post("/auth/refresh", { refreshToken });
        await SecureStore.setItemAsync("token", data.token);
        if (data.refreshToken) {
          await SecureStore.setItemAsync("refreshToken", data.refreshToken);
        }

        err.config.headers.Authorization = `Bearer ${data.token}`;
        return api.request(err.config); // rejoue la requête
      } catch (refreshErr) {
        console.log("❌ Refresh token failed", refreshErr);
        await SecureStore.deleteItemAsync("token");
        await SecureStore.deleteItemAsync("refreshToken");
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(err);
  }
);

export default api;