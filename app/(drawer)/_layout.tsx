import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useAuth } from "../../contexts/AuthContext";

export default function TabsLayout() {
  const router = useRouter();
  const { logout, user } = useAuth();

  return (
    <Drawer
      screenOptions={{
        headerStyle: { backgroundColor: "#000" },
        headerTintColor: "#fff",
        drawerActiveTintColor: "#2563eb",
      }}
      drawerContent={(props) => (
        <View style={{ flex: 1, paddingTop: 50 }}>
          <View style={{ paddingHorizontal: 20, marginBottom: 30 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>
              Loners
            </Text>
          </View>

          {/* Liens du menu */}
          {props.state.routeNames.map((name, index) => (
            <Pressable
              key={name}
              onPress={() => props.navigation.navigate(name)}
              style={{
                padding: 15,
                backgroundColor:
                  props.state.index === index ? "#e0e7ff" : "transparent",
              }}
            >
              <Text style={{ fontSize: 16 }}>{name}</Text>
            </Pressable>
          ))}

          {/* Bouton Logout */}
          <View style={{ flex: 1, justifyContent: "flex-end", padding: 20 }}>
            <Pressable
              onPress={async () => {
                await logout();
                router.replace("/(auth)/login");
              }}
              style={{
                backgroundColor: "#ef4444",
                padding: 12,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Logout</Text>
            </Pressable>
          </View>
        </View>
      )}
    >
      <Drawer.Screen name="index" options={{ drawerLabel: "Home" }} />
      <Drawer.Screen name="map" options={{ drawerLabel: "Map" }} />
      <Drawer.Screen name="profile" options={{ drawerLabel: "Profile" }} />
    </Drawer>
  );
}