import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useAuth, useCreds } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";
import {
  listApplicationSnapshots as listSnapshots,
  createApplicationSnapshot as createSnapshot,
  restoreSnapshot,
  deleteSnapshot,
  type Snapshot,
} from "@/lib/baserow";

export default function SnapshotsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const creds = useCreds();
  const { apiCall } = useAuth();
  const queryClient = useQueryClient();

  const params = useLocalSearchParams<{ 
    applicationId: string; 
    applicationName?: string 
  }>();
  
  const applicationId = Number(params.applicationId);
  const applicationName = params.applicationName ?? "Database";

  const [newSnapshotName, setNewSnapshotName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16);

  // ─── Queries ───────────────────────────────────────────────────────────────

  const snapshotsQuery = useQuery({
    queryKey: ["snapshots", applicationId],
    queryFn: () => apiCall((c) => listSnapshots(c, applicationId)),
    enabled: Number.isFinite(applicationId),
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: () => apiCall((c) => createSnapshot(c, applicationId, { name: newSnapshotName.trim() })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snapshots", applicationId] });
      setNewSnapshotName("");
      setShowCreateForm(false);
      Alert.alert("Success", "Snapshot creation started. It will appear here once ready.");
    },
    onError: (e) => Alert.alert("Error", e instanceof Error ? e.message : "Could not create snapshot."),
  });

  const restoreMutation = useMutation({
    mutationFn: (snapshotId: number) => apiCall((c) => restoreSnapshot(c, snapshotId)),
    onSuccess: () => {
      Alert.alert("Success", "Restoration started. The restored database will appear in your dashboard soon.");
    },
    onError: (e) => Alert.alert("Error", e instanceof Error ? e.message : "Could not restore snapshot."),
  });

  const deleteMutation = useMutation({
    mutationFn: (snapshotId: number) => apiCall((c) => deleteSnapshot(c, snapshotId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["snapshots", applicationId] }),
    onError: (e) => Alert.alert("Error", e instanceof Error ? e.message : "Could not delete snapshot."),
  });

  // ─── Handlers ──────────────────────────────────────────────────────────────

  function confirmRestore(s: Snapshot) {
    Alert.alert(
      "Restore snapshot?",
      `A new database will be created from "${s.name}". The current database will not be affected.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Restore", onPress: () => restoreMutation.mutate(s.id) },
      ]
    );
  }

  function confirmDelete(s: Snapshot) {
    Alert.alert("Delete snapshot?", `Are you sure you want to permanently delete "${s.name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(s.id) },
    ]);
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const snapshots: Snapshot[] = snapshotsQuery.data ?? [];

  return (
    <View style={[ss.root, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: `Snapshots — ${applicationName}`,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
        }}
      />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 80 }}
        refreshControl={
          <RefreshControl
            refreshing={snapshotsQuery.isRefetching}
            onRefresh={() => snapshotsQuery.refetch()}
            tintColor={colors.primary}
          />
        }
      >
        {showCreateForm ? (
          <View style={[ss.createForm, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <Text style={[ss.formTitle, { color: colors.foreground }]}>Create Snapshot</Text>
            <TextInput
              style={[ss.input, { color: colors.text, backgroundColor: colors.muted, borderColor: colors.border, borderRadius: colors.radius }]}
              value={newSnapshotName}
              onChangeText={setNewSnapshotName}
              placeholder="Snapshot name (e.g. Before big import)"
              placeholderTextColor={colors.mutedForeground}
              autoFocus
            />
            <View style={ss.formBtns}>
              <Pressable style={[ss.btn, ss.btnOutline, { borderColor: colors.border }]} onPress={() => setShowCreateForm(false)}>
                <Text style={[ss.btnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[ss.btn, { backgroundColor: newSnapshotName.trim() ? colors.primary : colors.muted }]}
                onPress={() => createMutation.mutate()}
                disabled={!newSnapshotName.trim() || createMutation.isPending}
              >
                <Text style={[ss.btnText, { color: newSnapshotName.trim() ? colors.primaryForeground : colors.mutedForeground }]}>
                  {createMutation.isPending ? "Creating..." : "Create"}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            style={[ss.addBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
            onPress={() => setShowCreateForm(true)}
          >
            <Feather name="camera" size={16} color={colors.primaryForeground} />
            <Text style={[ss.addBtnText, { color: colors.primaryForeground }]}>Take New Snapshot</Text>
          </Pressable>
        )}

        {snapshotsQuery.isLoading ? (
          <LoadingState />
        ) : snapshots.length === 0 ? (
          <View style={ss.emptyState}>
            <Feather name="camera-off" size={48} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
            <Text style={[ss.emptyTitle, { color: colors.text }]}>No snapshots yet</Text>
            <Text style={[ss.emptySubtitle, { color: colors.mutedForeground }]}>
              Snapshots are point-in-time copies of your database.
            </Text>
          </View>
        ) : (
          <View style={[ss.list, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            {snapshots.map((s: Snapshot, idx: number) => (
              <View key={s.id} style={[ss.row, { borderBottomColor: colors.border, borderBottomWidth: idx === snapshots.length - 1 ? 0 : 0.5 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[ss.snapshotName, { color: colors.text }]}>{s.name ?? ""}</Text>
                  <Text style={[ss.snapshotMeta, { color: colors.mutedForeground }]}>
                    Created {s.created_on ? new Date(s.created_on).toLocaleString() : ""}
                  </Text>
                </View>
                <View style={ss.rowActions}>
                  <Pressable onPress={() => confirmRestore(s)} hitSlop={8} style={ss.actionBtn}>
                    <Feather name="rotate-ccw" size={18} color={colors.primary} />
                  </Pressable>
                  <Pressable onPress={() => confirmDelete(s)} hitSlop={8} style={ss.actionBtn}>
                    <Feather name="trash-2" size={18} color={colors.destructive} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const ss = StyleSheet.create({
  root: { flex: 1 },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, marginBottom: 20 },
  addBtnText: { fontSize: 15, fontWeight: "600" },
  createForm: { padding: 16, borderWidth: 1, gap: 12, marginBottom: 20 },
  formTitle: { fontSize: 16, fontWeight: "700" },
  input: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  formBtns: { flexDirection: "row", gap: 10 },
  btn: { flex: 1, paddingVertical: 11, borderRadius: 8, alignItems: "center" },
  btnOutline: { borderWidth: 1 },
  btnText: { fontSize: 14, fontWeight: "600" },
  list: { borderWidth: 1, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", padding: 14 },
  snapshotName: { fontSize: 15, fontWeight: "600" },
  snapshotMeta: { fontSize: 12, marginTop: 2 },
  rowActions: { flexDirection: "row", gap: 16 },
  actionBtn: { padding: 4 },
  emptyState: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
