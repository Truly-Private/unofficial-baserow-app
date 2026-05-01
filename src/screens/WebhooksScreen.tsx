import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { Endpoints } from "../api/endpoints";
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert,
  ActivityIndicator, Switch,
} from "react-native";

type Props = { tableId: number; onBack?: () => void };

export const WebhooksScreen: React.FC<Props> = ({ tableId, onBack }) => {
  const { apiCall } = useAuth();
  const qc = useQueryClient();
  const [newUrl, setNewUrl] = useState("");
  const [useCustomEvents, setUseCustomEvents] = useState(false);
  const [allEvents, setAllEvents] = useState(true);

  // Fetch webhooks
  const { data: webhooks, isLoading } = useQuery({
    queryKey: ["webhooks", tableId],
    queryFn: () => apiCall((c) => c.get(Endpoints.webhooks.list(tableId))),
  });

  // Create webhook
  const createMut = useMutation({
    mutationFn: (payload: any) => apiCall((c) => c.post(Endpoints.webhooks.create(tableId), payload)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["webhooks", tableId] }); setNewUrl(""); },
  });

  // Update webhook
  const updateMut = useMutation({
    mutationFn: ({ id, ...payload }: any) =>
      apiCall((c) => c.patch(Endpoints.webhooks.update(id), payload)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["webhooks", tableId] }); },
  });

  // Delete webhook
  const deleteMut = useMutation({
    mutationFn: (id: number) => apiCall((c) => c.delete(Endpoints.webhooks.delete(id))),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["webhooks", tableId] }); },
  });

  // Test webhook
  const testMut = useMutation({
    mutationFn: (id: number) => apiCall((c) => c.post(Endpoints.webhooks.testCall(id))),
    onSuccess: () => Alert.alert("Test Sent", "Webhook test call dispatched."),
    onError: (e: any) => Alert.alert("Error", e?.message || "Failed to send test."),
  });

  const handleCreate = () => {
    if (!newUrl.trim()) return;
    createMut.mutate({ url: newUrl.trim(), use_custom_events: useCustomEvents, all_events: allEvents });
  };

  const handleDelete = (id: number, url: string) => {
    Alert.alert("Delete Webhook", `Remove webhook for ${url}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMut.mutate(id) },
    ]);
  };

  const webhookList = Array.isArray(webhooks) ? webhooks : webhooks?.results || [];

  return (
    <View style={s.container}>
      <TouchableOpacity onPress={onBack}><Text style={s.backText}>← Back</Text></TouchableOpacity>
      <Text style={s.title}>Webhooks</Text>

      {/* Create form */}
      <View style={s.form}>
        <TextInput style={s.input} placeholder="https://your-webhook-url.com/hook" value={newUrl} onChangeText={setNewUrl} autoCapitalize="none" keyboardType="url" />
        <View style={s.row}>
          <Text style={s.label}>Use custom events</Text>
          <Switch value={useCustomEvents} onValueChange={setUseCustomEvents} />
        </View>
        <View style={s.row}>
          <Text style={s.label}>All events</Text>
          <Switch value={allEvents} onValueChange={setAllEvents} />
        </View>
        <TouchableOpacity style={[s.btn, createMut.isPending && s.disabled]} onPress={handleCreate} disabled={createMut.isPending}>
          {createMut.isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create Webhook</Text>}
        </TouchableOpacity>
      </View>

      {/* List */}
      {isLoading ? <ActivityIndicator size="large" style={s.loader} /> : (
        <FlatList
          data={webhookList}
          keyExtractor={(item: any) => String(item.id)}
          renderItem={({ item }: { item: any }) => (
            <View style={s.item}>
              <View style={s.info}>
                <Text style={s.itemName}>{item.url}</Text>
                <Text style={s.meta}>{item.is_active ? "Active" : "Inactive"} · {item.all_events ? "All events" : "Custom events"}</Text>
              </View>
              <View style={s.actions}>
                <TouchableOpacity onPress={() => updateMut.mutate({ id: item.id, is_active: !item.is_active })}>
                  <Text style={s.actionText}>{item.is_active ? "Disable" : "Enable"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => testMut.mutate(item.id)} disabled={testMut.isPending}>
                  <Text style={s.actionText}>Test</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id, item.url)}>
                  <Text style={s.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={s.empty}>No webhooks. Create one above!</Text>}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  backText: { color: "#007AFF", fontSize: 16, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "600", marginBottom: 16 },
  form: { padding: 12, backgroundColor: "#f5f5f5", borderRadius: 8, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 6, padding: 10, fontSize: 16, marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  label: { fontSize: 15 },
  btn: { backgroundColor: "#007AFF", padding: 12, borderRadius: 6, alignItems: "center" },
  disabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  loader: { marginTop: 40 },
  item: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  info: { marginBottom: 6 },
  itemName: { fontSize: 15, wordBreak: "break-all" },
  meta: { fontSize: 12, color: "#666", marginTop: 2 },
  actions: { flexDirection: "row", gap: 12 },
  actionText: { color: "#007AFF", fontSize: 14 },
  deleteText: { color: "#ff3b30", fontSize: 14 },
  empty: { textAlign: "center", color: "#999", marginTop: 20 },
});

export default WebhooksScreen;