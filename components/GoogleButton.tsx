import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function GoogleButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#d1d5db",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        opacity: disabled ? 0.6 : 1,
      }}
      accessibilityRole="button"
      accessibilityLabel="Continuer avec Google"
    >
      <View style={{ width: 24, height: 24, marginRight: 12, justifyContent: "center", alignItems: "center" }}>
        <Image
          source={require("../assets/google_g.svg")}
          style={{ width: 24, height: 24, resizeMode: "contain" }}
        />
      </View>

      <Text style={{ color: "#374151", fontSize: 16, fontWeight: "500" }}>Continue with Google</Text>
    </TouchableOpacity>
  );
}