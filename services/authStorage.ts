import * as SecureStore from "expo-secure-store";

const ACCESS_KEY = "token";
const REFRESH_KEY = "refreshToken";
const USER_KEY = "user";

export async function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS_KEY);
}
export async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_KEY);
}
export async function setTokens(access: string, refresh?: string) {
  await SecureStore.setItemAsync(ACCESS_KEY, access);
  if (refresh) await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}
export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}
export async function getStoredUser() {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}
export async function setStoredUser(u: any) {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(u));
}
export async function clearStoredUser() {
  await SecureStore.deleteItemAsync(USER_KEY);
}