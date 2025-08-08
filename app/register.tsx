import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";

export default function Register() {
  const { signup } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); const [error, setError] = useState("");

  const submit = async () => {
    setError(""); setLoading(true);
    try { await signup(username, email, password); router.replace("/"); }
    catch { setError("Registration failed"); }
    finally { setLoading(false); }
  };

  return (
    <View style={{ flex:1, backgroundColor:"#f3f4f6", padding:20, justifyContent:"center" }}>
      <Text style={{ fontSize:28, fontWeight:"bold", textAlign:"center", marginBottom:20 }}>Create your account ✨</Text>
      {error ? <Text style={{ color:"red", textAlign:"center", marginBottom:10 }}>{error}</Text> : null}
      <TextInput placeholder="Username" value={username} onChangeText={setUsername}
        style={{ backgroundColor:"white", padding:12, borderRadius:8, marginBottom:12, borderWidth:1, borderColor:"#d1d5db" }} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none"
        style={{ backgroundColor:"white", padding:12, borderRadius:8, marginBottom:12, borderWidth:1, borderColor:"#d1d5db" }} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry
        style={{ backgroundColor:"white", padding:12, borderRadius:8, marginBottom:20, borderWidth:1, borderColor:"#d1d5db" }} />
      <TouchableOpacity onPress={submit} disabled={loading} style={{ borderRadius:8, overflow:"hidden" }}>
        <LinearGradient colors={["#2563eb","#4f46e5"]} start={{x:0,y:0}} end={{x:1,y:0}}
          style={{ paddingVertical:14, alignItems:"center" }}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color:"#fff", fontWeight:"bold", fontSize:16 }}>Register</Text>}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}