import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function GoogleButton({ onPress, disabled }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
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
      }}
    >
      {/* Logo Google */}
      <View
        style={{
          width: 24,
          height: 24,
          marginRight: 12,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Image
          source={{
            uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/512px-Google_%22G%22_Logo.svg.png",
          }}
          style={{ width: 24, height: 24 }}
        />
      </View>

      {/* Texte */}
      <Text style={{ color: "#374151", fontSize: 16, fontWeight: "500" }}>
        Continue with Google
      </Text>
    </TouchableOpacity>
  );
}
