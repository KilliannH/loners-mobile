import axios from "axios";
import * as SecureStore from "expo-secure-store";

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

// 🗂️ Helpers
export const setTokens = async (token: string, refreshToken?: string) => {
  await SecureStore.setItemAsync("token", token);
  if (refreshToken) {
    await SecureStore.setItemAsync("refreshToken", refreshToken);
  }
};

export const clearTokens = async () => {
  await SecureStore.deleteItemAsync("token");
  await SecureStore.deleteItemAsync("refreshToken");
};

// 📌 Intercepteur requêtes → ajoute Authorization
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 📌 Intercepteur réponses → gère le refresh token
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
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    // ⛔ Si pas 401 → laisse passer
    if (err.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(err);
    }

    // 🛑 Empêche boucles infinies
    if (isRefreshing) {
      return new Promise(function (resolve, reject) {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        })
        .catch((error) => Promise.reject(error));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const storedRefreshToken = await SecureStore.getItemAsync("refreshToken");
      if (!storedRefreshToken) throw new Error("No refresh token stored");

      // 🔄 Appel à /auth/refresh
      const { data } = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/auth/refresh`,
        { refreshToken: storedRefreshToken }
      );

      const newToken = data?.token;
      const newRefreshToken = data?.refreshToken || storedRefreshToken;

      if (!newToken) throw new Error("No token in refresh response");

      // 💾 Stockage
      await setTokens(newToken, newRefreshToken);

      // ⏩ Rejoue la requête échouée
      processQueue(null, newToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
      }
      return api(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      await clearTokens();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;