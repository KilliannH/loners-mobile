import { io, Socket } from "socket.io-client";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "";
let ORIGIN = API_URL;
try {
  const u = new URL(API_URL);
  ORIGIN = `${u.protocol}//${u.host}`;
} catch {}

const SOCKET_PATH = process.env.EXPO_PUBLIC_SOCKET_PATH || "/socket.io";

const raw: Socket = io(ORIGIN, {
  path: SOCKET_PATH,
  transports: ["websocket"],
  autoConnect: false,
});

let lastIdentifiedUserId: string | null = null;
raw.io.on("reconnect", () => {
  if (lastIdentifiedUserId) {
    raw.emit("identify", lastIdentifiedUserId);
  }
});

class SocketClient {
  constructor(private s: Socket) {}

  get connected() {
    return this.s.connected;
  }

  connect = async () => {
    if (!this.s.connected) this.s.connect();
  };

  identify = async (userId: string) => {
    lastIdentifiedUserId = userId;
    await this.connect();
    this.s.emit("identify", userId);
  };

  on = (event: string, handler: (...args: any[]) => void) => {
    this.s.on(event, handler);
  };

  off = (event: string, handler?: (...args: any[]) => void) => {
    if (handler) this.s.off(event, handler);
    else this.s.removeAllListeners(event);
  };

  emit = (event: string, payload?: any) => {
    this.s.emit(event, payload);
  };
}

raw.on("connect", () => {
  console.log("✅ [socket] connecté au serveur", raw.id);
});

raw.on("disconnect", (reason) => {
  console.log("❌ [socket] déconnecté:", reason);
});

raw.on("connect_error", (err) => {
  console.log("⚠️ [socket] erreur de connexion:", err.message);
});

const socket = new SocketClient(raw);
export default socket;