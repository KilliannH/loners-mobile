import api from "@/services/api";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Calendar, Clock } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const availableTypes = ["concert", "spectacle", "soiree_a_theme", "expo", "autre"];

export default function CreateEventScreen() {
    const router = useRouter();

    // ------- form state -------
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState(availableTypes[0]);

    const [date, setDate] = useState<Date>(new Date());
    const [showDate, setShowDate] = useState(false);
    const [time, setTime] = useState<Date>(new Date());
    const [showTime, setShowTime] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const canSubmit = useMemo(
        () => !!name.trim() && !!type,
        [name, type]
    );

    // ------- handlers -------

    const onChangeDate = (_, d?: Date) => {
        setShowDate(false);
        if (d) setDate(d);
    };
    const onChangeTime = (_, t?: Date) => {
        setShowTime(false);
        if (t) setTime(t);
    };

    const combineDateTime = (d: Date, t: Date) => {
        const out = new Date(d);
        out.setHours(t.getHours(), t.getMinutes(), 0, 0);
        return out;
    };

    const submit = useCallback(async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        try {
            const when = combineDateTime(date, time).toISOString();

            // payload minimal – adapte à ton backend si besoin
            const payload: any = {
                name: name.trim(),
                description: description.trim(),
                type,
                date: when,
            };

            const { data } = await api.post("/events", payload);
            // succès → on peut router vers la home ou la page détail
            router.replace("/"); // ou router.push(`/events/${data._id}`)
        } catch (e: any) {
            console.log(e?.response?.data || e?.message);
            Alert.alert("Erreur", "Impossible de créer l’événement. Réessaie.");
        } finally {
            setSubmitting(false);
        }
    }, [canSubmit, date, time, name, description, type, router]);

    // ------- UI -------
    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: "#f3f4f6" }}
            contentContainerStyle={{ paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
        >
            {/* Header */}
            <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 22, fontWeight: "800", marginBottom: 12 }}>
                    Créer un événement
                </Text>

                {/* Titre */}
                <TextInput
                    placeholder="Nom de l’événement"
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

                {/* Types */}
                <View style={{ marginTop: 12 }}>
                    <Text style={{ fontWeight: "600", marginBottom: 8 }}>Type</Text>
                    <View
                        style={{
                            borderWidth: 1,
                            borderColor: "#e5e7eb",
                            borderRadius: 10,
                            backgroundColor: "#fff",
                            overflow: "hidden",
                            marginBottom: 16,
                        }}
                    >
                        <Picker
                            selectedValue={type}
                            onValueChange={(value) => setType(value)}
                            mode="dropdown"
                        >
                            {availableTypes.map((t) => (
                                <Picker.Item key={t} label={t} value={t} />
                            ))}
                        </Picker>
                    </View>
                </View>

                {/* Date & time */}
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
            </View>

            {/* Submit button */}
            <TouchableOpacity
                disabled={!canSubmit || submitting}
                onPress={submit}
                style={{
                    opacity: !canSubmit || submitting ? 0.6 : 1,
                    borderRadius: 12,
                    overflow: "hidden",
                    marginTop: 16,
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
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>
                            Créer l’événement
                        </Text>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        </ScrollView >
    );
}