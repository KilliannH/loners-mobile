import api from "@/services/api";
import socket from "@/services/socket";
import { useNotificationStore } from "../store/notificationStore";

let bound = false;

/** Appelle ça au boot (RootLayout) pour remplir les non-lus depuis l’API */
export async function preloadUnreadCounts() {
  try {
    const res = await api.get<{ event: string }[]>("/notifications/unread");
    const map: Record<string, number> = {};
    (res.data || []).forEach((n) => {
      map[n.event] = (map[n.event] || 0) + 1;
    });
    useNotificationStore.getState().setUnreadByRoom(map);
  } catch (e) {
    // silencieux
  }
}

/** Abonne le socket à message:notification -> incrémente le compteur */
export function bindNotificationSocket() {
  if (bound) return () => {};
  const { increment } = useNotificationStore.getState();

  const handler = ({ eventId }: { eventId: string }) => {
    increment(eventId, 1);
  };

  socket.on("message:notification", handler);
  bound = true;

  // retourne un unbind pour cleanup si besoin
  return () => {
    socket.off("message:notification", handler);
    bound = false;
  };
}

/** Marque une room comme lue côté API + store local */
export async function markRoomAsRead(eventId: string) {
  try {
    await api.post(`/notifications/mark-read/${eventId}`);
  } catch {}
  useNotificationStore.getState().markAsRead(eventId);
}
