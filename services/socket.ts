// services/socket.ts
import { io, Socket } from "socket.io-client";

// ⚠️ Ton REST est sans doute sur "https://domaine.com/api"
// On extrait l'ORIGINE pour le socket: "https://domaine.com"
const API_URL = process.env.EXPO_PUBLIC_API_URL || "";
let ORIGIN = API_URL;
try {
  const u = new URL(API_URL);
  ORIGIN = `${u.protocol}//${u.host}`;
} catch { /* en dev si URL relative, on garde tel quel */ }

// Si tu changes le path côté serveur (ici tu es sur le défaut "/socket.io"), adapte-le via env :
const SOCKET_PATH = process.env.EXPO_PUBLIC_SOCKET_PATH || "/socket.io";

const raw: Socket = io(ORIGIN, {
  path: SOCKET_PATH,
  transports: ["websocket"],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  forceNew: true,
});

if (__DEV__) {
  raw.on("connect", () => console.log("🔌 socket connected", raw.id));
  raw.on("disconnect", (r) => console.log("🔌 socket disconnected:", r));
  raw.on("connect_error", (e) =>
    console.log("⚠️ socket connect_error:", e?.message || e)
  );
  raw.io.on("reconnect_attempt", (n) =>
    console.log("🔁 socket reconnect attempt:", n)
  );
}

// On garde en mémoire le dernier userId identifié pour le ré-émettre auto à la reconnexion
let lastIdentifiedUserId: string | null = null;

raw.io.on("reconnect", () => {
  if (lastIdentifiedUserId) {
    raw.emit("identify", lastIdentifiedUserId);
  }
});

class SocketClient {
  private s: Socket;
  constructor(s: Socket) {
    this.s = s;
  }

  get connected() {
    return this.s.connected;
  }

  connect = async () => {
    if (!this.s.connected) this.s.connect();
  };

  disconnect = () => {
    if (this.s.connected) this.s.disconnect();
  };

  identify = async (userId: string) => {
    lastIdentifiedUserId = userId;
    if (!this.s.connected) await this.connect();
    this.s.emit("identify", userId);
  };

  join = async (roomId: string) => {
    if (!this.s.connected) await this.connect();
    this.s.emit("join", roomId);
  };

  leave = (roomId: string) => {
    this.s.emit("leave", roomId);
  };

  emit = (event: string, payload?: any) => this.s.emit(event, payload);
  on = (event: string, handler: (...args: any[]) => void) => this.s.on(event, handler);
  off = (event: string, handler?: (...args: any[]) => void) =>
    handler ? this.s.off(event, handler) : this.s.removeAllListeners(event);
}

const socket = new SocketClient(raw);
export default socket;
