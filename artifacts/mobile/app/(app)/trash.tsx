/**
 * TrashScreen — browse, restore, and permanently delete trashed items.
 *
 * Route: /trash
 * Accessible from Settings → Administration → Trash (superusers)
 * or via any workspace's context menu.
 *
 * API endpoints used:
 *   GET    /api/trash/workspace/{workspace_id}/
 *   PATCH  /api/trash/restore/
 *   DELETE /api/trash/workspace/{workspace_id}/
 */

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
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useAuth, useCreds } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";
import {
  emptyWorkspaceTrash,
  listWorkspaceTrash,
  listWorkspaces,
  restoreTrashItem,
  type TrashItem,
} from "@/lib/baserow";

// ─── Item type meta ───────────────────────────────────────────────────────────

type TrashIcon = keyof typeof Feather.glyphMap;
const TYPE_ICONS: Record<string, TrashIcon> = {
  table: "grid",
  field: "columns",
  row: "list",
  application: "database",
  workspace: "folder",
};
const TYPE_LABELS: Record<string, string> = {
  table: "Table",
  field: "Field",
  row: "Row",
  application: "App / Database",
  workspace: "Workspace",
};

function typeIcon(type: string): TrashIcon {
  return TYPE_ICONS[type] ?? "trash-2";
}
function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

// ─── Trash Item Row ───────────────────────────────────────────────────────────

