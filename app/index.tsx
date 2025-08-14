import api from "@/services/api";
import { EventItem } from "@/types/types";
import * as Location from "expo-location";
import { Redirect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Text, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useAuth } from "../contexts/AuthContext";

export default function Index() {
  const { user, loading: authLoading, logout } = useAuth();

  if (authLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (!user) return <Redirect href="/login" />;

  return <HomeScreen user={user} onLogout={logout} />;
}

const pageSize = 3;

function HomeScreen({ user, onLogout }: { user: any; onLogout: () => Promise<void> }) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [region, setRegion] = useState<Region | null>(null);

  // états UI
  const [loading, setLoading] = useState(false);           // chargement de la page 0
  const [isFetchingMore, setIsFetchingMore] = useState(false); // pagination
  const [error, setError] = useState<string | null>(null);

  // data
  const [events, setEvents] = useState<EventItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalEvents, setTotalEvents] = useState(0);

  // petit filtre exemple (à brancher sur ton UI)
  const [typeFilter, setTypeFilter] = useState<"all" | string>("all");

  // --- permission + géoloc + region
  const askAndLocate = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Permission localisation refusée");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setPosition(coords);
      setRegion({
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      });
    } catch (e: any) {
      setError(e?.message ?? "Impossible de récupérer la position");
    }
  }, []);

  useEffect(() => {
    askAndLocate();
  }, [askAndLocate]);

  // --- >>> ta logique intégrée ici
  const fetchEvents = useCallback(
    async (newPage = 0) => {
      if (!position) return;

      if (newPage === 0) setLoading(true);
      else setIsFetchingMore(true);

      try {
        const res = await api.get("/events/nearby", {
          params: {
            lat: position.lat,
            lng: position.lng,
            offset: newPage * pageSize,
            limit: pageSize,
            type: typeFilter !== "all" ? typeFilter : undefined,
          },
        });

        const newEvents: EventItem[] = res.data?.events ?? [];
        setTotalEvents(res.data?.total ?? 0);

        if (newPage === 0) setEvents(newEvents);
        else setEvents(prev => [...prev, ...newEvents]);

        setHasMore(!!res.data?.hasMore && newEvents.length > 0);
        setPage(newPage);
        setError(null);
      } catch (err: any) {
        setError(err?.message ?? "Erreur inconnue");
        // toast?.error?.(t("home.toast.fetchError"));
      } finally {
        setLoading(false);
        setIsFetchingMore(false);
      }
    },
    [position, typeFilter]
  );
  // --- <<< fin intégration

  // fetch initial quand position ou filtre change
  useEffect(() => {
    if (position) fetchEvents(0);
  }, [position, typeFilter, fetchEvents]);

  // pagination (infinite scroll)
  const loadMore = useCallback(() => {
    if (!loading && !isFetchingMore && hasMore) {
      fetchEvents(page + 1);
    }
  }, [loading, isFetchingMore, hasMore, page, fetchEvents]);

  const header = useMemo(
    () => (
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
        <View style={{ borderRadius: 16, overflow: "hidden", backgroundColor: "#e5e7eb", height: 200 }}>
          {region ? (
            <MapView style={{ flex: 1 }} initialRegion={region} onRegionChangeComplete={setRegion}>
              {region && (
                <Marker
                  coordinate={{ latitude: region.latitude, longitude: region.longitude }}
                  title="Moi"
                  pinColor="#3b82f6"
                />
              )}
              {events.map(ev => (
                <Marker key={ev._id} coordinate={ev.location.coordinates.coordinates} title={ev.name} />
              ))}
            </MapView>
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator />
            </View>
          )}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16 }}>
          <Image
            source={{ uri: user?.avatarUrl }}
            style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: "700" }}>Salut {user?.username} 👋</Text>
            <Text style={{ color: "#6b7280" }}>Voici ce qui se passe près de toi</Text>
          </View>
        </View>

        <View style={{ alignItems: "center", marginTop: 12 }}>
          {loading ? (
            <Text style={{ color: "#6b7280" }}>Recherche d’événements…</Text>
          ) : (
            <Text style={{ color: "#6b7280" }}>
              {totalEvents} événement(s) trouvé(s)
            </Text>
          )}
        </View>
      </View>
    ),
    [region, events, loading, totalEvents, user]
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      {header}

      <FlatList
        data={events}
        keyExtractor={item => item._id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={{ paddingTop: 40, alignItems: "center" }}>
            {loading ? <ActivityIndicator /> : <Text style={{ color: "#6b7280" }}>Aucun événement à proximité.</Text>}
            {!!error && <Text style={{ color: "#ef4444", marginTop: 8 }}>{error}</Text>}
          </View>
        }
        renderItem={({ item }) => <EventCard item={item} />}
        onEndReachedThreshold={0.4}
        onEndReached={loadMore}
        ListFooterComponent={
          isFetchingMore ? (
            <View style={{ paddingVertical: 16 }}>
              <ActivityIndicator />
            </View>
          ) : null
        }
      />
    </View>
  );
}

function EventCard({ item }: { item: EventItem }) {
  return (
    <View
      style={{
        backgroundColor: "white",
        padding: 14,
        borderRadius: 12,
        marginTop: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 6 }}>
        {item.name}
      </Text>
      {!!item.description && (
        <Text numberOfLines={2} style={{ color: "#6b7280", marginBottom: 10 }}>
          {item.description}
        </Text>
      )}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text
          style={{
            backgroundColor: "#eef2ff",
            color: "#4f46e5",
            paddingVertical: 4,
            paddingHorizontal: 10,
            borderRadius: 999,
            overflow: "hidden",
            fontSize: 12,
          }}
        >
          {item.type ?? "Événement"}
        </Text>
        {!!item.attendees && (
          <Text style={{ color: "#6b7280", fontSize: 12 }}>
            {item.attendees.length} participant(s)
          </Text>
        )}
      </View>
    </View>
  );
}