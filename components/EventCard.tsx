import { useRouter } from "expo-router";
import { Users } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";

export type EventItem = {
  _id: string;
  name: string;
  description?: string;
  type?: string;
  attendees?: Array<string>;
};

type Props = {
  item: EventItem;
  isLast?: boolean;
};

export default function EventCard({ item, isLast = false }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const participants = item.attendees?.length ?? 0;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/event_details/${item._id}`)}
      activeOpacity={0.85}
      style={{ paddingHorizontal: 16 }}
    >
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: 12,
          marginTop: 10,
          marginBottom: isLast ? 24 : 0,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 2,
          elevation: 1,
        }}
      >
        <Text style={{ fontWeight: "700", fontSize: 16 }} numberOfLines={2}>
          {item.name}
        </Text>

        {!!item.description && (
          <Text style={{ color: "#6b7280", marginTop: 4 }} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 10,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Users size={14} color="#9ca3af" />
            <Text style={{ color: "#9ca3af", fontSize: 12, marginLeft: 6 }}>
              {t("event.participants", { count: participants })}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "#f3f4ff",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: "#4f46e5", fontSize: 12 }}>
              {t(`createEvent.types.${item.type ?? "autre"}`)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}