import { toastError, toastSuccess } from "@/utils/toast";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";

const BIO_MAX = 100;
const USERNAME_MAX = 30;
const AVATARURL_MAX = 200;

export default function UpdateProfileScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { user, setUser, refreshUser } = useAuth();

    const [form, setForm] = useState({
        username: user?.username ?? "",
        avatarUrl: user?.avatarUrl ?? "",
        bio: user?.bio ?? "",
    });
    const [loading, setLoading] = useState(false);

    const canSubmit = useMemo(
        () => !!form.username.trim(),
        [form.username]
    );

    const handleChange = (key: keyof typeof form, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleUpdate = async () => {
        if (!canSubmit || loading) return;
        setLoading(true);
        try {
            const res = await api.put("/users/me", form);
            setUser?.(res.data);
            // sécurité: force un /me (optionnel)
            // await refreshUser?.();

            toastSuccess(t("updateProfile.toast.success"));
            router.push("/profile");
        } catch (err) {
            console.log("update profile error:", err);
            toastError(t("updateProfile.toast.error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.select({ ios: "padding", android: undefined })}
            style={{ flex: 1, backgroundColor: "#fff" }}
        >
            <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ padding: 6, marginRight: 8 }}>
                        <ArrowLeft size={20} color="#374151" />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 20, fontWeight: "800" }}>
                        {t("updateProfile.title", "Mon profil")}
                    </Text>
                </View>

                {/* Username */}
                <TextInput
                    value={form.username}
                    onChangeText={(v) => handleChange("username", v)}
                    maxLength={USERNAME_MAX}
                    placeholder={t("updateProfile.fields.username", "Nom d'utilisateur")}
                    style={{
                        backgroundColor: "#fff",
                        borderWidth: 1,
                        borderColor: "#e5e7eb",
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                    }}
                />

                {/* Bio */}
                <Text style={{ marginTop: 12, marginBottom: 6, fontWeight: "600", color: "#111827" }}>
                    {t("updateProfile.fields.bioLabel", "Bio")}
                </Text>
                <TextInput
                    value={form.bio}
                    onChangeText={(v) => handleChange("bio", v)}
                    maxLength={BIO_MAX}
                    multiline
                    placeholder={t("updateProfile.fields.bio", "Quelques mots sur toi")}
                    style={{
                        backgroundColor: "#fff",
                        borderWidth: 1,
                        borderColor: "#e5e7eb",
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        minHeight: 90,
                        textAlignVertical: "top",
                    }}
                />
                <Text style={{ color: "#9ca3af", fontSize: 12, textAlign: "right", marginTop: 4 }}>
                    {form.bio.length}/{BIO_MAX}
                </Text>

                {/* Avatar URL */}
                <TextInput
                    value={form.avatarUrl}
                    onChangeText={(v) => handleChange("avatarUrl", v)}
                    maxLength={AVATARURL_MAX}
                    placeholder={t("updateProfile.fields.avatarUrl", "URL de l'avatar (optionnel)")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={{
                        backgroundColor: "#fff",
                        borderWidth: 1,
                        borderColor: "#e5e7eb",
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        marginTop: 12,
                    }}
                />

                {!!form.avatarUrl && (
                    <View style={{ alignItems: "center", marginTop: 12 }}>
                        <Image
                            source={{ uri: form.avatarUrl }}
                            style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderColor: "#e5e7eb" }}
                        />
                    </View>
                )}

                {/* Submit */}
                <TouchableOpacity
                    onPress={handleUpdate}
                    disabled={!canSubmit || loading}
                    style={{
                        marginTop: 16,
                        backgroundColor: "#000",
                        paddingVertical: 12,
                        borderRadius: 10,
                        alignItems: "center",
                        opacity: !canSubmit ? 0.6 : 1,
                    }}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={{ color: "#fff", fontWeight: "700" }}>
                            {t("updateProfile.status.submit", "Mettre à jour")}
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}