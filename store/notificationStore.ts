import { create } from "zustand";

type UnreadMap = Record<string, number>;

type NotificationStore = {
  unreadByRoom: UnreadMap;
  increment: (roomId: string, delta?: number) => void;
  markAsRead: (roomId: string) => void;
  reset: () => void;
};

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  unreadByRoom: {},

  increment: (roomId, delta = 1) => {
    const current = get().unreadByRoom[roomId] || 0;
    set({
      unreadByRoom: {
        ...get().unreadByRoom,
        [roomId]: current + delta,
      },
    });
  },

  markAsRead: (roomId) => {
    set({
      unreadByRoom: {
        ...get().unreadByRoom,
        [roomId]: 0,
      },
    });
  },

  reset: () => set({ unreadByRoom: {} }),
}));