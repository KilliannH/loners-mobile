// app/event_details/[id].tsx
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import { toastError, toastInfo, toastSuccess } from "@/utils/toast";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    MapPin,
    MessageCircle,
    Pencil,
    Trash2,
    UserPlus,
    XCircle,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function EventDetailsScreen() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${id}`);
        setEvent(res.data);
        const alreadyJoined = res.data.attendees?.some(
          (u: any) => u._id === user?._id
        );
        setJoined(alreadyJoined);
      } catch {
        toastError(t("eventDetails.errorLoad"));
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchEvent();
  }, [id]);

  const handleJoin = async () => {
    try {
      await api.post(`/events/${id}/join`);
      toastSuccess(t("eventDetails.toast.joined"));
      setJoined(true);
      setEvent((prev: any) => ({
        ...prev,
        attendees: [...(prev?.attendees || []), user],
      }));
    } catch {
      toastError(t("eventDetails.errorJoin"));
    }
  };

  const handleLeave = async () => {
    try {
      await api.post(`/events/${id}/leave`);
      toastInfo(t("eventDetails.toast.left"));
      setJoined(false);
      setEvent((prev: any) => ({
        ...prev,
        attendees:
          prev?.attendees?.filter((u: any) => u._id !== user._id) || [],
      }));
    } catch {
      toastError(t("eventDetails.errorLeave"));
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/events/${id}`);
      toastSuccess(t("eventDetails.successDelete"));
      router.replace("/");
    } catch {
      toastError(t("eventDetails.errorDelete"));
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text>{t("eventDetails.notFound")}</Text>
      </View>
    );
  }

  const [lng, lat] = event.location?.coordinates?.coordinates || [];

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#4b5563" />
            <Text style={{ marginLeft: 4 }}>{t("common.back")}</Text>
          </TouchableOpacity>
          {event?.owner?._id === user?._id && (
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity onPress={() => router.push(`/events/${id}/edit`)}>
                <Pencil size={20} color="#4f46e5" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowDeleteModal(true)}>
                <Trash2 size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Infos */}
        <Text style={styles.title}>{event.name}</Text>
        <Text style={styles.desc}>{event.description}</Text>

        <Text style={styles.meta}>
          {t("event.type")}: {t(`createEvent.types.${event.type ?? "autre"}`)}
        </Text>

        <Text style={styles.meta}>
          {t("event.date")} :{" "}
          {new Date(event.date).toLocaleDateString(i18n.language, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}{" "}
          {t("event.at")}{" "}
          {new Date(event.date).toLocaleTimeString(i18n.language, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>

        {event.location && (
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
            <MapPin size={16} color="#6b7280" />
            <Text style={{ marginLeft: 4 }}>
              {event.location.name} - {event.location.address}
            </Text>
          </View>
        )}

        {/* Map */}
        {Number.isFinite(lat) && Number.isFinite(lng) && (
          <MapView
            style={{ height: 200, marginTop: 12, borderRadius: 8 }}
            initialRegion={{
              latitude: lat,
              longitude: lng,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={true}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            <Marker coordinate={{ latitude: lat, longitude: lng }} />
          </MapView>
        )}

        {/* Actions */}
        <View style={{ marginTop: 16 }}>
          {joined ? (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#ef4444" }]}
              onPress={handleLeave}
            >
              <XCircle size={18} color="#fff" />
              <Text style={styles.btnText}>{t("event.leave")}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#000" }]}
              onPress={handleJoin}
            >
              <UserPlus size={18} color="#fff" />
              <Text style={styles.btnText}>{t("event.join")}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.btn,
              { borderWidth: 1, borderColor: "#d1d5db", backgroundColor: "#fff" },
            ]}
            onPress={() => router.push(`/event/${event._id}/chat`)}
          >
            <MessageCircle size={18} color="#000" />
            <Text style={[styles.btnText, { color: "#000" }]}>
              {t("event.goToChat")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Participants */}
        {event?.attendees?.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={{ marginBottom: 8, color: "#6b7280" }}>
              {t("event.participants", { count: event.attendees.length })}
            </Text>
            <FlatList
              horizontal
              data={event.attendees}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => router.push(`/users/${item._id}`)}>
                  <Image
                    source={{
                      uri: item.avatarUrl || "https://via.placeholder.com/50",
                    }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      marginRight: 8,
                      borderWidth: 2,
                      borderColor: "#fff",
                    }}
                  />
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Modal suppression */}
        <Modal
          transparent
          visible={showDeleteModal}
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowDeleteModal(false)}
          >
            <View style={styles.modalContent}>
              <Text
                style={{
                  fontWeight: "bold",
                  fontSize: 16,
                  marginBottom: 8,
                }}
              >
                {t("event.delete")}
              </Text>
              <Text style={{ color: "#6b7280", marginBottom: 16 }}>
                {t("event.confirmDelete")}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  gap: 12,
                }}
              >
                <TouchableOpacity onPress={() => setShowDeleteModal(false)}>
                  <Text style={{ color: "#4b5563" }}>{t("common.cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDelete}>
                  <Text style={{ color: "#ef4444" }}>{t("common.delete")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>
      </ScrollView>
      {/* --- Bottom Navigation --- */}
      <BottomNavigation />
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerBtn: { flexDirection: "row", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginTop: 12, marginBottom: 8 },
  desc: { color: "#4b5563", marginBottom: 12 },
  meta: { color: "#4b5563", marginBottom: 8 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  btnText: { color: "#fff", fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: { backgroundColor: "#fff", padding: 20, borderRadius: 8, width: "80%" },
});
