import { useFocusEffect, useRouter } from "expo-router";
import { MessageSquare } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import api from "@/services/api";
import { bindNotificationSocket } from "@/services/notificationSocket";
import { toastError } from "@/utils/toast";
import { useNotificationStore } from "../../store/notificationStore";

type RoomItem = {
  _id: string;
  name: string;
  location?: { name?: string };
};

export default function ChatRoomsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);

  const unreadByRoom = useNotificationStore((s) => s.unreadByRoom);
  const setUnreadByRoom = useNotificationStore((s) => s.setUnreadByRoom);

  const fetchRoomsAndUnread = useCallback(async () => {
    try {
      setLoading(true);
      const [roomsRes, unreadRes] = await Promise.all([
        api.get<RoomItem[]>("/chat/rooms"),
        api.get<{ event: string }[]>("/notifications/unread"),
      ]);

      setRooms(roomsRes.data ?? []);

      // map { eventId: count }
      const countByRoom: Record<string, number> = {};
      (unreadRes.data ?? []).forEach((n) => {
        const id = n.event;
        countByRoom[id] = (countByRoom[id] || 0) + 1;
      });
      setUnreadByRoom(countByRoom);
    } catch (e) {
      console.log("❌ chat rooms load error", e);
      toastError("chatRooms.toast.fetchError");
    } finally {
      setLoading(false);
    }
  }, [setUnreadByRoom]);

  useFocusEffect(
    useCallback(() => {
      fetchRoomsAndUnread();
      const unbind = bindNotificationSocket(); // écoute des notifs en temps réel
      return () => {
        if (unbind) unbind();
      };
    }, [fetchRoomsAndUnread])
  );

  const renderItem = useCallback(
    ({ item }: { item: RoomItem }) => {
      const unread = unreadByRoom[item._id] || 0;
      return (
        <TouchableOpacity
          onPress={() => router.push(`/events/${item._id}/chat`)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#fff",
            padding: 12,
            borderRadius: 8,
            marginBottom: 8,
          }}
        >
          <MessageSquare size={20} color="#2563eb" style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "600" }}>{item.name}</Text>
            {item.location?.name && (
              <Text style={{ fontSize: 12, color: "#6b7280" }}>
                {item.location.name}
              </Text>
            )}
          </View>
          {unread > 0 && (
            <View
              style={{
                backgroundColor: "#ef4444",
                borderRadius: 9999,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text style={{ color: "white", fontSize: 12 }}>{unread}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [router, unreadByRoom]
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#f3f4f6" }}>
      <FlatList
        data={rooms}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={{ color: "#6b7280", textAlign: "center" }}>
            {t("chatRooms.noRooms")}
          </Text>
        }
      />
    </View>
  );
}
