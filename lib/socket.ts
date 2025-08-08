import * as SecureStore from "expo-secure-store";
import { io } from "socket.io-client";

const URL = process.env.EXPO_PUBLIC_API_URL as string;

export async function createSocket() {
  const token = await SecureStore.getItemAsync("token");
  const socket = io(URL, {
    transports: ["websocket"],
    extraHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return socket;
}