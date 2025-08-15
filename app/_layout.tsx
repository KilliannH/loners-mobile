import { bindNotificationSocket, preloadUnreadCounts } from "@/services/notificationSocket";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { AuthProvider } from "../contexts/AuthContext";
import "../i18n";
import i18n from "../i18n";

export default function RootLayout() {
  useEffect(() => {
    preloadUnreadCounts();
    const unbind = bindNotificationSocket();
    return unbind;
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <Toast position="top" topOffset={50} />
      </AuthProvider>
    </I18nextProvider>
  );
}