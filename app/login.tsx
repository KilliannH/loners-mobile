import GoogleButton from "@/components/GoogleButton";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import api from "../services/api";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { request, response, promptAsync } = useGoogleAuth();

  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    await SecureStore.setItemAsync("token", data.token);
    if (data.refreshToken) {
      await SecureStore.setItemAsync("refreshToken", data.refreshToken);
    }
    await SecureStore.setItemAsync("user", JSON.stringify(data.user));
  };

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/");
    } catch {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      if (response?.type === "success") {
        const idToken = response.authentication?.idToken;
        if (!idToken) return;

        const { data } = await api.post("/auth/google", { idToken });
        await SecureStore.setItemAsync("token", data.token);
        if (data.refreshToken) {
          await SecureStore.setItemAsync("refreshToken", data.refreshToken);
        }
        await SecureStore.setItemAsync("user", JSON.stringify(data.user));
        router.replace("/");
      }
    };
    run().catch(console.error);
  }, [response]);

  return (
    <View style={{ flex: 1, backgroundColor: "#f3f4f6", padding: 20, justifyContent: "center" }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 20 }}>
        Welcome back
      </Text>

      {error ? (
        <Text style={{ color: "red", textAlign: "center", marginBottom: 10 }}>{error}</Text>
      ) : null}

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          backgroundColor: "white",
          padding: 12,
          borderRadius: 8,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: "#d1d5db",
        }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          backgroundColor: "white",
          padding: 12,
          borderRadius: 8,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: "#d1d5db",
        }}
      />

      <TouchableOpacity onPress={submit} disabled={loading} style={{ borderRadius: 8, overflow: "hidden" }}>
        <LinearGradient
          colors={["#2563eb", "#4f46e5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingVertical: 14, alignItems: "center" }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>Login</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Bouton Google */}
      <View style={{ height: 12 }} />
      <GoogleButton onPress={() => promptAsync()} disabled={!request} />

      {/* Lien vers Register */}
      <TouchableOpacity
        onPress={() => router.push("/register")}
        style={{ marginTop: 16, alignItems: "center" }}
      >
        <Text style={{ color: "#4b5563", fontSize: 14 }}>
          No account? <Text style={{ color: "#2563eb", fontWeight: "bold" }}>Register</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
