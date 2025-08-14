import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function MapScreen() {
  const [pos, setPos] = useState<{lat:number; lng:number} | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setErr("Permission denied"); return; }
      const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setPos({ lat: coords.latitude, lng: coords.longitude });
    })();
  }, []);

  if (!pos) return <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}><Text>{err ?? "Locating…"}</Text></View>;

  return (
    <MapView style={{ flex:1 }} initialRegion={{ latitude: pos.lat, longitude: pos.lng, latitudeDelta: 0.04, longitudeDelta: 0.04 }}>
      <Marker coordinate={{ latitude: pos.lat, longitude: pos.lng }} title="You" />
    </MapView>
  );
}