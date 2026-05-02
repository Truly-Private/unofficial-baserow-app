import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useAuth, useCreds } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import {
  listTeams,
  removeTeamSubject,
  type BaserowTeam,
} from "@/lib/baserow";

// Generic function to list team subjects (since I need to verify if it exists in baserow.ts)
async function listTeamSubjects(creds: any, teamId: number) {
  const response = await fetch(`${creds.baseUrl}/api/teams/${teamId}/subjects/`, {
    headers: { Authorization: `JWT ${creds.token}` },
  });
  if (!response.ok) throw new Error("Failed to load subjects");
  return response.json();
}

async function addTeamSubject(creds: any, teamId: number, subjectId: number, type: string) {
  const response = await fetch(`${creds.baseUrl}/api/teams/${teamId}/subjects/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `JWT ${creds.token}`,
    },
    body: JSON.stringify({ subject_id: subjectId, subject_type: type }),
  });
  if (!response.ok) throw new Error("Failed to add subject");
  return response.json();
}

export default function TeamSubjectsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const creds = useCreds();
  const { apiCall } = useAuth();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id: string; teamName?: string }>();
  const teamId = Number(params.id);
  const teamName = params.teamName || "Team";

  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const subjectsQuery = useQuery({
    queryKey: ["team-subjects", teamId],
    queryFn: () => listTeamSubjects(creds, teamId),
    enabled: !!teamId,
  });

  const removeMutation = useMutation({
    mutationFn: (subjectId: number) => apiCall((c) => removeTeamSubject(c, teamId, subjectId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-subjects", teamId] });
      queryClient.invalidateQueries({ queryKey: ["workspace-teams"] });
    },
    onError: (err) => Alert.alert("Error", err instanceof Error ? err.message : "Failed to remove subject"),
  });

  const addMutation = useMutation({
    mutationFn: ({ id, type }: { id: number; type: string }) => addTeamSubject(creds, teamId, id, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-subjects", teamId] });
      queryClient.invalidateQueries({ queryKey: ["workspace-teams"] });
      setModalOpen(false);
    },
    onError: (err) => Alert.alert("Error", err instanceof Error ? err.message : "Failed to add subject"),
  });

  const confirmRemove = (subject: any) => {
    Alert.alert("Remove Member", `Are you sure you want to remove ${subject.subject_name} from the team?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeMutation.mutate(subject.subject_id) },
    ]);
  };

  if (subjectsQuery.isLoading) return <LoadingState />;
  if (subjectsQuery.isError) {
    return (
      <ErrorState
        title="Could not load subjects"
        message={subjectsQuery.error instanceof Error ? subjectsQuery.error.message : undefined}
        onRetry={() => subjectsQuery.refetch()}
      />
    );
  }

  const subjects = subjectsQuery.data || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: `Members: ${teamName}` }} />

      <FlatList
        data={subjects}
        keyExtractor={(item) => `${item.subject_type}-${item.subject_id}`}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
        ListEmptyHeader={() => (
          <View style={styles.empty}>
            <Feather name="users" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No members in this team yet.
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.muted }]}>
              <Feather
                name={item.subject_type === "user" ? "user" : "users"}
                size={16}
                color={colors.primary}
              />
            </View>
            <View style={styles.meta}>
              <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
                {item.subject_name}
              </Text>
              <Text style={[styles.type, { color: colors.mutedForeground }]}>
                {item.subject_type === "user" ? "User" : "Team"}
              </Text>
            </View>
            <Pressable onPress={() => confirmRemove(item)} style={styles.removeBtn}>
              <Feather name="user-minus" size={18} color={colors.destructive} />
            </Pressable>
          </View>
        )}
      />

      <View style={[styles.fab, { bottom: insets.bottom + 20 }]}>
        <Button
          title="Add Member"
          icon="user-plus"
          onPress={() => setModalOpen(true)}
        />
      </View>

      <Modal
        visible={modalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Team Member</Text>
              <Pressable onPress={() => setModalOpen(false)}>
                <Feather name="x" size={24} color={colors.foreground} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                Search by email or name (Coming soon)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                value={search}
                onChangeText={setSearch}
                placeholder="Search users..."
                placeholderTextColor={colors.mutedForeground}
              />
              
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                For now, please manage team membership via the Baserow web interface. 
                Search and direct add features are being finalized.
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <Button title="Close" variant="ghost" onPress={() => setModalOpen(false)} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16 },
  empty: { alignItems: "center", marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginRight: 12 },
  meta: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600" },
  type: { fontSize: 12, marginTop: 2 },
  removeBtn: { padding: 8 },
  fab: { position: "absolute", left: 20, right: 20 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "60%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "700" },
  modalBody: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  input: { height: 48, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, fontSize: 16, marginBottom: 16 },
  infoText: { fontSize: 13, lineHeight: 18, fontStyle: "italic" },
  modalFooter: { paddingTop: 16 },
});
