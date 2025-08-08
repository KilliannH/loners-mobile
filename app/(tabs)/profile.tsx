import { Button, Text, View } from "react-native";
import { useAuth } from "../../hooks/useAuth";

export default function Profile() {
  const { user, logout } = useAuth();
  return (
    <View style={{ flex:1, alignItems:"center", justifyContent:"center", gap:12 }}>
      <Text style={{ fontSize:20, fontWeight:"600" }}>{user?.username ?? "Guest"}</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}