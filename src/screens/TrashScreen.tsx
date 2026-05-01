import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { Endpoints } from "../api/endpoints";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";

type Props = { workspaceId: number; onBack?: () => void };
export const TrashScreen: React.FC<Props> = ({ workspaceId, onBack }) => {
  const { apiCall } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"contents" | "structure">("contents");

  // Fetch workspace trash contents
  const { data: contents, isLoading: contentsLoading } = useQuery({
    queryKey: ["trashContents", workspaceId],
    queryFn: () => apiCall((c) => c.get(Endpoints.trash.workspaceContents(workspaceId))),
  });

  // Restore trash item
  const restoreMut = useMutation({
    mutationFn: (payload: { trash_type: string; trash_item_id: number }) =>
      apiCall((c) => c.post(Endpoints.trash.restore, payload)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trashContents", workspaceId] });
      Alert.alert("Restored", "Item restored from trash.");
    },
    onError: (e: any) => Alert.alert("Error", e?.message || "Restore failed."),
  });

  // Empty all workspace trash
  const emptyMut = useMutation({
    mutationFn: () => apiCall((c) => c.delete(Endpoints.trash.emptyWorkspace(workspaceId))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trashContents", workspaceId] });
      Alert.alert("Emptied", "Workspace trash emptied.");
    },
    onError: (e: any) => Alert.alert("Error", e?.message || "Failed to empty trash."),
  });

  // Fetch global trash structure
  const { data: structure, isLoading: structureLoading } = useQuery({
    queryKey: ["trashStructure"],
    queryFn: () => apiCall((c) => c.get(Endpoints.trash.globalStructure())),
  });

  const trashItems = (() => {
    if (Array.isArray(contents)) return contents;
    if (contents?.items) return contents.items;
    return [];
  })();

  const supportedTypes = Array.isArray(structure)
    ? structure
    : structure?.supported_types || structure?.trash_types || [];

  return (
    <View style={s.container}>
      <TouchableOpacity onPress={onBack}><Text style={s.backText}>← Back</Text></TouchableOpacity>
      <View style={s.header}>
        <Text style={s.title}>Trash</Text>
        <TouchableOpacity style={[s.emptyBtn, emptyMut.isPending && s.disabled]} onPress={() =>
          Alert.alert("Empty Trash", "Delete ALL items in workspace trash?", [
            { text: "Cancel", style: "cancel" },
            { text: "Empty", style: "destructive", onPress: () => emptyMut.mutate() },
          ]))} disabled={emptyMut.isPending}>
          {emptyMut.isPending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.emptyBtnText}>Empty Trash</Text>}
        </TouchableOpacity>
      </View>

      <View style={s.tabs}>
        {(["contents", "structure"] as const).map((t) => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>
              {t === "contents" ? "Trash Contents" : "Trash Structure"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "contents" ? (
        contentsLoading ? <ActivityIndicator size="large" style={s.loader} /> : (
          <FlatList
            data={trashItems}
            keyExtractor={(item: any) => `${item.trash_type || item.type}-${item.id}`}
            renderItem={({ item }: { item: any }) => {
              const typeLabel = item.trash_type || item.type || "unknown";
              const name = item.name || item.value || `Item #${item.id}`;
              return (
                <View style={s.item}>
                  <View style={s.info}>
                    <Text style={s.itemName}>{name}</Text>
                    <Text style={s.meta}>Type: {typeLabel} · {item.deleted_at ? new Date(item.deleted_at).toLocaleDateString() : ""}</Text>
                  </View>
                  <TouchableOpacity style={s.restoreBtn} onPress={() => restoreMut.mutate({ trash_type: typeLabel, trash_item_id: item.id })}>
                    <Text style={s.restoreBtnText}>Restore</Text>
                  </TouchableOpacity>
                </View>
              );
            }}
            ListEmptyComponent={<Text style={s.empty}>Trash is empty.</Text>}
          />
        )
      ) : (
        structureLoading ? <ActivityIndicator size="large" style={s.loader} /> : (
          <FlatList
            data={supportedTypes}
            keyExtractor={(item: any, idx: number) => String(typeof item === "string" ? item : item.type || item.id || idx))}
            renderItem={({ item }: { item: any }) => (
              <View style={s.typeItem}>
                <Text style={s.typeName}>{typeof item === "string" ? item : item.type || `Type`}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={s.empty}>No structure data.</Text>}
          />
        )
      )}
    </View>
  );
};
const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  backText: { color: "#007AFF", fontSize: 16, marginBottom: 8 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "600" },
  emptyBtn: { backgroundColor: "#ff3b30", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  emptyBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  tabs: { flexDirection: "row", marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: "#ff3b30" },
  tabText: { fontSize: 13, color: "#666" },
  tabTextActive: { color: "#ff3b30", fontWeight: "600" },
  loader: { marginTop: 40 },
  item: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  info: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: "500" },
  meta: { fontSize: 12, color: "#666", marginTop: 2 },
  restoreBtn: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "#34c759", borderRadius: 4 },
  restoreBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  typeItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#eee" },
  typeName: { fontSize: 15 },
  empty: { textAlign: "center", color: "#999", marginTop: 30, fontSize: 16 },
  disabled: { opacity: 0.6 },
});
export default TrashScreen;