import { create } from "zustand";

type RoomStore = {
  activeRoomId: string | null;
  setActiveRoom: (id: string | null) => void;
};

export const useRoomStore = create<RoomStore>((set) => ({
  activeRoomId: null,
  setActiveRoom: (id) => set({ activeRoomId: id }),
}));