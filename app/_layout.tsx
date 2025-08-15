import { Stack } from "expo-router";
import { I18nextProvider } from "react-i18next";
import "react-native-gesture-handler";
import { AuthProvider } from "../contexts/AuthContext";
import "../src/i18n";
import i18n from "../src/i18n";

export default function RootLayout() {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </I18nextProvider>
  );
}