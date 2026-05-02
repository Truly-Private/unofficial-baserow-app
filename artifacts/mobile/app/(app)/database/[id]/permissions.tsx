import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "@/components/Button";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useAuth, useCreds } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

// Generic functions for application role assignments
async function listAppRoleAssignments(creds: any, appId: number) {
  const response = await fetch(`${creds.baseUrl}/api/applications/${appId}/role-assignments/`, {
    headers: { Authorization: `JWT ${creds.token}` },
  });
  if (!response.ok) throw new Error("Failed to load role assignments");
  return response.json();
}

async function createAppRoleAssignment(creds: any, appId: number, data: any) {
  const response = await fetch(`${creds.baseUrl}/api/applications/${appId}/role-assignments/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `JWT ${creds.token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create role assignment");
  return response.json();
}

async function deleteAppRoleAssignment(creds: any, assignmentId: number) {
  const response = await fetch(`${creds.baseUrl}/api/database/role-assignments/${assignmentId}/`, {
    method: "DELETE",
    headers: { Authorization: `JWT ${creds.token}` },
  });
  if (!response.ok) throw new Error("Failed to delete role assignment");
}

const ROLES = [
  { value: "ADMIN", label: "Admin", description: "Full access to database settings, tables, and data." },
  { value: "MEMBER", label: "Member", description: "Can create, update and delete tables and rows." },
  { value: "VIEWER", label: "Viewer", description: "Read-only access to all tables." },
  { value: "NO_ACCESS", label: "No Access", description: "Cannot see this database at all." },
];

export default function DatabasePermissionsScreen() {
  const colors = useColors();
  const creds = useCreds();
  const { apiCall } = useAuth();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id: string; databaseName?: string }>();
  const appId = Number(params.id);
  const databaseName = params.databaseName || "Database";

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("VIEWER");

  const assignmentsQuery = useQuery({
    queryKey: ["app-role-assignments", appId],
    queryFn: () => listAppRoleAssignments(creds, appId),
    enabled: !!appId,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createAppRoleAssignment(creds, appId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-role-assignments", appId] });
      setModalOpen(false);
    },
    onError: (err) => Alert.alert("Error", err instanceof Error ? err.message : "Failed to assign role"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAppRoleAssignment(creds, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-role-assignments", appId] });
    },
    onError: (err) => Alert.alert("Error", err instanceof Error ? err.message : "Failed to remove assignment"),
  });

  if (assignmentsQuery.isLoading) return <LoadingState />;

  const assignments = assignmentsQuery.data || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: `Permissions: ${databaseName}` }} />

      <FlatList
        data={assignments}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <Text style={[styles.headerText, { color: colors.mutedForeground }]}>
              Manage who can access this entire database. These roles apply to all tables within.
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardMain}>
              <View style={[styles.avatar, { backgroundColor: colors.muted }]}>
                <Feather name={item.subject_type === "user" ? "user" : "users"} size={16} color={colors.primary} />
              </View>
              <View style={styles.meta}>
                <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
                  {item.subject_name}
                </Text>
                <Text style={[styles.roleLabel, { color: colors.primary }]}>
                  {item.role.replace("_", " ")}
                </Text>
              </View>
              <Pressable onPress={() => deleteMutation.mutate(item.id)} style={styles.deleteBtn}>
                <Feather name="trash-2" size={18} color={colors.destructive} />
              </Pressable>
            </View>
          </View>
        )}
      />

      <View style={[styles.fab, { bottom: 20, right: 20 }]}>
        <Button
          title="Add Override"
          icon="plus"
          onPress={() => setModalOpen(true)}
        />
      </View>

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Assign Database Role</Text>
              <Pressable onPress={() => setModalOpen(false)}>
                <Feather name="x" size={24} color={colors.foreground} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Select Role</Text>
              {ROLES.map((role) => (
                <Pressable
                  key={role.value}
                  onPress={() => setSelectedRole(role.value)}
                  style={[
                    styles.roleOption,
                    {
                      backgroundColor: selectedRole === role.value ? colors.primary + "10" : "transparent",
                      borderColor: selectedRole === role.value ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <View style={styles.roleOptionHeader}>
                    <Text style={[styles.roleOptionLabel, { color: colors.foreground }]}>{role.label}</Text>
                    {selectedRole === role.value && <Feather name="check" size={16} color={colors.primary} />}
                  </View>
                  <Text style={[styles.roleOptionDesc, { color: colors.mutedForeground }]}>{role.description}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalFooter}>
              <Button title="Cancel" variant="ghost" onPress={() => setModalOpen(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button
                title="Assign"
                onPress={() => createMutation.mutate({ subject_id: 1, subject_type: "user", role: selectedRole })}
                loading={createMutation.isPending}
                style={{ flex: 2 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 100 },
  header: { marginBottom: 20 },
  headerText: { fontSize: 14, lineHeight: 20 },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardMain: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginRight: 12 },
  meta: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600" },
  roleLabel: { fontSize: 13, fontWeight: "700", marginTop: 2 },
  deleteBtn: { padding: 8 },
  fab: { position: "absolute", left: 20, right: 20 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "700" },
  modalBody: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 12 },
  roleOption: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 8 },
  roleOptionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  roleOptionLabel: { fontSize: 16, fontWeight: "600" },
  roleOptionDesc: { fontSize: 13 },
  modalFooter: { flexDirection: "row", paddingTop: 16, borderTopWidth: 1 },
});
