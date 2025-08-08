import { LinearGradient } from "expo-linear-gradient";
import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";

export default function Index() {
  const { user, loading, logout } = useAuth();

  // ⏳ Pendant le chargement du token / user
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 🚫 Pas connecté → go /login
  if (!user) {
    return <Redirect href="/login" />;
  }

  // ✅ Connecté → Home
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f3f4f6", padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>
        Hello {user?.username || "Guest"} 👋
      </Text>
      <Text style={{ color: "#6b7280", marginBottom: 30 }}>
        This is your Home screen.
      </Text>

      {/* Bouton Logout (debug) */}
      <TouchableOpacity
        onPress={async () => {
          await logout();
          // Redirect automatique vers /login grâce au Redirect ci-dessus
        }}
        style={{ borderRadius: 8, overflow: "hidden" }}
      >
        <LinearGradient
          colors={["#ef4444", "#b91c1c"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingVertical: 14, paddingHorizontal: 30, alignItems: "center" }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>Logout (debug)</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
