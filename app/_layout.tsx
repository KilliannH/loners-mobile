import { Stack } from "expo-router";
import { I18nextProvider } from "react-i18next";
import "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { AuthProvider } from "../contexts/AuthContext";
import "../src/i18n";
import i18n from "../src/i18n";

export default function RootLayout() {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <Toast position="top" topOffset={50} />
      </AuthProvider>
    </I18nextProvider>
  );
}