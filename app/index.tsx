import { Redirect } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();
  if (loading) return <View style={{flex:1,alignItems:"center",justifyContent:"center"}}><ActivityIndicator /></View>;
  if (!user) return <Redirect href="/login" />;
  return (
    <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
      <Text style={{ fontSize:22, fontWeight:"700" }}>Hi {user.username || "there"} 👋</Text>
    </View>
  );
}