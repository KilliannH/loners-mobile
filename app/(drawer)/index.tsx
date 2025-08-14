import api from "@/services/api";
import { EventItem } from "@/types/types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useAuth } from "../../hooks/useAuth";

// Mock position
const useLiveLocationMock = () => {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    const mock = { lat: 47.2184, lng: -1.5536 };
    setPos(mock);
    console.log("📍 Mock position utilisée :", mock.lat, mock.lng);
  }, []);
  return pos;
};

const pageSize = 30;

export default function HomeScreen() {
  const { user } = useAuth();
  const position = useLiveLocationMock();
  const [region, setRegion] = useState<Region | null>(null);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [totalEvents, setTotalEvents] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [typeFilter, setTypeFilter] = useState<"all" | string>("all");

  const groupEvents = useCallback((list: EventItem[], perGroup = 3) => {
    const grouped: EventItem[][] = [];
    for (let i = 0; i < list.length; i += perGroup) {
      grouped.push(list.slice(i, i + perGroup));
    }
    return grouped;
  }, []);

  const groupedEvents = useMemo(
    () => groupEvents(events, 3),
    [events, groupEvents]
  );

  useEffect(() => {
    if (position) {
      setRegion({
        latitude: position.lat,
        longitude: position.lng,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      });
    }
  }, [position]);

  const fetchEvents = useCallback(
    async (newPage = 0) => {
      if (!position) return;
      if (newPage === 0) setLoading(true);
      else setIsFetchingMore(true);

      try {
        console.log("🔍 Fetch events", {
          lat: position.lat,
          lng: position.lng,
          offset: newPage * pageSize,
          limit: pageSize,
          type: typeFilter,
        });

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
        else setEvents((prev) => [...prev, ...newEvents]);

        setHasMore(!!res.data?.hasMore && newEvents.length > 0);
        setPage(newPage);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
        setIsFetchingMore(false);
      }
    },
    [position, typeFilter]
  );

  useEffect(() => {
    if (position) fetchEvents(0);
  }, [position, typeFilter, fetchEvents]);

  return (
  <View style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
    <FlatList
      data={events}
      keyExtractor={(item) => item._id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
      // ---------- Header: Map + Greeting + Count ----------
      ListHeaderComponent={
        <View style={{ padding: 16, paddingBottom: 8 }}>
          <View
            style={{
              borderRadius: 16,
              overflow: "hidden",
              backgroundColor: "#e5e7eb",
              height: 200,
            }}
          >
            {region ? (
              <MapView
                style={{ flex: 1 }}
                initialRegion={region}
                provider="google"
                scrollEnabled={false}
                zoomEnabled={false}
                onRegionChangeComplete={setRegion}
              >
                <Marker
                  coordinate={{
                    latitude: region.latitude,
                    longitude: region.longitude,
                  }}
                  title="Moi"
                  pinColor="#3b82f6"
                />
                {events.map((ev) => (
                  <Marker
                    key={ev._id}
                    coordinate={{
                      latitude: ev.location.coordinates.coordinates[1],
                      longitude: ev.location.coordinates.coordinates[0],
                    }}
                    title={ev.name}
                  />
                ))}
              </MapView>
            ) : (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator />
              </View>
            )}
          </View>

          {/* Greeting */}
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16 }}>
            <Image
              source={
                user?.avatarUrl
                  ? { uri: user.avatarUrl }
                  : require("../../assets/avatar_fallback.png")
              }
              style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: "700" }}>
                Salut {user?.username} 👋
              </Text>
              <Text style={{ color: "#6b7280" }}>
                Voici ce qui se passe près de toi
              </Text>
            </View>
            <TouchableOpacity onPress={() => position && fetchEvents(0)} style={{ padding: 8 }}>
              <Text style={{ color: "#3b82f6" }}>Actualiser</Text>
            </TouchableOpacity>
          </View>

          {/* Count */}
          <View style={{ alignItems: "center", marginTop: 12 }}>
            {loading ? (
              <Text style={{ color: "#6b7280" }}>Recherche d’événements…</Text>
            ) : (
              <Text style={{ color: "#6b7280" }}>{totalEvents} événement(s) trouvé(s)</Text>
            )}
          </View>
        </View>
      }
      // ---------- Items ----------
      renderItem={({ item, index }) => (
        <View style={{ paddingHorizontal: 16 }}>
          <EventCard item={item} isLast={index === events.length - 1} />
        </View>
      )}
      // ---------- Infinite scroll ----------
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (hasMore && !isFetchingMore) {
          fetchEvents(page + 1);
        }
      }}
      // ---------- Footer (loader) ----------
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

function EventCard({
  item,
  isLast = false,
}: {
  item: EventItem;
  isLast?: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: "white",
        padding: 14,
        borderRadius: 12,
        marginTop: 12,
        marginBottom: isLast ? 100 : 0, // espace en bas SANS carrousel
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
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            backgroundColor: "#eef2ff",
            color: "#4f46e5",
            paddingVertical: 4,
            paddingHorizontal: 10,
            borderRadius: 999,
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