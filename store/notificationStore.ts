import { create } from "zustand";

type UnreadMap = Record<string, number>;

type State = {
  unreadByRoom: UnreadMap;
};

type Actions = {
  setUnreadByRoom: (map: UnreadMap) => void;
  setCount: (eventId: string, count: number) => void;
  increment: (eventId: string, delta?: number) => void;
  markAsRead: (eventId: string) => void;
  reset: () => void;
};

export const useNotificationStore = create<State & Actions>((set, get) => ({
  unreadByRoom: {},

  setUnreadByRoom: (map) => set({ unreadByRoom: { ...map } }),
  setCount: (eventId, count) =>
    set({ unreadByRoom: { ...get().unreadByRoom, [eventId]: Math.max(0, count) } }),
  increment: (eventId, delta = 1) => {
    const cur = get().unreadByRoom[eventId] || 0;
    set({ unreadByRoom: { ...get().unreadByRoom, [eventId]: cur + delta } });
  },
  markAsRead: (eventId) => {
    const next = { ...get().unreadByRoom };
    next[eventId] = 0;
    set({ unreadByRoom: next });
  },
  reset: () => set({ unreadByRoom: {} }),
}));
