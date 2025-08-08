import { makeRedirectUri } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
    const androidNative = `com.googleusercontent.apps.${process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID.replace('.apps.googleusercontent.com', '')}:/oauthredirect`;
    const iosNative = `com.googleusercontent.apps.${process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID.replace('.apps.googleusercontent.com', '')}:/oauthredirect`;

    const redirectUri = makeRedirectUri({
    native: Platform.select({ android: androidNative, ios: iosNative }),
  });
    const [request, response, promptAsync] = Google.useAuthRequest({
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        scopes: ["profile", "email"],
        redirectUri,
    });

    useEffect(() => {
        if (response?.type === "success") {
            console.log("✅ Google auth OK:", response.authentication);
        } else if (response?.type === "error") {
            console.log("❌ Google auth error:", response);
        }
    }, [response]);

    return { request, response, promptAsync, redirectUri };
}