function TrashRow({
  item,
  colors,
  onRestore,
}: {
  item: TrashItem;
  colors: ReturnType<typeof useColors>;
  onRestore: (i: TrashItem) => void;
}) {
  const date = new Date(item.trashed_at);
  const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

  return (
    <View
      style={[ts.trashRow, { borderBottomColor: colors.border }]}
      testID={`trash-item-${item.id}`}
    >
      <View style={[ts.typeIcon, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Feather name={typeIcon(item.trash_item_type)} size={14} color={colors.mutedForeground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[ts.itemName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[ts.itemMeta, { color: colors.mutedForeground }]}>
          {typeLabel(item.trash_item_type)} · {dateStr}
          {item.user_who_trashed ? ` · by ${item.user_who_trashed.name}` : ""}
        </Text>
      </View>
      <Pressable
        style={[ts.restoreBtn, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" }]}
        onPress={() => onRestore(item)}
        hitSlop={8}
        testID={`restore-btn-${item.id}`}
      >
        <Feather name="rotate-ccw" size={13} color={colors.primary} />
        <Text style={[ts.restoreBtnText, { color: colors.primary }]}>Restore</Text>
      </Pressable>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TrashScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16);
  const creds = useCreds();
  const { apiCall } = useAuth();
  const queryClient = useQueryClient();

  const { workspaceId } = useLocalSearchParams<{ workspaceId: string }>();

  // Workspace picker state
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(
    workspaceId ? parseInt(workspaceId) : null,
  );
  const [showWsPicker, setShowWsPicker] = useState(false);

  // ─── Queries ───────────────────────────────────────────────────────────────

  const workspacesQuery = useQuery({
    queryKey: ["workspaces", creds.baseUrl, creds.user.id],
    queryFn: () => apiCall((c) => listWorkspaces(c)),
    select: (data) => data,
  });

  const workspaces = workspacesQuery.data ?? [];
  const effectiveWsId = selectedWorkspaceId ?? workspaces[0]?.id ?? null;
  const effectiveWsName = workspaces.find((w) => w.id === effectiveWsId)?.name ?? "Workspace";

  const trashQuery = useQuery({
    queryKey: ["trash", effectiveWsId],
    queryFn: () => apiCall((c) => listWorkspaceTrash(c, effectiveWsId!)),
    enabled: effectiveWsId !== null,
  });

  const items = trashQuery.data?.results ?? [];

  // Group by type for display
  const grouped = items.reduce<Record<string, TrashItem[]>>((acc, item) => {
    const key = item.trash_item_type;
    (acc[key] ??= []).push(item);
    return acc;
  }, {});

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const restoreMutation = useMutation({
    mutationFn: (item: TrashItem) =>
      apiCall((c) =>
        restoreTrashItem(c, {
          trash_item_type: item.trash_item_type,
          trash_item_id: item.trash_item_id,
          parent_trash_item_id: item.parent_trash_item_id ?? undefined,
          parent_trash_item_type: item.parent_trash_item_type ?? undefined,
        }),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trash", effectiveWsId] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (e) => Alert.alert("Error", e instanceof Error ? e.message : "Could not restore item."),
  });

  const emptyMutation = useMutation({
    mutationFn: () => apiCall((c) => emptyWorkspaceTrash(c, effectiveWsId!)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trash", effectiveWsId] }),
    onError: (e) => Alert.alert("Error", e instanceof Error ? e.message : "Could not empty trash."),
  });

  function confirmRestore(item: TrashItem) {
    Alert.alert(`Restore "${item.name}"?`, "It will be moved back to its original location.", [
      { text: "Cancel", style: "cancel" },
      { text: "Restore", onPress: () => restoreMutation.mutate(item) },
    ]);
  }

  function confirmEmptyTrash() {
    Alert.alert(
      "Empty trash?",
      `All ${items.length} item${items.length !== 1 ? "s" : ""} in ${effectiveWsName}'s trash will be permanently deleted. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Empty trash", style: "destructive", onPress: () => emptyMutation.mutate() },
      ],
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[ts.root, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Trash",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8} style={{ paddingHorizontal: 4 }}>
              <Feather name="arrow-left" size={20} color={colors.foreground} />
            </Pressable>
          ),
        }}
      />

      {/* Workspace picker bar */}
      <View style={[ts.wsBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable
          style={[ts.wsPicker, { borderColor: colors.border, borderRadius: colors.radius }]}
          onPress={() => setShowWsPicker((v) => !v)}
          testID="workspace-picker"
        >
          <Feather name="folder" size={14} color={colors.mutedForeground} />
          <Text style={[ts.wsPickerText, { color: colors.text }]} numberOfLines={1}>
            {effectiveWsName}
          </Text>
          <Feather name={showWsPicker ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} />
        </Pressable>

        {items.length > 0 && (
          <Pressable
            style={[ts.emptyBtn, { borderColor: colors.destructive + "50" }]}
            onPress={confirmEmptyTrash}
            disabled={emptyMutation.isPending}
            testID="empty-trash-btn"
          >
            <Feather name="trash-2" size={13} color={colors.destructive} />
            <Text style={[ts.emptyBtnText, { color: colors.destructive }]}>Empty</Text>
          </Pressable>
        )}
      </View>

      {/* Workspace dropdown */}
      {showWsPicker && workspaces.length > 0 && (
        <View style={[ts.wsDropdown, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          {workspaces.map((ws) => (
            <Pressable
              key={ws.id}
              style={[
                ts.wsOption,
                { borderBottomColor: colors.border },
                ws.id === effectiveWsId && { backgroundColor: colors.primary + "12" },
              ]}
              onPress={() => {
                setSelectedWorkspaceId(ws.id);
                setShowWsPicker(false);
              }}
            >
              <Text style={[ts.wsOptionText, { color: ws.id === effectiveWsId ? colors.primary : colors.text }]}>
                {ws.name}
              </Text>
              {ws.id === effectiveWsId && <Feather name="check" size={14} color={colors.primary} />}
            </Pressable>
          ))}
        </View>
      )}

      {/* Content */}
      {trashQuery.isLoading || workspacesQuery.isLoading ? (
        <LoadingState />
      ) : trashQuery.isError ? (
        <ErrorState
          title="Could not load trash"
          message={trashQuery.error instanceof Error ? trashQuery.error.message : undefined}
          onRetry={() => trashQuery.refetch()}
        />
      ) : items.length === 0 ? (
        <View style={ts.emptyState}>
          <Feather name="check-circle" size={48} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
          <Text style={[ts.emptyTitle, { color: colors.text }]}>Trash is empty</Text>
          <Text style={[ts.emptySubtitle, { color: colors.mutedForeground }]}>
            Deleted items from {effectiveWsName} will appear here.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: bottomPad + 20 }}
          refreshControl={
            <RefreshControl
              refreshing={trashQuery.isRefetching}
              onRefresh={() => trashQuery.refetch()}
              tintColor={colors.primary}
            />
          }
          testID="trash-scroll"
        >
          <Text style={[ts.countLabel, { color: colors.mutedForeground }]}>
            {items.length} item{items.length !== 1 ? "s" : ""} in trash
          </Text>

          {Object.entries(grouped).map(([type, groupItems]) => (
            <View key={type} style={ts.group}>
              <Text style={[ts.groupTitle, { color: colors.mutedForeground }]}>
                {typeLabel(type).toUpperCase()}S
              </Text>
              <View style={[ts.groupCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
                {groupItems.map((item) => (
                  <TrashRow
                    key={item.id}
                    item={item}
                    colors={colors}
                    onRestore={confirmRestore}
                  />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ts = StyleSheet.create({
  root: { flex: 1 },
  wsBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderBottomWidth: 1,
  },
  wsPicker: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  wsPickerText: { flex: 1, fontSize: 14, fontWeight: "500" },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyBtnText: { fontSize: 13, fontWeight: "600" },
  wsDropdown: {
    position: "absolute",
    top: 64,
    left: 12,
    right: 12,
    zIndex: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  wsOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 0.5,
  },
  wsOptionText: { fontSize: 15, fontWeight: "500" },
  countLabel: { fontSize: 12, fontWeight: "500", paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
  group: { paddingHorizontal: 14, paddingTop: 8 },
  groupTitle: { fontSize: 11, fontWeight: "600", letterSpacing: 0.8, marginBottom: 6 },
  groupCard: { borderWidth: 1, overflow: "hidden" },
  trashRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderBottomWidth: 0.5 },
  typeIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  itemName: { fontSize: 14, fontWeight: "600" },
  itemMeta: { fontSize: 11, marginTop: 2 },
  restoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  restoreBtnText: { fontSize: 12, fontWeight: "600" },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
