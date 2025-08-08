import { Link, Redirect } from "expo-router";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import GradientButton from "../../components/GradientButton";
import { useAuth } from "../../hooks/useAuth";

export default function Login() {
  const { login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Redirect href="/(tabs)/home" />;

  const onSubmit = async () => {
    setLoading(true);
    try {
      await login(email.trim(), password);
    } finally { setLoading(false); }
  };

  return (
    <View style={{ flex:1, padding:20, justifyContent:"center", gap:12 }}>
      <Text style={{ fontSize:28, fontWeight:"700", marginBottom:12 }}>Login</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={{ borderWidth:1, borderColor:"#ddd", borderRadius:10, padding:12 }} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={{ borderWidth:1, borderColor:"#ddd", borderRadius:10, padding:12 }} />
      <GradientButton title={loading ? "…" : "Sign in"} onPress={onSubmit} />
      <Link href="/(tabs)/home">Skip</Link>
    </View>
  );
}