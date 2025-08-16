import api from "@/services/api"; // ton instance axios
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    // Demande de permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      alert("Permission de notifications refusée");
      return;
    }

    // Récupération du token Expo
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("📲 Expo Push Token:", token);

    // Envoi au backend
    await api.post("/users/push-token", { token });
  } else {
    console.error("Les notifications push fonctionnent uniquement sur un vrai appareil");
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}