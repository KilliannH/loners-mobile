import BottomNavigation from "@/components/BottomNavigation";
import api from "@/services/api";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Calendar, Clock, MapPin, Search } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// -----------------------------
// Types
// -----------------------------

type BackendLocation = {
    _id: string;
    name: string;
    address: string;
    coordinates: { lat: number; lng: number };
};

type GooglePrediction = {
    place_id: string;
    description: string;
};

const availableTypes = [
    "concert",
    "spectacle",
    "soiree_a_theme",
    "expo",
    "autre",
];

const typeLabels: Record<string, string> = {
    concert: "Concert",
    spectacle: "Spectacle",
    soiree_a_theme: "Soirée à thème",
    expo: "Exposition",
    autre: "Autre",
};

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.googleApiKey;

export default function CreateEventScreen() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState(availableTypes[0]);
    const [date, setDate] = useState<Date>(new Date());
    const [showDate, setShowDate] = useState(false);
    const [time, setTime] = useState<Date>(new Date());
    const [showTime, setShowTime] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // --- Localisation ---
    const [locationQuery, setLocationQuery] = useState("");
    const [backendSuggestions, setBackendSuggestions] = useState<BackendLocation[]>([]);
    const [googleSuggestions, setGoogleSuggestions] = useState<GooglePrediction[]>([]);
    const [locationId, setLocationId] = useState<string>("");
    const [selectedLabel, setSelectedLabel] = useState<string>("");
    const [loadingLocations, setLoadingLocations] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const canSubmit = useMemo(
        () => !!name.trim() && !!description.trim() && !!type && !!locationId,
        [name, description, type, locationId]
    );

    const onChangeDate = (_: any, d?: Date) => {
        setShowDate(false);
        if (d) setDate(d);
    };
    const onChangeTime = (_: any, t?: Date) => {
        setShowTime(false);
        if (t) setTime(t);
    };

    const combineDateTime = (d: Date, t: Date) => {
        const out = new Date(d);
        out.setHours(t.getHours(), t.getMinutes(), 0, 0);
        return out;
    };

    // -----------------------------
    // Recherche de lieux (BE d'abord, Google ensuite)
    // -----------------------------
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!locationQuery || locationQuery.trim().length < 2) {
            setBackendSuggestions([]);
            setGoogleSuggestions([]);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setLoadingLocations(true);
            try {
                // 1) Cherche côté backend
                const beRes = await api.get<BackendLocation[]>(
                    `/locations?query=${encodeURIComponent(locationQuery.trim())}`
                );
                setBackendSuggestions(beRes.data || []);

                // 2) Si le backend ne renvoie rien (ou peu), propose aussi Google
                if ((beRes.data?.length || 0) < 5 && locationQuery.trim().length >= 3) {
                    const gRes = await fetch(
                        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
                            locationQuery.trim()
                        )}&key=${GOOGLE_API_KEY}&language=fr`
                    );
                    const gData = await gRes.json();
                    if (gData.status === "OK") {
                        setGoogleSuggestions(gData.predictions);
                    } else {
                        setGoogleSuggestions([]);
                    }
                } else {
                    setGoogleSuggestions([]);
                }
            } catch (e) {
                console.log("Erreur recherche lieu:", e);
                setBackendSuggestions([]);
                setGoogleSuggestions([]);
            } finally {
                setLoadingLocations(false);
            }
        }, 350);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [locationQuery]);

    // Sélection d'un lieu du backend
    const selectBackendLocation = (loc: BackendLocation) => {
        setLocationId(loc._id);
        setSelectedLabel(`${loc.name} · ${loc.address}`);
        setLocationQuery(`${loc.name}`);
        setBackendSuggestions([]);
        setGoogleSuggestions([]);
    };

    // Sélection d'un lieu Google → check/creation côté backend
    const selectGooglePlace = async (prediction: GooglePrediction) => {
        try {
            // Récup détail Google
            const res = await fetch(
                `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&key=${GOOGLE_API_KEY}&language=fr`
            );
            const data = await res.json();
            if (data.status !== "OK") throw new Error("Google Place Details error");

            const g = data.result;
            const name: string = g.name || prediction.description;
            const address: string = g.formatted_address || prediction.description;
            const lat: number = g.geometry?.location?.lat;
            const lng: number = g.geometry?.location?.lng;

            if (lat == null || lng == null) throw new Error("Missing coordinates");

            // 1) Re-vérifie côté BE s'il existe déjà (par adresse exacte)
            const searchRes = await api.get<BackendLocation[]>(
                `/locations?query=${encodeURIComponent(name)}`
            );
            const exact = searchRes.data.find((l) => l.address === address);

            if (exact) {
                setLocationId(exact._id);
                setSelectedLabel(`${exact.name} · ${exact.address}`);
            } else {
                // 2) Sinon, crée la location en DB
                const created = await api.post<BackendLocation>("/locations", {
                    name,
                    address,
                    coordinates: { lat, lng },
                });
                setLocationId(created.data._id);
                setSelectedLabel(`${created.data.name} · ${created.data.address}`);
            }

            setLocationQuery(name);
            setBackendSuggestions([]);
            setGoogleSuggestions([]);
            Alert.alert("Lieu sélectionné", name);
        } catch (err: any) {
            console.error("Erreur lieu Google → DB", err?.response?.data || err?.message);
            Alert.alert("Erreur", "Impossible de valider ce lieu.");
        }
    };

    const resetLocation = () => {
        setLocationId("");
        setSelectedLabel("");
        setLocationQuery("");
    };

    const submit = useCallback(async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        try {
            const when = combineDateTime(date, time).toISOString();

            const payload = {
                name: name.trim(),
                description: description.trim(),
                type,
                date: when,
                locationId,
            } as const;

            const res = await api.post("/events", payload);

            // Redirection vers l'écran de détails avec l'ID
            const newEventId = res.data._id; // Assure-toi que ton BE renvoie bien ça
            router.push(`/event_details/${newEventId}`);
        } catch (e: any) {
            console.log(e?.response?.data || e?.message);
            Alert.alert("Erreur", "Impossible de créer l’événement.");
        } finally {
            setSubmitting(false);
        }
    }, [canSubmit, date, time, name, description, type, locationId, router]);

    const Header = (
        <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 22, fontWeight: "800", marginBottom: 12 }}>
                Créer un événement
            </Text>

            {/* Nom */}
            <TextInput
                placeholder="Nom"
                value={name}
                onChangeText={setName}
                style={{
                    backgroundColor: "#fff",
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    borderRadius: 10,
                    padding: 12,
                    marginTop: 12,
                }}
            />

            {/* Description */}
            <TextInput
                placeholder="Description"
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
                    textAlignVertical: "top",
                }}
            />

            {/* Lieu (BE d'abord, puis Google) */}
            <View style={{ marginTop: 12 }}>
                <Text style={{ fontWeight: "600", marginBottom: 8 }}>Lieu</Text>
                <View style={{ position: "relative" }}>
                    <TextInput
                        placeholder="Rechercher un lieu"
                        value={locationQuery}
                        onChangeText={(txt) => {
                            setLocationQuery(txt);
                            setLocationId(""); // on invalide la sélection si l'utilisateur retape
                        }}
                        style={{
                            backgroundColor: "#fff",
                            borderWidth: 1,
                            borderColor: "#e5e7eb",
                            borderRadius: 10,
                            padding: 12,
                            paddingLeft: 36,
                        }}
                    />
                    <MapPin
                        size={18}
                        color="#6b7280"
                        style={{ position: "absolute", left: 12, top: 14 }}
                    />
                </View>

                {/* Suggestions */}
                {(backendSuggestions.length > 0 || googleSuggestions.length > 0 || loadingLocations) && (
                    <View
                        style={{
                            backgroundColor: "#fff",
                            borderWidth: 1,
                            borderColor: "#e5e7eb",
                            borderRadius: 10,
                            marginTop: 4,
                            maxHeight: 220,
                            overflow: "hidden",
                        }}
                    >
                        <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                            {/* Backend results */}
                            <View style={{ paddingVertical: 4 }}>
                                {loadingLocations && (
                                    <View style={{ padding: 12 }}>
                                        <ActivityIndicator />
                                    </View>
                                )}
                                {backendSuggestions.length > 0 && (
                                    <View style={{ paddingVertical: 4 }}>
                                        <Text style={{ fontSize: 12, color: "#6b7280", paddingHorizontal: 12, paddingVertical: 6 }}>
                                            Lieux enregistrés
                                        </Text>
                                        {backendSuggestions.map((loc) => (
                                            <TouchableOpacity
                                                key={loc._id}
                                                style={{ paddingHorizontal: 12, paddingVertical: 10 }}
                                                onPress={() => selectBackendLocation(loc)}
                                            >
                                                <Text style={{ fontWeight: "600" }}>{loc.name}</Text>
                                                <Text style={{ color: "#6b7280", marginTop: 2 }}>{loc.address}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                {/* Google results */}
                                {googleSuggestions.length > 0 && (
                                    <View style={{ paddingVertical: 4, borderTopWidth: 1, borderTopColor: "#e5e7eb" }}>
                                        <Text style={{ fontSize: 12, color: "#6b7280", paddingHorizontal: 12, paddingVertical: 6 }}>
                                            Résultats Google
                                        </Text>
                                        {googleSuggestions.map((g) => (
                                            <TouchableOpacity
                                                key={g.place_id}
                                                style={{ paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8 }}
                                                onPress={() => selectGooglePlace(g)}
                                            >
                                                <Search size={16} color="#6b7280" />
                                                <Text style={{ flex: 1 }}>{g.description}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </ScrollView>
                    </View>
                )}

                {/* Bandeau de confirmation de sélection */}
                {!!locationId && (
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                            backgroundColor: "#f3f4f6",
                            borderWidth: 1,
                            borderColor: "#e5e7eb",
                            borderRadius: 10,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            marginTop: 8,
                        }}
                    >
                        <MapPin size={16} color="#6b7280" />
                        <Text style={{ flex: 1 }} numberOfLines={1}>
                            {selectedLabel || locationQuery}
                        </Text>
                        <TouchableOpacity onPress={resetLocation} accessibilityRole="button">
                            <Text style={{ color: "#ef4444", fontWeight: "600" }}>Réinitialiser</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Type */}
            <View style={{ marginTop: 12 }}>
                <Text style={{ fontWeight: "600", marginBottom: 8 }}>Type</Text>
                <View
                    style={{
                        borderWidth: 1,
                        borderColor: "#e5e7eb",
                        borderRadius: 10,
                        backgroundColor: "#fff",
                        overflow: "hidden",
                    }}
                >
                    <Picker
                        selectedValue={type}
                        onValueChange={(value) => setType(value)}
                        mode="dropdown"
                    >
                        {availableTypes.map((t) => (
                            <Picker.Item key={t} label={typeLabels[t]} value={t} />
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
                        gap: 8,
                    }}
                >
                    <Calendar size={18} color="#111827" />
                    <Text>{date.toLocaleDateString()}</Text>
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
                        gap: 8,
                    }}
                >
                    <Clock size={18} color="#111827" />
                    <Text>{time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
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
    );

    const Footer = (
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
                    <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>Créer l’événement</Text>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <>
        <FlatList
            data={[]}
            keyExtractor={() => "header-only"}
            ListHeaderComponent={Header}
            ListFooterComponent={Footer}
            contentContainerStyle={{ paddingBottom: 32, backgroundColor: "#f3f4f6" }}
            keyboardShouldPersistTaps="handled"
        />
        <BottomNavigation />
        </>
    );
}
