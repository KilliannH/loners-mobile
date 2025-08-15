// app/events/[id]/edit.tsx
import api from "@/services/api";
import { availableTypes } from "@/utils/eventTypes";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Calendar, Clock, MapPin } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    Pressable,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type EventDetails = {
    _id: string;
    name: string;
    description: string;
    type: string;
    date: string; // ISO
    location?: {
        name?: string;
        address?: string;
        description?: string;
        coordinates?: { coordinates: [number, number] };
    };
    owner?: { _id: string };
};

export default function EditEventScreen() {
    const { t } = useTranslation();
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const eventId = Array.isArray(id) ? id[0] : id;

    // Chargement / sauvegarde
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Valeurs actuelles (éditables)
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<(typeof availableTypes)[number]>("concert");
    const [date, setDate] = useState<Date>(new Date());
    const [time, setTime] = useState<Date>(new Date());

    // Valeurs initiales (pour détecter les changements)
    const [initialName, setInitialName] = useState("");
    const [initialDescription, setInitialDescription] = useState("");
    const [initialType, setInitialType] = useState<(typeof availableTypes)[number]>("concert");
    const [initialDateISO, setInitialDateISO] = useState<string>("");

    // Lecture seule
    const [locationLabel, setLocationLabel] = useState<string | undefined>(undefined);

    // Pickers
    const [showDate, setShowDate] = useState(false);
    const [showTime, setShowTime] = useState(false);

    // Charger l’event existant
    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await api.get<EventDetails>(`/events/${id}`);
                const ev = res.data;

                setName(ev.name || "");
                setDescription(ev.description || "");
                const d = ev.date ? new Date(ev.date) : new Date();
                setDate(d);
                setTime(d);
                // type
                const t = (availableTypes.includes(ev.type as any) ? ev.type : "autre") as (typeof availableTypes)[number];
                setType(t);

                // init “baseline” pour diff
                setInitialName(ev.name || "");
                setInitialDescription(ev.description || "");
                setInitialType(t);
                setInitialDateISO(d.toISOString());

                // label lieu
                setLocationLabel(
                    ev.location?.name
                        ? `${ev.location.name}${ev.location.address ? " - " + ev.location.address : ""}`
                        : ev.location?.address || ev.location?.description
                );
            } catch (e: any) {
                console.log(e?.response?.data || e?.message);
                Alert.alert("Erreur", "Impossible de charger l’événement.");
                router.back();
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchEvent();
    }, [id, router]);

    const combineDateTime = (d: Date, t: Date) => {
        const out = new Date(d);
        out.setHours(t.getHours(), t.getMinutes(), 0, 0);
        return out;
    };

    const onChangeDate = (_: any, d?: Date) => {
        setShowDate(false);
        if (d) setDate(d);
    };
    const onChangeTime = (_: any, t?: Date) => {
        setShowTime(false);
        if (t) setTime(t);
    };

    // Validation description & nom
    const baseValid = useMemo(
        () => !!name.trim() && !!description.trim(),
        [name, description]
    );

    // Validation “date dans le futur”
    const combined = useMemo(() => combineDateTime(date, time), [date, time]);
    const isFuture = useMemo(() => combined.getTime() > Date.now(), [combined]);

    // Détection des changements
    const changed = useMemo(() => {
        const initialDate = new Date(initialDateISO);
        const hasName = name.trim() !== initialName.trim();
        const hasDesc = description.trim() !== initialDescription.trim();
        const hasType = type !== initialType;

        // comparer date+heure (arrondie à la minute)
        const round = (d: Date) => {
            const r = new Date(d);
            r.setSeconds(0, 0);
            return r.getTime();
        };
        const hasDate = round(combined) !== round(initialDate);

        return hasName || hasDesc || hasType || hasDate;
    }, [name, initialName, description, initialDescription, type, initialType, combined, initialDateISO]);

    const canSubmit = baseValid && isFuture && changed;

    const handleSave = useCallback(async () => {
        if (!canSubmit) return;
        setSaving(true);
        try {
            await api.put(`/events/${id}`, {
                name: name.trim(),
                description: description.trim(),
                type,
                date: combined.toISOString(),
            });
            router.push(`/event_details/${id}`);
        } catch (e: any) {
            console.log(e?.response?.data || e?.message);
            Alert.alert("Erreur", "Impossible de mettre à jour l’événement.");
        } finally {
            setSaving(false);
        }
    }, [canSubmit, id, name, description, type, combined, router]);

    if (loading) {
        return (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    const Header = (
        <View style={{ padding: 16 }}>
            {/* Back */}
            <TouchableOpacity
                onPress={() => router.push({ pathname: "/event_details/[id]", params: { id: String(eventId) } })}
                style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}
            >
                <ArrowLeft size={20} color="#4b5563" />
                <Text style={{ marginLeft: 6, color: "#4b5563" }}>Retour</Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 22, fontWeight: "800", marginBottom: 12 }}>
                {t("editEvent.title")}
            </Text>

            {/* Nom */}
            <TextInput
                placeholder={t("editEvent.name")}
                value={name}
                onChangeText={setName}
                style={{
                    backgroundColor: "#fff",
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    borderRadius: 10,
                    padding: 12,
                }}
            />

            {/* Description */}
            <TextInput
                placeholder={t("editEvent.description")}
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

            {/* Type (modifiable) */}
            <View style={{ marginTop: 12 }}>
                <Text style={{ fontWeight: "600", marginBottom: 8 }}>{t("editEvent.type")}</Text>
                <View
                    style={{
                        borderWidth: 1,
                        borderColor: "#e5e7eb",
                        borderRadius: 10,
                        backgroundColor: "#fff",
                        overflow: "hidden",
                    }}
                >
                    {/* Picker natif */}
                    <Picker
                        selectedValue={type}
                        onValueChange={(value) => setType(value)}
                        mode="dropdown"
                    >
                        {availableTypes.map((tk) => (
                            <Picker.Item key={tk} label={t(`createEvent.types.${tk}`)} value={tk} />
                        ))}
                    </Picker>
                </View>
            </View>

            {/* Lieu (lecture seule) */}
            {!!locationLabel && (
                <View style={{ marginTop: 12 }}>
                    <Text style={{ fontWeight: "600", marginBottom: 8 }}>{t("editEvent.location")}</Text>
                    <View
                        style={{
                            backgroundColor: "#f3f4f6",
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
                        <MapPin size={16} color="#6b7280" />
                        <Text style={{ color: "#374151", flex: 1 }} numberOfLines={2}>
                            {locationLabel}
                        </Text>
                    </View>
                </View>
            )}

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
                    <Text>
                        {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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

            {/* Message d’erreur date si besoin */}
            {!isFuture && (
                <Text style={{ color: "#ef4444", marginTop: 8 }}>
                    {t("editEvent.futureError")}
                </Text>
            )}
        </View>
    );

    const Footer = (
        <TouchableOpacity
            onPress={handleSave}
            disabled={!canSubmit || saving}
            style={{
                borderRadius: 8,
                overflow: "hidden",
                margin: 16,
                opacity: !canSubmit ? 0.6 : 1,
            }}
        >
            <LinearGradient
                colors={["#2563eb", "#4f46e5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                    paddingVertical: 14,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {saving ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>
                        {t("editEvent.save")}
                    </Text>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <FlatList
            data={[]}
            keyExtractor={() => "header-only"}
            ListHeaderComponent={Header}
            ListFooterComponent={Footer}
            contentContainerStyle={{ paddingBottom: 32, backgroundColor: "#f3f4f6" }}
            keyboardShouldPersistTaps="handled"
        />
    );
}
