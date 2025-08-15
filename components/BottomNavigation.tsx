import { usePathname, useRouter } from "expo-router";
import { Home, MessageSquare, User } from "lucide-react-native";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const getIconColor = (path: string) => (pathname === path ? "#000" : "#6b7280");

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        paddingVertical: 10,
        paddingBottom: insets.bottom || 10, // marge safe area
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
      }}
    >
      <TouchableOpacity onPress={() => router.push("/")} style={{ alignItems: "center" }}>
        <Home size={24} color={getIconColor("/")} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/profile")} style={{ alignItems: "center" }}>
        <User size={24} color={getIconColor("/profile")} />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/messages")} style={{ alignItems: "center" }}>
        <MessageSquare size={24} color={getIconColor("/messages")} />
      </TouchableOpacity>
    </View>
  );
}
