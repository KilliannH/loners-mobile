import { useAuth } from "@/hooks/useAuth";
import { DrawerContentScrollView, DrawerItem, DrawerItemList } from "@react-navigation/drawer";
import { useFocusEffect, useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { setStatusBarBackgroundColor, setStatusBarStyle, StatusBar } from "expo-status-bar";
import React, { useCallback } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function CustomDrawerContent(props: any) {
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1, paddingTop: 0 }}>
      {/* Bandeau haut noir sous la status bar */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#000" }}>
        <View style={{ paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>Loners</Text>
        </View>
      </SafeAreaView>

      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <DrawerItemList {...props} />
      </View>

      <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: "#e5e7eb" }}>
        <DrawerItem
          label={() => <Text style={{ color: "#fff", fontWeight: "bold" }}>Logout</Text>}
          style={{ backgroundColor: "#ef4444", borderRadius: 8 }}
          onPress={async () => {
            await logout();
            router.replace("/(auth)/login");
          }}
        />
      </View>
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  // Force la status bar claire + fond noir quand ce layout est à l’écran
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("light");                 // icônes blanches
      setStatusBarBackgroundColor("#000", true);  // fond noir (Android)
      return () => {
        // optionnel: remets ton style par défaut si besoin quand on quitte le layout
        // setStatusBarStyle("auto");
      };
    }, [])
  );

  return (
    <>
      {/* garde aussi le composant pour iOS (style), Android (background déjà géré) */}
      <StatusBar style="light" backgroundColor="#000" />

      <Drawer
        screenOptions={{
          headerStyle: { backgroundColor: "#000" },
          headerTintColor: "#fff",
          drawerActiveTintColor: "#2563eb",
          drawerInactiveTintColor: "#111827",
          // évite des hauteurs bizarres sous la status bar
          headerStatusBarHeight: 0,
        }}
        drawerContent={(props) => <CustomDrawerContent {...props} />}
      >
        <Drawer.Screen name="index"   options={{ drawerLabel: "Home",    title: "Home" }} />
        <Drawer.Screen name="profile" options={{ drawerLabel: "Profile", title: "Profile" }} />
        <Drawer.Screen name="messages" options={{ drawerLabel: "Messages", title: "Messages" }} />
      </Drawer>
    </>
  );
}