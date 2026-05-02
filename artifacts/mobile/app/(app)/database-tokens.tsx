/**
 * DatabaseTokensScreen — manage API tokens for database access.
 *
 * Route: /database-tokens
 *
 * API endpoints used:
 *   GET    /api/database/tokens/
 *   POST   /api/database/tokens/
 *   PATCH  /api/database/tokens/{token_id}/
 *   DELETE /api/database/tokens/{token_id}/
 *   POST   /api/database/tokens/{token_id}/rotate-key/
 */

import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
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
  Clipboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";
import {
  createDatabaseToken,
  deleteDatabaseToken,
  listDatabaseTokens,
  listWorkspaces,
  rotateDatabaseTokenKey,
  updateDatabaseToken,
  type DatabaseToken,
} from "@/lib/baserow";

export default function DatabaseTokensScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const { apiCall } = useAuth();
  const queryClient = useQueryClient();

  const [isAdding, setIsAdding] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");
  const [selectedWsId, setSelectedWsId] = useState<number | null>(null);
  const [showKeyId, setShowKeyId] = useState<number | null>(null);

  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16);

  // ─── Queries ───────────────────────────────────────────────────────────────

  const tokensQuery = useQuery({
    queryKey: ["database-tokens"],
    queryFn: () => apiCall((c) => listDatabaseTokens(c)),
  });

  const workspacesQuery = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => apiCall((c) => listWorkspaces(c)),
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: () => apiCall((c) => createDatabaseToken(c, { name: newTokenName, workspace_id: selectedWsId! })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["database-tokens"] });
      setIsAdding(false);
      setNewTokenName("");
    },
    onError: (e) => Alert.alert("Error", e instanceof Error ? e.message : "Could not create token."),
  });

  const deleteMutation = useMutation({
    mutationFn: (tokenId: number) => apiCall((c) => deleteDatabaseToken(c, tokenId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["database-tokens"] }),
    onError: (e) => Alert.alert("Error", e instanceof Error ? e.message : "Could not delete token."),
  });

  const rotateMutation = useMutation({
    mutationFn: (tokenId: number) => apiCall((c) => rotateDatabaseTokenKey(c, tokenId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["database-tokens"] }),
    onError: (e) => Alert.alert("Error", e instanceof Error ? e.message : "Could not rotate key."),
  });

  // ─── Handlers ──────────────────────────────────────────────────────────────

  function copyToClipboard(key: string) {
    Clipboard.setString(key);
    Alert.alert("Copied", "Token key copied to clipboard.");
  }

  function confirmDelete(token: DatabaseToken) {
    Alert.alert(`Delete token "${token.name}"?`, "Applications using this token will lose access.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(token.id) },
    ]);
  }

  function confirmRotate(token: DatabaseToken) {
    Alert.alert("Rotate key?", "The old key will stop working immediately.", [
      { text: "Cancel", style: "cancel" },
      { text: "Rotate", style: "destructive", onPress: () => rotateMutation.mutate(token.id) },
    ]);
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const tokens = tokensQuery.data ?? [];
  const workspaces = workspacesQuery.data ?? [];

  return (
    <View style={[ts.root, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Database Tokens",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
        }}
      />

      {tokensQuery.isLoading ? (
        <LoadingState />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: bottomPad + 20 }}
          refreshControl={
            <RefreshControl
              refreshing={tokensQuery.isRefetching}
              onRefresh={() => tokensQuery.refetch()}
              tintColor={colors.primary}
            />
          }
        >
          <View style={ts.header}>
            <Text style={[ts.description, { color: colors.mutedForeground }]}>
              Manage API tokens for external access to your databases.
            </Text>
          </View>

          {/* Add Token Form */}
          {isAdding ? (
            <View style={[ts.form, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <Text style={[ts.formLabel, { color: colors.text }]}>Token Name</Text>
              <TextInput
                style={[ts.input, { color: colors.text, backgroundColor: colors.muted, borderColor: colors.border, borderRadius: colors.radius }]}
                value={newTokenName}
                onChangeText={setNewTokenName}
                placeholder="e.g. Mobile App Sync"
                placeholderTextColor={colors.mutedForeground}
              />
              <Text style={[ts.formLabel, { color: colors.text, marginTop: 8 }]}>Workspace</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                {workspaces.map((ws) => (
                  <Pressable
                    key={ws.id}
                    style={[
                      ts.wsChip,
                      { borderColor: colors.border, backgroundColor: selectedWsId === ws.id ? colors.primary : colors.muted },
                    ]}
                    onPress={() => setSelectedWsId(ws.id)}
                  >
                    <Text style={{ color: selectedWsId === ws.id ? colors.primaryForeground : colors.text }}>{ws.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={ts.formBtns}>
                <Pressable style={[ts.btn, ts.btnOutline, { borderColor: colors.border }]} onPress={() => setIsAdding(false)}>
                  <Text style={[ts.btnText, { color: colors.mutedForeground }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[ts.btn, { backgroundColor: colors.primary }]}
                  onPress={() => createMutation.mutate()}
                  disabled={!newTokenName.trim() || !selectedWsId || createMutation.isPending}
                >
                  <Text style={[ts.btnText, { color: colors.primaryForeground }]}>Create Token</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              style={[ts.addBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
              onPress={() => { setIsAdding(true); if (workspaces[0]) setSelectedWsId(workspaces[0].id); }}
            >
              <Feather name="plus" size={16} color={colors.primaryForeground} />
              <Text style={[ts.addBtnText, { color: colors.primaryForeground }]}>Create new token</Text>
            </Pressable>
          )}

          {/* Tokens List */}
          <View style={ts.list}>
            {tokens.length === 0 ? (
              <View style={ts.empty}>
                <Feather name="key" size={40} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
                <Text style={{ color: colors.mutedForeground }}>No tokens created yet.</Text>
              </View>
            ) : (
              tokens.map((token) => (
                <View key={token.id} style={[ts.tokenCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
                  <View style={ts.tokenHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[ts.tokenName, { color: colors.text }]}>{token.name}</Text>
                      <Text style={[ts.tokenWs, { color: colors.mutedForeground }]}>
                        Workspace ID: {token.workspace_id}
                      </Text>
                    </View>
                    <View style={ts.tokenActions}>
                      <Pressable onPress={() => confirmRotate(token)} style={ts.iconBtn}>
                        <Feather name="rotate-cw" size={14} color={colors.mutedForeground} />
                      </Pressable>
                      <Pressable onPress={() => confirmDelete(token)} style={ts.iconBtn}>
                        <Feather name="trash-2" size={14} color={colors.destructive} />
                      </Pressable>
                    </View>
                  </View>

                  <View style={[ts.keyBox, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
                    <Text style={[ts.keyText, { color: colors.foreground }]} numberOfLines={1}>
                      {showKeyId === token.id ? token.key : "••••••••••••••••••••••••••••••••"}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <Pressable onPress={() => setShowKeyId(showKeyId === token.id ? null : token.id)}>
                        <Feather name={showKeyId === token.id ? "eye-off" : "eye"} size={16} color={colors.primary} />
                      </Pressable>
                      <Pressable onPress={() => copyToClipboard(token.key)}>
                        <Feather name="copy" size={16} color={colors.primary} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const ts = StyleSheet.create({
  root: { flex: 1 },
  header: { padding: 20 },
  description: { fontSize: 14, lineHeight: 20 },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, margin: 20, marginTop: 0, padding: 14 },
  addBtnText: { fontSize: 15, fontWeight: "600" },
  form: { margin: 20, marginTop: 0, padding: 16, borderWidth: 1, gap: 8 },
  formLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  input: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  wsChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, marginRight: 8 },
  formBtns: { flexDirection: "row", gap: 10, justifyContent: "flex-end", marginTop: 8 },
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  btnOutline: { borderWidth: 1 },
  btnText: { fontSize: 14, fontWeight: "600" },
  list: { padding: 20, paddingTop: 0, gap: 16 },
  empty: { padding: 40, alignItems: "center", justifyContent: "center" },
  tokenCard: { padding: 16, borderWidth: 1, gap: 12 },
  tokenHeader: { flexDirection: "row", alignItems: "flex-start" },
  tokenName: { fontSize: 16, fontWeight: "700" },
  tokenWs: { fontSize: 12, marginTop: 2 },
  tokenActions: { flexDirection: "row", gap: 4 },
  iconBtn: { padding: 6 },
  keyBox: { flexDirection: "row", alignItems: "center", padding: 12, gap: 12 },
  keyText: { flex: 1, fontFamily: "Courier", fontSize: 13 },
});
