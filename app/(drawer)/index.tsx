import BottomNavigation from "@/components/BottomNavigation";
import EventCard from "@/components/EventCard";
import api from "@/services/api";
import { EventItem } from "@/types/types";
import { availableTypes as baseTypes } from "@/utils/eventTypes";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import { MapPin, Plus } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useAuth } from "../../hooks/useAuth";

const availableTypes = ["all", ...baseTypes] as const;

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

const SCREEN_WIDTH = Dimensions.get("window").width;
const pageSize = 30;

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const position = useLiveLocationMock();
  const [region, setRegion] = useState<Region | null>(null);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [totalEvents, setTotalEvents] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [typeFilter, setTypeFilter] = useState<"all" | string>("all");

  const scaleAnim = useRef(new Animated.Value(1)).current;

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

  const handlePressIn = () => {
  Animated.spring(scaleAnim, {
    toValue: 0.95, // rétrécit un peu au clic
    useNativeDriver: true,
  }).start();
};

const handlePressOut = () => {
  Animated.spring(scaleAnim, {
    toValue: 1.05, // petit zoom
    friction: 3,
    tension: 40,
    useNativeDriver: true,
  }).start(() => {
    Animated.spring(scaleAnim, {
      toValue: 1, // retour à normal
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  });
};

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: "#f3f4f6" }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* --- Map + Greeting + Count --- */}
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
                {(groupedEvents[activeIndex] ?? []).map((ev) => (
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

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 16 }}>
            <Image
              source={
                user?.avatarUrl
                  ? { uri: user.avatarUrl }
                  : require("../../assets/avatar_fallback.png")
              }
              style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
            />
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 18, fontWeight: "700" }}>
                {t("home.hello", { name: user?.username ?? "" })}
              </Text>
              <Text style={{ color: "#6b7280" }}>
                {t("home.nearby")}
              </Text>
            </View>
          </View>

          <View style={{ alignItems: "center", marginTop: 12 }}>
            {loading ? (
              <Text style={{ color: "#6b7280" }}>{t("home.searching")}</Text>
            ) : (
              <Text style={{ color: "#6b7280" }}>
                {totalEvents} {t("home.foundCount", { count: totalEvents })}
              </Text>
            )}
          </View>
        </View>

        {/* --- Filters + Refresh position row --- */}
        <View
          style={{
            marginTop: 12,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          {/* Picker compact (≈ 50% width) */}
          <View style={{ flexBasis: "50%", flexGrow: 0 }}>
            <View
              style={{
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 10,
                backgroundColor: "#fff",
                overflow: "hidden",
                height: 40, // hauteur compacte
                justifyContent: "center",
              }}
            >
              <Picker
                selectedValue={typeFilter}
                onValueChange={(value) => setTypeFilter(value)}
                mode="dropdown"
                dropdownIconColor="#6b7280"
                style={{
                  height: 40,          // compacte (Android)
                  paddingVertical: 0,  // compacte (iOS)
                }}
                itemStyle={{
                  fontSize: 13,        // compacte (iOS)
                }}
              >
                {availableTypes.map((tkey) => (
                  <Picker.Item
                    key={tkey}
                    label={tkey === "all" ? t("home.filters.allTypes") : t(`createEvent.types.${tkey}`)}
                    value={tkey}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Bouton texte bleu */}
          <TouchableOpacity
            onPress={() => position && fetchEvents(0)}
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <MapPin size={16} color="#3b82f6" style={{ marginRight: 4 }} />
            <Text style={{ color: "#3b82f6", fontSize: 14, fontWeight: "500" }}>
              {t("home.refreshLocation")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* --- Carousel horizontal (3 cards/slide) --- */}
        {groupedEvents.length > 0 && (
          <View style={{ marginTop: 8, paddingBottom: 16 }}>
            <FlatList
              data={groupedEvents}
              keyExtractor={(_, index) => `group-${index}`}
              horizontal
              pagingEnabled
              decelerationRate="fast"
              snapToAlignment="start"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
              renderItem={({ item, index }) => (
                <View style={{ width: SCREEN_WIDTH, paddingHorizontal: 16, paddingBottom: 24 }}>
                  {item.map((ev, idx) => (
                    <EventCard
                      key={ev._id}
                      item={ev}
                      isLast={index === groupedEvents.length - 1 && idx === item.length - 1}
                    />
                  ))}
                </View>
              )}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setActiveIndex(idx);

                // 👉 pagination fiable: quand on atteint l'avant-dernier/dernier slide
                if (!isFetchingMore && hasMore && idx >= groupedEvents.length - 1) {
                  fetchEvents(page + 1);
                }
                // Si tu veux précharger 1 slide avant la fin:
                // if (!isFetchingMore && hasMore && idx >= groupedEvents.length - 2) { ... }
              }}
            />

            {/* Dots */}
            <View style={{ flexDirection: "row", justifyContent: "center" }}>
              {groupedEvents.map((_, idx) => (
                <View
                  key={idx}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    marginHorizontal: 4,
                    backgroundColor: idx === activeIndex ? "#3b82f6" : "#d1d5db",
                  }}
                />
              ))}
            </View>

            {/* Loader sous les dots pendant le fetch */}
            {isFetchingMore && (
              <View style={{ paddingVertical: 12, alignItems: "center" }}>
                <ActivityIndicator />
              </View>
            )}
          </View>
        )}

        {/* --- Loader supplémentaire (si besoin) --- */}
        {isFetchingMore && (
          <View style={{ paddingVertical: 16 }}>
            <ActivityIndicator />
          </View>
        )}
      </ScrollView>
      {/* --- Bottom Navigation --- */}
      <BottomNavigation />
      <View
    style={{
      position: "absolute",
      bottom: 80, // au-dessus de la bottom nav
      right: 20,
      shadowColor: "#6366f1",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
    }}
  >
    <Pressable
      onPress={() => router.push("/(drawer)/create")}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <LinearGradient
          colors={["#2563eb", "#4f46e5"]} // from-blue-600 to-indigo-600
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Plus color="#fff" size={32} />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  </View>
    </>
  );
}