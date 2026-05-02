import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useAuth, useCreds } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import {
  deleteUserSession,
  listUserSessions,
} from "@/lib/baserow";

export default function ActiveSessionsScreen() {
  const colors = useColors();
  const creds = useCreds();
  const { apiCall } = useAuth();
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: ["user-sessions"],
    queryFn: () => apiCall((c) => listUserSessions(c)),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: number) => apiCall((c) => deleteUserSession(c, id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-sessions"] });
      Alert.alert("Success", "Session has been revoked.");
    },
    onError: (err) => Alert.alert("Error", err instanceof Error ? err.message : "Failed to revoke session"),
  });

  if (sessionsQuery.isLoading) return <LoadingState />;
  if (sessionsQuery.isError) return <ErrorState onRetry={() => sessionsQuery.refetch()} />;

  const sessions = sessionsQuery.data || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: "Active Sessions" }} />

      <FlatList
        data={sessions}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <Text style={[styles.headerText, { color: colors.mutedForeground }]}>
              These devices are currently signed in to your account. You can revoke any session to sign it out remotely.
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const isCurrent = item.id === 0; // Usually 0 or some marker for current
          return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.row}>
                <View style={[styles.iconWrap, { backgroundColor: colors.muted }]}>
                  <Feather
                    name={item.device_type === "mobile" ? "smartphone" : "monitor"}
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.meta}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.name, { color: colors.foreground }]}>
                      {item.browser || "Unknown Browser"} on {item.os || "Unknown OS"}
                    </Text>
                    {isCurrent && (
                      <View style={[styles.badge, { backgroundColor: colors.primary + "20" }]}>
                        <Text style={[styles.badgeText, { color: colors.primary }]}>Current</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.details, { color: colors.mutedForeground }]}>
                    IP: {item.ip_address} · Last active: {new Date(item.last_activity).toLocaleString()}
                  </Text>
                </View>
                {!isCurrent && (
                  <Pressable
                    onPress={() => {
                      Alert.alert("Revoke session?", "This device will be immediately signed out.", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Revoke", style: "destructive", onPress: () => revokeMutation.mutate(item.id) },
                      ]);
                    }}
                    style={styles.revokeBtn}
                  >
                    <Feather name="log-out" size={18} color={colors.destructive} />
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16 },
  header: { marginBottom: 20 },
  headerText: { fontSize: 14, lineHeight: 20 },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center" },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
  meta: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  name: { fontSize: 15, fontWeight: "600" },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  details: { fontSize: 12 },
  revokeBtn: { padding: 8 },
});
