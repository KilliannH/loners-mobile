import api from "@/services/api";
import socket from "@/services/socket";
import { useNotificationStore } from "@/store/notificationStore";

let bound = false;

// Charge les non-lus depuis l’API
export async function preloadUnreadCounts() {
  try {
    const res = await api.get<{ event: string }[]>("/notifications/unread");
    const map: Record<string, number> = {};
    (res.data || []).forEach((n) => {
      map[n.event] = (map[n.event] || 0) + 1;
    });
    useNotificationStore.getState().setUnreadByRoom(map);
  } catch (e) {
    console.log("⚠️ preloadUnreadCounts error", e);
  }
}

export function bindNotificationSocket() {
  if (bound) return () => {};
  const { increment } = useNotificationStore.getState();

  const handler = ({ eventId, text }: { eventId: string; text?: string }) => {
    console.log("📥 [notif] message:notification reçu ->", eventId, text);
    increment(eventId, 1);
  };

  socket.on("message:notification", handler);
  bound = true;

  return () => {
    socket.off("message:notification", handler);
    bound = false;
  };
}