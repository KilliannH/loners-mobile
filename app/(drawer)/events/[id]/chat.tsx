import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import { useRoomStore } from "@/store/roomStore";
import { toastError } from "@/utils/toast";

type ChatMessage = {
    _id?: string;
    text: string;
    createdAt?: string;
    sender: { _id: string; username?: string; avatarUrl?: string };
};

export default function ChatRoomScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { id: eventIdParam } = useLocalSearchParams<{ id: string }>();
    const eventId = Array.isArray(eventIdParam) ? eventIdParam[0] : eventIdParam;
    const { user } = useAuth();
    const setActiveRoom = useRoomStore((s) => s.setActiveRoom);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [input, setInput] = useState("");
    const listRef = useRef<FlatList<ChatMessage>>(null);

    // ---- Fetch historique + mark-as-read
    const fetchMessages = useCallback(async () => {
        if (!eventId) return;
        try {
            setLoading(true);
            const [msgRes] = await Promise.all([
                api.get<{ messages: ChatMessage[] }>(`/chat/${eventId}`),
            ]);
            setMessages(msgRes.data?.messages ?? []);
        } catch {
            toastError("chat.errors.fetch");
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    const markAsRead = useCallback(async () => {
        if (!eventId) return;
        try {
            await api.post(`/notifications/mark-read/${eventId}`);
            // si tu tiens un store local des unreadByRoom côté mobile, décrémente ici
        } catch (e) {
            // silencieux
        }
    }, [eventId]);

    useEffect(() => {
        setActiveRoom(eventId);
        return () => setActiveRoom(null);
    }, [eventId]);

    useEffect(() => {
        fetchMessages();
        markAsRead();
    }, [fetchMessages, markAsRead]);

    // ---- Socket
    useEffect(() => {
        if (!eventId || !user?._id) return;

        // 1) connexion + identify
        (async () => {
            await socket.connect();
            await socket.identify(user._id); // 👈 important pour tes notifs côté serveur
            socket.join(String(eventId));
        })();

        const handleMessage = (msg: any) => setMessages((p) => [...p, msg]);
        socket.on("message:new", handleMessage);

        return () => {
            socket.leave(String(eventId));
            socket.off("message:new", handleMessage);
        };
    }, [eventId, user?._id]);

    // ---- Envoi
    const sendMessage = () => {
        const trimmed = input.trim();
        if (!trimmed || !user?._id) return;
        socket.emit("message:send", {
            eventId,
            text: trimmed,
            sender: user._id,
        });
        setInput("");
    };

    // ---- Rendu d'une bulle
    const renderItem = useCallback(
        ({ item, index }: { item: ChatMessage; index: number }) => {
            const isMe = item.sender?._id === user?._id;
            const prev = messages[index - 1];
            const showAvatar = !prev || prev.sender?._id !== item.sender?._id;

            return (
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: isMe ? "flex-end" : "flex-start",
                        alignItems: "flex-end",
                        paddingHorizontal: 12,
                        marginTop: index === 0 ? 8 : 4,
                    }}
                >
                    {/* Avatar gauche (autres) */}
                    {!isMe && showAvatar && !!item.sender?.avatarUrl && (
                        <View
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: 14,
                                overflow: "hidden",
                                marginRight: 8,
                                backgroundColor: "#e5e7eb",
                            }}
                        >
                            {/* Image RN inline simple */}
                            <Text
                                style={{
                                    fontSize: 10,
                                    textAlign: "center",
                                    lineHeight: 28,
                                    color: "#6b7280",
                                }}
                            >
                                {/* placeholder initiales */}
                                {item.sender.username?.[0]?.toUpperCase() ?? "?"}
                            </Text>
                        </View>
                    )}

                    <View
                        style={{
                            maxWidth: "75%",
                            backgroundColor: isMe ? "#2563eb" : "#f3f4f6",
                            paddingVertical: 8,
                            paddingHorizontal: 10,
                            borderRadius: 12,
                        }}
                    >
                        <Text
                            style={{
                                color: isMe ? "#fff" : "#111827",
                                fontSize: 14,
                            }}
                        >
                            {item.text}
                        </Text>
                        <Text
                            style={{
                                color: isMe ? "#dbeafe" : "#6b7280",
                                fontSize: 10,
                                marginTop: 4,
                            }}
                        >
                            {item.sender?.username || t("chat.unknown")}
                        </Text>
                    </View>

                    {/* Avatar droite (moi) */}
                    {isMe && showAvatar && !!user?.avatarUrl && (
                        <View
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: 14,
                                overflow: "hidden",
                                marginLeft: 8,
                                backgroundColor: "#e5e7eb",
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 10,
                                    textAlign: "center",
                                    lineHeight: 28,
                                    color: "#6b7280",
                                }}
                            >
                                {user?.username?.[0]?.toUpperCase() ?? "•"}
                            </Text>
                        </View>
                    )}
                </View>
            );
        },
        [messages, t, user?._id, user?.avatarUrl, user?.username]
    );

    const ListHeader = useMemo(
        () => (
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingHorizontal: 12,
                    paddingTop: 12,
                    paddingBottom: 6,
                    backgroundColor: "#fff",
                    borderBottomColor: "#e5e7eb",
                    borderBottomWidth: 1,
                }}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ flexDirection: "row", alignItems: "center", padding: 6 }}
                >
                    <ArrowLeft size={20} color="#374151" />
                    <Text style={{ marginLeft: 6, color: "#374151", fontSize: 16 }}>
                        {t("common.back")}
                    </Text>
                </TouchableOpacity>
            </View>
        ),
        [router, t]
    );

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: "#fff" }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
        >
            {ListHeader}

            {loading ? (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <ActivityIndicator />
                </View>
            ) : (
                <FlatList
                    ref={listRef}
                    data={messages}
                    keyExtractor={(_, i) => String(i)}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingVertical: 8 }}
                    onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
                />
            )}

            {/* Input bar */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    padding: 10,
                    borderTopWidth: 1,
                    borderTopColor: "#e5e7eb",
                    backgroundColor: "#fff",
                }}
            >
                <TextInput
                    value={input}
                    onChangeText={setInput}
                    onSubmitEditing={sendMessage}
                    placeholder={t("chat.inputPlaceholder")}
                    maxLength={300}
                    style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: "#93c5fd",
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: Platform.OS === "ios" ? 12 : 8,
                    }}
                />
                <TouchableOpacity
                    onPress={sendMessage}
                    style={{
                        backgroundColor: "#2563eb",
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 8,
                    }}
                >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>{t("chat.send")}</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}