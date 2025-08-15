import BottomNavigation from "@/components/BottomNavigation";
import api from "@/services/api";
import { toastError, toastSuccess } from "@/utils/toast";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Calendar, Clock, MapPin, Search } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

type GooglePrediction = { place_id: string; description: string };

type SelectedPlace = {
  name: string;
  address: string;
  lat: number;
  lng: number;
};

const availableTypes = ["concert", "spectacle", "soiree_a_theme", "expo", "autre"] as const;

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.googleApiKey;

export default function CreateEventScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  // form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<(typeof availableTypes)[number]>("concert");
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<Date>(new Date());

  // pickers
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  // places (Google only)
  const [locationQuery, setLocationQuery] = useState("");
  const [googleSuggestions, setGoogleSuggestions] = useState<GooglePrediction[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // submit state
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => !!name.trim() && !!description.trim() && !!type && !!selectedPlace,
    [name, description, type, selectedPlace]
  );

  // helpers
  const combineDateTime = (d: Date, t: Date) => {
    const out = new Date(d);
    out.setHours(t.getHours(), t.getMinutes(), 0, 0);
    return out;
  };
  const onChangeDate = (_: any, d?: Date) => {
    setShowDate(false);
    if (d) setDate(d);
  };
  const onChangeTime = (_: any, tt?: Date) => {
    setShowTime(false);
    if (tt) setTime(tt);
  };

  // --- Google Autocomplete ---
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!locationQuery || locationQuery.trim().length < 3) {
      setGoogleSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        setLoadingLocations(true);
        const gRes = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            locationQuery.trim()
          )}&key=${GOOGLE_API_KEY}&language=${i18n.language}`
        );
        const gData = await gRes.json();
        setGoogleSuggestions(gData.status === "OK" ? gData.predictions : []);
      } catch {
        setGoogleSuggestions([]);
      } finally {
        setLoadingLocations(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [locationQuery, i18n.language]);

  // Sélection d’un résultat Google → fetch details
  const selectGooglePlace = async (prediction: GooglePrediction) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&key=${GOOGLE_API_KEY}&language=${i18n.language}`
      );
      const data = await res.json();
      if (data.status !== "OK") throw new Error("Google Place Details error");

      const g = data.result;
      const name = g.name || prediction.description;
      const address = g.formatted_address || prediction.description;
      const lat = g.geometry?.location?.lat;
      const lng = g.geometry?.location?.lng;
      if (lat == null || lng == null) throw new Error("Missing coordinates");

      setSelectedPlace({ name, address, lat, lng });
      setLocationQuery(name);
      setGoogleSuggestions([]);
    } catch {
      Alert.alert(t("common.error", "Erreur"), t("createEvent.locationError", "Impossible de valider ce lieu."));
    }
  };

  // Submit
  const submit = useCallback(async () => {
    if (!canSubmit || !selectedPlace) return;
    setSubmitting(true);
    try {
      const when = combineDateTime(date, time).toISOString();

      const payload = {
        name: name.trim(),
        description: description.trim(),
        type,
        date: when,
        location: {
          name: selectedPlace.name,
          address: selectedPlace.address,
          coordinates: { lat: selectedPlace.lat, lng: selectedPlace.lng }
        }
      } as const;

      const res = await api.post("/events", payload);
      toastSuccess(t("createEvent.toast.created", "Événement créé"));
      const newEventId = res.data._id;
      router.push(`/event_details/${newEventId}`);
    } catch {
      toastError(t("createEvent.createError"));
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, selectedPlace, name, description, type, date, time, router, t]);

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: "#f3f4f6" }}
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", marginBottom: 12 }}>
            {t("createEvent.title", "Créer un événement")}
          </Text>

          {/* Nom */}
          <TextInput
            placeholder={t("createEvent.name", "Nom")}
            value={name}
            onChangeText={setName}
            style={{
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 10,
              padding: 12
            }}
          />

          {/* Description */}
          <TextInput
            placeholder={t("createEvent.description", "Description")}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={{
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 10,
              padding: 12,
              marginTop: 12,
              textAlignVertical: "top"
            }}
          />

          {/* Lieu (Google only) */}
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontWeight: "600", marginBottom: 8 }}>
              {t("createEvent.location", "Lieu")}
            </Text>

            <View style={{ position: "relative" }}>
              <TextInput
                placeholder={t("createEvent.searchLocation", "Rechercher un lieu")}
                value={locationQuery}
                onChangeText={(txt) => {
                  setLocationQuery(txt);
                  setSelectedPlace(null); // re-saisie => on invalide la sélection
                }}
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  borderRadius: 10,
                  padding: 12,
                  paddingLeft: 36
                }}
              />
              <MapPin size={18} color="#6b7280" style={{ position: "absolute", left: 12, top: 14 }} />
            </View>

            {(googleSuggestions.length > 0 || loadingLocations) && (
              <View
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  borderRadius: 10,
                  marginTop: 4,
                  maxHeight: 220,
                  overflow: "hidden"
                }}
              >
                <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                  {loadingLocations && (
                    <View style={{ padding: 12 }}>
                      <ActivityIndicator />
                    </View>
                  )}
                  {googleSuggestions.length > 0 && (
                    <View style={{ paddingVertical: 4 }}>
                      <Text
                        style={{ fontSize: 12, color: "#6b7280", paddingHorizontal: 12, paddingVertical: 6 }}
                      >
                        {t("createEvent.googleResults", "Résultats Google")}
                      </Text>
                      {googleSuggestions.map((g) => (
                        <TouchableOpacity
                          key={g.place_id}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8
                          }}
                          onPress={() => selectGooglePlace(g)}
                        >
                          <Search size={16} color="#6b7280" />
                          <Text style={{ flex: 1 }}>{g.description}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Type */}
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontWeight: "600", marginBottom: 8 }}>
              {t("createEvent.type", "Type")}
            </Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 10,
                backgroundColor: "#fff",
                overflow: "hidden"
              }}
            >
              <Picker selectedValue={type} onValueChange={(v) => setType(v)} mode="dropdown">
                {availableTypes.map((k) => (
                  <Picker.Item key={k} label={t(`createEvent.types.${k}`, k)} value={k} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Date & Heure */}
          <View style={{ marginTop: 12, flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={() => setShowDate(true)}
              style={{
                flex: 1,
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 10,
                paddingVertical: 10,
                paddingHorizontal: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 8
              }}
            >
              <Calendar size={18} color="#111827" />
              <Text>{date.toLocaleDateString(i18n.language)}</Text>
            </Pressable>

            <Pressable
              onPress={() => setShowTime(true)}
              style={{
                flex: 1,
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 10,
                paddingVertical: 10,
                paddingHorizontal: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 8
              }}
            >
              <Clock size={18} color="#111827" />
              <Text>
                {time.toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </Pressable>
          </View>

          {showDate && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onChangeDate}
            />
          )}
          {showTime && (
            <DateTimePicker
              value={time}
              mode="time"
              is24Hour
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onChangeTime}
            />
          )}
        </View>

        {/* CTA */}
        <TouchableOpacity
          onPress={submit}
          disabled={!canSubmit || submitting}
          style={{ borderRadius: 8, overflow: "hidden", margin: 16, opacity: !canSubmit ? 0.6 : 1 }}
        >
          <LinearGradient
            colors={["#2563eb", "#4f46e5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 14, alignItems: "center", justifyContent: "center" }}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>
                {t("createEvent.createBtn", "Créer l’événement")}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <BottomNavigation />
    </>
  );
}
