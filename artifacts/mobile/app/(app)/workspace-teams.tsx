/**
 * WorkspaceTeamsScreen — manage teams within a workspace.
 *
 * Route: /workspace-teams?workspaceId=&workspaceName=
 *
 * API endpoints used:
 *   GET    /api/teams/workspace/{workspace_id}/
 *   POST   /api/teams/workspace/{workspace_id}/
 *   PATCH  /api/teams/{team_id}/
 *   DELETE /api/teams/{team_id}/
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
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";
import {
  createTeam,
  deleteTeam,
  listTeams,
  updateTeam,
  type BaserowTeam,
} from "@/lib/baserow";

export default function WorkspaceTeamsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const { apiCall } = useAuth();
  const queryClient = useQueryClient();

  const params = useLocalSearchParams<{ workspaceId: string; workspaceName?: string }>();
  const workspaceId = Number(params.workspaceId);
  const workspaceName = params.workspaceName ?? "Workspace";

  const [isAdding, setIsAdding] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [editingTeam, setEditingTeam] = useState<BaserowTeam | null>(null);
  const [editName, setEditName] = useState("");

  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16);

  // ─── Queries ───────────────────────────────────────────────────────────────

  const teamsQuery = useQuery({
    queryKey: ["workspace-teams", workspaceId],
    queryFn: () => apiCall((c) => listTeams(c, workspaceId)),
    enabled: Number.isFinite(workspaceId),
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: () => apiCall((c) => createTeam(c, workspaceId, { name: newTeamName })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-teams", workspaceId] });
      setIsAdding(false);
      setNewTeamName("");
    },
    onError: (e) => Alert.alert("Error", e instanceof Error ? e.message : "Could not create team."),
  });

  const updateMutation = useMutation({
    mutationFn: (teamId: number) => apiCall((c) => updateTeam(c, teamId, { name: editName })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-teams", workspaceId] });
      setEditingTeam(null);
    },
    onError: (e) => Alert.alert("Error", e instanceof Error ? e.message : "Could not update team."),
  });

  const deleteMutation = useMutation({
    mutationFn: (teamId: number) => apiCall((c) => deleteTeam(c, teamId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace-teams", workspaceId] }),
    onError: (e) => Alert.alert("Error", e instanceof Error ? e.message : "Could not delete team."),
  });

  // ─── Handlers ──────────────────────────────────────────────────────────────

  function confirmDelete(team: BaserowTeam) {
    Alert.alert(`Delete team "${team.name}"?`, "This will remove the team and its access permissions.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(team.id) },
    ]);
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const teams = teamsQuery.data ?? [];

  return (
    <View style={[ts.root, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Teams",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8} style={{ paddingHorizontal: 4 }}>
              <Feather name="arrow-left" size={20} color={colors.foreground} />
            </Pressable>
          ),
        }}
      />

      {teamsQuery.isLoading ? (
        <LoadingState />
      ) : teamsQuery.isError ? (
        <ErrorState title="Could not load teams" onRetry={() => teamsQuery.refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: bottomPad + 80 }}
          refreshControl={
            <RefreshControl
              refreshing={teamsQuery.isRefetching}
              onRefresh={() => teamsQuery.refetch()}
              tintColor={colors.primary}
            />
          }
        >
          <View style={ts.header}>
            <Text style={[ts.subtitle, { color: colors.mutedForeground }]}>
              {workspaceName}
            </Text>
            <Text style={[ts.title, { color: colors.text }]}>Teams</Text>
          </View>

          {/* Add Team Form */}
          {isAdding ? (
            <View style={[ts.form, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <TextInput
                style={[ts.input, { color: colors.text, backgroundColor: colors.muted, borderColor: colors.border, borderRadius: colors.radius }]}
                value={newTeamName}
                onChangeText={setNewTeamName}
                placeholder="Team name"
                placeholderTextColor={colors.mutedForeground}
                autoFocus
              />
              <View style={ts.formBtns}>
                <Pressable style={[ts.btn, ts.btnOutline, { borderColor: colors.border }]} onPress={() => setIsAdding(false)}>
                  <Text style={[ts.btnText, { color: colors.mutedForeground }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[ts.btn, { backgroundColor: colors.primary }]}
                  onPress={() => createMutation.mutate()}
                  disabled={!newTeamName.trim() || createMutation.isPending}
                >
                  <Text style={[ts.btnText, { color: colors.primaryForeground }]}>Create Team</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              style={[ts.addBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
              onPress={() => setIsAdding(true)}
            >
              <Feather name="plus" size={16} color={colors.primaryForeground} />
              <Text style={[ts.addBtnText, { color: colors.primaryForeground }]}>Create new team</Text>
            </Pressable>
          )}

          {/* Teams List */}
          <View style={[ts.list, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            {teams.length === 0 ? (
              <View style={ts.empty}>
                <Text style={{ color: colors.mutedForeground }}>No teams found.</Text>
              </View>
            ) : (
              teams.map((team) => (
                <View key={team.id} style={[ts.row, { borderBottomColor: colors.border }]}>
                  {editingTeam?.id === team.id ? (
                    <View style={{ flex: 1, gap: 8 }}>
                      <TextInput
                        style={[ts.input, { color: colors.text, backgroundColor: colors.muted, borderColor: colors.border, borderRadius: colors.radius }]}
                        value={editName}
                        onChangeText={setEditName}
                        autoFocus
                      />
                      <View style={ts.formBtns}>
                        <Pressable onPress={() => setEditingTeam(null)}>
                          <Text style={{ color: colors.mutedForeground }}>Cancel</Text>
                        </Pressable>
                        <Pressable onPress={() => updateMutation.mutate(team.id)}>
                          <Text style={{ color: colors.primary, fontWeight: "600" }}>Save</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <>
                      <View style={[ts.icon, { backgroundColor: colors.muted }]}>
                        <Feather name="users" size={14} color={colors.primary} />
                      </View>
                      <Pressable
                        onPress={() =>
                          router.push({
                            pathname: "/(app)/team/[id]/subjects",
                            params: { id: String(team.id), teamName: team.name },
                          })
                        }
                        style={{ flex: 1 }}
                      >
                        <Text style={[ts.teamName, { color: colors.text }]}>{team.name}</Text>
                        <Text style={[ts.teamMeta, { color: colors.mutedForeground }]}>
                          {team.subject_count} subject{team.subject_count !== 1 ? "s" : ""}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => { setEditingTeam(team); setEditName(team.name); }}
                        hitSlop={8}
                        style={{ padding: 4 }}
                      >
                        <Feather name="edit-2" size={14} color={colors.mutedForeground} />
                      </Pressable>
                      <Pressable
                        onPress={() => confirmDelete(team)}
                        hitSlop={8}
                        style={{ padding: 4 }}
                      >
                        <Feather name="trash-2" size={14} color={colors.destructive} />
                      </Pressable>
                    </>
                  )}
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
  header: { padding: 20, paddingTop: 10 },
  subtitle: { fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  title: { fontSize: 24, fontWeight: "700" },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, margin: 20, marginTop: 0, padding: 14 },
  addBtnText: { fontSize: 15, fontWeight: "600" },
  form: { margin: 20, marginTop: 0, padding: 16, borderWidth: 1, gap: 12 },
  input: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  formBtns: { flexDirection: "row", gap: 10, justifyContent: "flex-end" },
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  btnOutline: { borderWidth: 1 },
  btnText: { fontSize: 14, fontWeight: "600" },
  list: { margin: 20, marginTop: 0, borderWidth: 1, overflow: "hidden" },
  empty: { padding: 40, alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderBottomWidth: 0.5 },
  icon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  teamName: { fontSize: 15, fontWeight: "600" },
  teamMeta: { fontSize: 12, marginTop: 2 },
});
