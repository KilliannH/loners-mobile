import { useNotificationStore } from "@/store/notificationStore";
import { useRoomStore } from "@/store/roomStore";
import Toast from "react-native-toast-message";
import socket from "./socket";

let bound = false;

export function bindNotificationSocket() {
  if (bound) return () => {};
  const { increment } = useNotificationStore.getState();

  const handler = ({
    roomId,
    text,
  }: {
    roomId: string;
    text?: string;
  }) => {
    const activeRoomId = useRoomStore.getState().activeRoomId;

    if (activeRoomId !== roomId) {
      increment(roomId);

      Toast.show({
        type: "info",
        text1: "Nouveau message",
        text2: text || "Vous avez un nouveau message.",
      });
    }
  };

  socket.on("message:notification", handler);
  bound = true;

  return () => {
    socket.off("message:notification", handler);
    bound = false;
  };
}