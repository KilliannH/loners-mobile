import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, Text } from "react-native";

export default function GradientButton({ title, onPress, disabled }: { title: string; onPress?: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ borderRadius: 12, overflow: "hidden" }}>
      <LinearGradient
        colors={["#2563EB", "#4F46E5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingVertical: 14, paddingHorizontal: 16, minWidth: 180, alignItems: "center" }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}