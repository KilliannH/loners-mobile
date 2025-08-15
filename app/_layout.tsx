import { bindNotificationSocket, preloadUnreadCounts } from "@/services/notificationSocket";
import socket from "@/services/socket";
import { Stack } from "expo-router";
import React, { useEffect, useRef } from "react";
import { I18nextProvider } from "react-i18next";
import "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { AuthContext, AuthProvider } from "../contexts/AuthProvider";
import "../i18n";
import i18n from "../i18n";

function AuthSocketManager() {
  const { user, loading } = React.useContext(AuthContext);
  const boundRef = useRef(false);
  const identifiedRef = useRef<string | null>(null);

  // Log pour debug
  useEffect(() => {
    console.log("🧪 AuthSocketManager | loading:", loading, "| user:", user);
  }, [loading, user]);

  // Connexion socket
  useEffect(() => {
    if (loading || !user?._id) return;

    (async () => {
      if (identifiedRef.current === user._id && socket.connected) {
        console.log("ℹ️ Déjà identifié");
        return;
      }
      await socket.connect();
      await socket.identify(user._id);
      identifiedRef.current = user._id;
      console.log("🪪 [socket] identify envoyé", user._id);

      // Précharge les non-lus au boot
      preloadUnreadCounts();
    })();
  }, [user?._id, loading]);

  // Bind notifications
  useEffect(() => {
    if (!boundRef.current && !loading && user?._id) {
      console.log("🔌 [notif] Binding des notifications socket...");
      const unbind = bindNotificationSocket();
      boundRef.current = true;
      return unbind;
    }
  }, [loading, user?._id]);

  return null;
}

export default function RootLayout() {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <Toast position="top" topOffset={50} />
        <AuthSocketManager />
      </AuthProvider>
    </I18nextProvider>
  );
}
