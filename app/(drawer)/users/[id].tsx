import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import BottomNavigation from "@/components/BottomNavigation";
import EventCard from "@/components/EventCard";
import api from "@/services/api";
import { toastError } from "@/utils/toast";

type EventItem = {
    _id: string;
    name: string;
    description?: string;
    type?: string;
    date: string;
    attendees?: Array<{ _id: string }>;
    owner: { _id: string };
    location?: any;
};

type FetchedUser = {
    _id: string;
    username: string;
    avatarUrl?: string;
    bio?: string;
};

export default function UserProfileScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { id, backTo } = useLocalSearchParams<{ id: string; backTo?: string }>();
    const [user, setUser] = useState<FetchedUser | null>(null);
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);

    const onBack = () => {
        if (backTo) {
            router.push(String(backTo));
        } else {
            router.replace("/home");
        }
    };

    useEffect(() => {
        const fetchUserAndEvents = async () => {
            try {
                const res = await api.get(`/users/${id}`);
                setUser(res.data?.user);
                setEvents(res.data?.events ?? []);
            } catch (err) {
                toastError("userProfile.toast.fetchUserError");
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchUserAndEvents();
    }, [id]);

    const now = useMemo(() => new Date(), []);
    const upcoming = useMemo(
        () => events.filter((e) => new Date(e.date) >= now),
        [events, now]
    );
    const recentPast = useMemo(() => {
        return events.filter((e) => {
            const d = new Date(e.date);
            if (d >= now) return false;
            const diffDays = (Number(now) - Number(d)) / (1000 * 60 * 60 * 24);
            return diffDays <= 7;
        });
    }, [events, now]);

    if (loading) {
        return (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
                <ActivityIndicator />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
                <Text>{t("userProfile.notFound", "Utilisateur introuvable")}</Text>
            </View>
        );
    }

    return (
        <>
            <ScrollView
                style={{ flex: 1, backgroundColor: "#f3f4f6" }}
                contentContainerStyle={{ padding: 16, paddingBottom: 90 }}
            >
                {/* Header */}
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                    <TouchableOpacity
                        onPress={onBack}
                        style={{ flexDirection: "row", alignItems: "center" }}
                    >
                        <ArrowLeft size={20} color="#4b5563" />
                        <Text style={{ marginLeft: 6, color: "#4b5563", fontSize: 16 }}>
                            {t("common.back")}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Avatar + Infos */}
                <View style={{ alignItems: "center", marginBottom: 16 }}>
                    {user.avatarUrl ? (
                        <Image
                            source={{ uri: user.avatarUrl }}
                            style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 1, borderColor: "#e5e7eb" }}
                        />
                    ) : (
                        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: "#e5e7eb" }} />
                    )}
                    <Text style={{ marginTop: 10, fontSize: 18, fontWeight: "700" }}>{user.username}</Text>
                    {!!user.bio && (
                        <Text style={{ marginTop: 6, color: "#6b7280", fontStyle: "italic", textAlign: "center" }}>
                            “{user.bio}”
                        </Text>
                    )}
                </View>

                {/* Événements à venir */}
                <View style={{ marginTop: 8 }}>
                    <Text style={{ fontWeight: "700", color: "#111827", marginBottom: 8 }}>
                        {t("userProfile.upcomingEvents", "Événements à venir")}
                    </Text>
                    {upcoming.length === 0 ? (
                        <Text style={{ color: "#6b7280" }}>
                            {t("userProfile.noUpcoming", "Aucun événement à venir.")}
                        </Text>
                    ) : (
                        upcoming.map((ev) => <EventCard key={ev._id} item={ev} />)
                    )}
                </View>

                {/* Événements récents (passés) */}
                <View style={{ marginTop: 16 }}>
                    <Text style={{ fontWeight: "700", color: "#6b7280", marginBottom: 8 }}>
                        {t("userProfile.pastEvents", "Événements récents (passés)")}
                    </Text>
                    {recentPast.length === 0 ? (
                        <Text style={{ color: "#9ca3af" }}>
                            {t("userProfile.noPast", "Aucun événement récent.")}
                        </Text>
                    ) : (
                        recentPast.map((ev) => (
                            <View key={ev._id} style={{ position: "relative" }}>
                                <View style={{ opacity: 0.6 }}>
                                    <EventCard item={ev} />
                                </View>
                                <View
                                    style={{
                                        position: "absolute",
                                        top: 8,
                                        right: 16,
                                        backgroundColor: "#ef4444",
                                        paddingHorizontal: 8,
                                        paddingVertical: 4,
                                        borderRadius: 4,
                                    }}
                                >
                                    <Text style={{ color: "#fff", fontSize: 10 }}>
                                        {t("common.pastEvent", "Événement passé")}
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            <BottomNavigation />
        </>
    );
}