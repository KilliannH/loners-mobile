import { useNotificationStore } from "@/store/notificationStore";
import { usePathname, useRouter } from "expo-router";
import { Home, MessageSquare, User } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BottomNavigation() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const getIconColor = (path: string) => (pathname === path ? "#000" : "#6b7280");

  // 🔴 Étape 1 : récupérer tous les non-lus
  const unreadByRoom = useNotificationStore((s) => s.unreadByRoom);
  const unreadTotal = Object.values(unreadByRoom).reduce((sum, count) => sum + count, 0);

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

          {unreadTotal > 0 && (
            <View
              style={{
                position: "absolute",
                top: -6,
                right: -10,
                backgroundColor: "#ef4444", // même rouge que dans tes listes
                borderRadius: 9999,
                paddingHorizontal: 6,
                paddingVertical: 2,
                minWidth: 16,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 10,
                  fontWeight: "bold",
                }}
              >
                {unreadTotal > 99 ? "99+" : unreadTotal}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}
