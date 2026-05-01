import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { Endpoints } from "../api/endpoints";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";

type Props = { workspaceId: number; onBack?: () => void };

export const TeamsScreen: React.FC<Props> = ({ workspaceId, onBack }) => {
  const { apiCall } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"teams" | "roles">("teams");
  const [newTeamName, setNewTeamName] = useState("");

  // Fetch teams
  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ["teams", workspaceId],
    queryFn: () => apiCall((c) => c.get(Endpoints.teams.list(workspaceId))),
  });

  // Create team
  const createTeamMut = useMutation({
    mutationFn: (name: string) => apiCall((c) => c.post(Endpoints.teams.create(workspaceId), { name })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["teams", workspaceId] }); setNewTeamName(""); },
  });

  // Delete team
  const deleteTeamMut = useMutation({
    mutationFn: (id: number) => apiCall((c) => c.delete(Endpoints.teams.delete(id))),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["teams", workspaceId] }); },
  });

  // Fetch roles
  const { data: roles } = useQuery({
    queryKey: ["roles", workspaceId],
    queryFn: () => apiCall((c) => c.get(Endpoints.roles.list(workspaceId))),
  });

  // Assign role (userId + roleId)
  const [assignUserId, setAssignUserId] = useState("");
  const [assignRoleId, setAssignRoleId] = useState("");
  const assignRoleMut = useMutation({
    mutationFn: () => apiCall((c) => c.post(Endpoints.roles.assign(workspaceId), { user_id: Number(assignUserId), role_id: Number(assignRoleId) })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["roles", workspaceId] }); setAssignUserId(""); setAssignRoleId(""); Alert.alert("Role Assigned", "User role updated."); },
    onError: (e: any) => Alert.alert("Error", e?.message || "Failed to assign role."),
  });

  const teamList = Array.isArray(teams) ? teams : teams?.results || [];
  const roleList = Array.isArray(roles) ? roles : roles?.results || [];

  return (
    <View style={s.container}>
      <TouchableOpacity onPress={onBack}><Text style={s.backText}>← Back</Text></TouchableOpacity>
      <Text style={s.title}>Teams & Roles</Text>

      {/* Tab switcher */}
      <View style={s.tabs}>
        {(["teams", "roles"] as const).map((t) => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "teams" ? (
        <>
          {/* Create team */}
          <View style={s.form}>
            <TextInput style={s.input} placeholder="New team name" value={newTeamName} onChangeText={setNewTeamName} />
            <TouchableOpacity style={[s.btn, createTeamMut.isPending && s.disabled]} onPress={() => createTeamMut.mutate(newTeamName)} disabled={createTeamMut.isPending}>
              {createTeamMut.isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create Team</Text>}
            </TouchableOpacity>
          </View>

          {/* Team list */}
          {teamsLoading ? <ActivityIndicator size="large" style={s.loader} /> : (
            <FlatList
              data={teamList}
              keyExtractor={(item: any) => String(item.id)}
              renderItem={({ item }: { item: any }) => (
                <View style={s.item}>
                  <View style={s.info}>
                    <Text style={s.itemName}>{item.name}</Text>
                    <Text style={s.meta}>{item.member_count ?? 0} members</Text>
                  </View>
                  <TouchableOpacity onPress={() => Alert.alert("Delete Team", `Delete team "${item.name}"?`, [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => deleteTeamMut.mutate(item.id) },
                  ])}>
                    <Text style={s.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={<Text style={s.empty}>No teams. Create one above!</Text>}
            />
          )}
        </>
      ) : (
        <>
          {/* Assign role */}
          <View style={s.form}>
            <Text style={s.sectionTitle}>Assign Role</Text>
            <TextInput style={s.input} placeholder="User ID" value={assignUserId} onChangeText={setAssignUserId} keyboardType="number-pad" />
            <TextInput style={s.input} placeholder="Role ID" value={assignRoleId} onChangeText={setAssignRoleId} keyboardType="number-pad" />
            <TouchableOpacity style={[s.btn, assignRoleMut.isPending && s.disabled]} onPress={() => assignRoleMut.mutate()} disabled={assignRoleMut.isPending}>
              {assignRoleMut.isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Assign Role</Text>}
            </TouchableOpacity>
          </View>

          {/* Role list */}
          <FlatList
            data={roleList}
            keyExtractor={(item: any) => String(item.id)}
            renderItem={({ item }: { item: any }) => (
              <View style={s.item}>
                <View style={s.info}>
                  <Text style={s.itemName}>{item.name || `Role #${item.id}`}</Text>
                  <Text style={s.meta}>{item.permissions?.length ? item.permissions.join(", ") : "No extra permissions"}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={s.empty}>No custom roles found.</Text>}
          />
        </>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  backText: { color: "#007AFF", fontSize: 16, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "600", marginBottom: 12 },
  tabs: { flexDirection: "row", marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: "#007AFF" },
  tabText: { color: "#666", fontSize: 15 },
  tabTextActive: { color: "#007AFF", fontWeight: "600" },
  form: { padding: 12, backgroundColor: "#f5f5f5", borderRadius: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "600", marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 6, padding: 10, fontSize: 15, marginBottom: 8 },
  btn: { backgroundColor: "#007AFF", padding: 12, borderRadius: 6, alignItems: "center" },
  disabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  loader: { marginTop: 40 },
  item: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  info: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: "500" },
  meta: { fontSize: 12, color: "#666", marginTop: 2 },
  deleteText: { color: "#ff3b30", fontSize: 14 },
  empty: { textAlign: "center", color: "#999", marginTop: 20 },
});

export default TeamsScreen;