import { ExpoConfig } from "@expo/config-types";

const config: ExpoConfig = {
  name: "Loners",
  slug: "loners-mobile",
  scheme: "loners",
  plugins: ["expo-router"],
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: { image: "./assets/splash.png", resizeMode: "contain", backgroundColor: "#ffffff" },
  ios: {
    bundleIdentifier: "com.loners.app",
    supportsTablet: true,
    infoPlist: {
      NSLocationWhenInUseUsageDescription: "We use your location to show nearby events.",
      NSLocationAlwaysAndWhenInUseUsageDescription: "We use your location to show nearby events.",
    }
  },
  android: {
    package: "com.loners.app",
    adaptiveIcon: { foregroundImage: "./assets/icon.png", backgroundColor: "#ffffff" },
    permissions: ["android.permission.ACCESS_FINE_LOCATION", "android.permission.ACCESS_COARSE_LOCATION"]
  },
  experiments: { typedRoutes: true },
  extra: {
    eas: { projectId: "0d77a0ae-a23e-4722-b0b2-f48d3f2d5779" }
  },
  owner: "killiann"
};

export default config;