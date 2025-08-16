import { ExpoConfig } from "@expo/config-types";

const config: ExpoConfig = {
  name: "Loners",
  slug: "loners-mobile",
  scheme: "loners",
  plugins: [
    "expo-router",
    [
      "expo-build-properties",
      {
        ios: { useFrameworks: "static" },
      }
    ]
  ],
  ios: {
    bundleIdentifier: "com.loners.app",
    supportsTablet: true,
    config: { googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY_IOS },
  },
  android: {
    package: "com.loners.app",
    config: { googleMaps: { apiKey: process.env.GOOGLE_MAPS_API_KEY_ANDROID } },
  },
  extra: {
    eas: { projectId: "0d77a0ae-a23e-4722-b0b2-f48d3f2d5779" }
  },
  owner: "killiann"
};
export default config;