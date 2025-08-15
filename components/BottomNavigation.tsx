import { useNotificationStore } from "@/store/notificationStore";
import { usePathname, useRouter } from "expo-router";
import { Home, MessageSquare, User } from "lucide-react-native";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BottomNavigation() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const unreadByRoom = useNotificationStore((s) => s.unreadByRoom);
  const totalUnread = useMemo(
    () => Object.values(unreadByRoom || {}).reduce((sum, n) => sum + (n || 0), 0),
    [unreadByRoom]
  );

  const getIconColor = (path: string) => (pathname === path ? "#000" : "#6b7280");

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        paddingVertical: 10,
        paddingBottom: insets.bottom || 10,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
      }}
    >
      <TouchableOpacity
        onPress={() => router.push("/")}
        style={{ alignItems: "center" }}
        accessibilityRole="button"
        accessibilityLabel={t("nav.home")}
      >
        <Home size={24} color={getIconColor("/")} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/profile")}
        style={{ alignItems: "center" }}
        accessibilityRole="button"
        accessibilityLabel={t("nav.profile")}
      >
        <User size={24} color={getIconColor("/profile")} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/messages")}
        style={{ alignItems: "center" }}
        accessibilityRole="button"
        accessibilityLabel={t("nav.messages")}
      >
        <View style={{ position: "relative" }}>
          <MessageSquare size={24} color={getIconColor("/messages")} />
          {totalUnread > 0 && (
            <View
              style={{
                position: "absolute",
                top: -6,
                right: -10,
                minWidth: 16,
                height: 16,
                paddingHorizontal: 4,
                backgroundColor: "#ef4444",
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
                {totalUnread > 99 ? "99+" : totalUnread}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}