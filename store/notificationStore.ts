import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type UnreadMap = Record<string, number>;

type NotificationStore = {
  unreadByRoom: UnreadMap;
  setUnreadByRoom: (map: UnreadMap) => void;
  setCount: (roomId: string, count: number) => void;
  increment: (roomId: string, delta?: number) => void;
  markAsRead: (roomId: string) => void;
  reset: () => void;
};

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      unreadByRoom: {},

      setUnreadByRoom: (map) => set({ unreadByRoom: { ...map } }),

      setCount: (roomId, count) =>
        set({
          unreadByRoom: {
            ...get().unreadByRoom,
            [roomId]: Math.max(0, count),
          },
        }),

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
    }),
    {
      name: "notification-storage",
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);
