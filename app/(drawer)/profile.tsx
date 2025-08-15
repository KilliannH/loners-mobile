import EventCard from "@/components/EventCard";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SectionList,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
// (optionnel) si tu as i18n côté mobile :
import { useTranslation } from "react-i18next";

type EventItem = {
  _id: string;
  name: string;
  description?: string;
  type?: string;
  attendees?: Array<{ _id: string }>;
  owner: { _id: string };
};

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [createdEvents, setCreatedEvents] = useState<EventItem[]>([]);
const [joinedEvents, setJoinedEvents] = useState<EventItem[]>([]);
const [loading, setLoading] = useState(true);      // premier chargement uniquement
const [refreshing, setRefreshing] = useState(false); // si tu veux un pull-to-refresh

const fetchEvents = useCallback(
  async ({ showLoader }: { showLoader: boolean } = { showLoader: false }) => {
    try {
      if (showLoader) setLoading(true);
      const res = await api.get<EventItem[]>("/events/my-involved", {
        headers: { "Cache-Control": "no-cache" },
        params: { _ts: Date.now() },
      });

      const all = res.data || [];
      setCreatedEvents(all.filter((e) => e.owner?._id === user?._id));
      setJoinedEvents(all.filter((e) => e.owner?._id !== user?._id));
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  },
  [user?._id]
);

// 🔁 à chaque focus: refetch mais SANS loader si on a déjà des données
useFocusEffect(
  useCallback(() => {
    // force un /me pour récupérer username/bio/avatar à jour
    refreshUser?.();
    fetchEvents({ showLoader: createdEvents.length === 0 && joinedEvents.length === 0 });
  }, [refreshUser, fetchEvents, createdEvents.length, joinedEvents.length])
);

// ❌ supprime ceci (il causait un double fetch et un flash de loader)
// useEffect(() => {
//   fetchEvents({ showLoader: true });
// }, [fetchEvents]);

const noData = createdEvents.length === 0 && joinedEvents.length === 0;
const showHeaderSpinner = loading && noData;

  const sections = useMemo(
    () => [
      { title: t("profile.createdEvents"), data: createdEvents, key: "created" },
      { title: t("profile.joinedEvents"), data: joinedEvents, key: "joined" },
    ],
    [createdEvents, joinedEvents, t]
  );

  return (
  <>
    <SectionList
      sections={sections}
      keyExtractor={(item) => item._id}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={{
        paddingBottom: insets.bottom + 90, // espace pour la bottom bar
        backgroundColor: "#f3f4f6",
      }}
      ListHeaderComponent={
        <View style={{ padding: 16, paddingTop: insets.top + 8 }}>
          {/* Header utilisateur */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={{ width: 64, height: 64, borderRadius: 32, marginRight: 12 }}
              />
            ) : (
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  marginRight: 12,
                  backgroundColor: "#e5e7eb",
                }}
              />
            )}

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: "700" }}>
                {user?.username ?? "Utilisateur"}
              </Text>
              {!!user?.email && <Text style={{ color: "#6b7280" }}>{user.email}</Text>}
              {!!user?.bio && (
                <Text style={{ color: "#9ca3af", fontStyle: "italic", marginTop: 4 }}>
                  “{user.bio}”
                </Text>
              )}
            </View>
          </View>

          {/* Action: Modifier mon profil */}
          <TouchableOpacity
            onPress={() => router.push("/profile/update")}
            style={{
              marginTop: 12,
              backgroundColor: "#e5e7eb",
              paddingVertical: 10,
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ fontWeight: "600", color: "#111827" }}>
              {t("profile.edit")}
            </Text>
          </TouchableOpacity>

          {/* Loader uniquement si aucun event encore affiché */}
          {showHeaderSpinner && (
            <View style={{ paddingVertical: 16, alignItems: "center" }}>
              <ActivityIndicator />
            </View>
          )}
        </View>
      }
      renderSectionHeader={({ section }) => (
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <Text style={{ fontWeight: "700", color: "#111827" }}>{section.title}</Text>
        </View>
      )}
      renderItem={({ item }) => <EventCard item={item} />}
      renderSectionFooter={({ section }) =>
        !loading && section.data.length === 0 ? (
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ color: "#6b7280" }}>
              {section.key === "created"
                ? t("profile.noCreated")
                : t("profile.noJoined")}
            </Text>
          </View>
        ) : (
          <View style={{ height: 8 }} />
        )
      }
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        fetchEvents({ showLoader: false });
      }}
    />

    <BottomNavigation />
  </>
);
}
