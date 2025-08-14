import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Button, FlatList, Text, TextInput, View } from "react-native";
import { createSocket } from "../../../lib/socket";

export default function ChatRoom() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [messages, setMessages] = useState<{ id:string; text:string; sender:string }[]>([]);
  const [input, setInput] = useState("");
  const socketRef = useRef<any>();

  useEffect(() => {
    (async () => {
      const s = await createSocket();
      socketRef.current = s;
      s.emit("join", eventId);
      s.on("message:new", (m:any) => setMessages((prev) => [...prev, m]));
    })();
    return () => { socketRef.current?.emit("leave", eventId); socketRef.current?.disconnect(); };
  }, [eventId]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    socketRef.current?.emit("message:send", { eventId, text });
    setInput("");
  };

  return (
    <View style={{ flex:1, padding:12 }}>
      <FlatList data={messages} keyExtractor={(i) => i.id ?? Math.random().toString()} renderItem={({ item }) => (
        <View style={{ paddingVertical:6 }}><Text>{item.sender}: {item.text}</Text></View>
      )} />
      <View style={{ flexDirection:"row", gap:8 }}>
        <TextInput style={{ flex:1, borderWidth:1, borderColor:"#ddd", borderRadius:10, padding:10 }} value={input} onChangeText={setInput} placeholder="Type…" />
        <Button title="Send" onPress={send} />
      </View>
    </View>
  );
}