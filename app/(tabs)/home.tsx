import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Home() {
  return (
    <View style={{ flex:1, alignItems:"center", justifyContent:"center", gap:12 }}>
      <Text style={{ fontSize:24, fontWeight:"700" }}>Welcome to Loners</Text>
      <Link href="/(tabs)/map">Go to Map</Link>
      <Link href="/(tabs)/chat/123">Open Chat 123</Link>
    </View>
  );
}