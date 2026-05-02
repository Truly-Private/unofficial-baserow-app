import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
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
import {
  listAuditLog,
  listAuditLogUsers,
  listWorkspaces,
  type BaserowAuditLogItem,
} from "@/lib/baserow";

export default function AuditLogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const creds = useCreds();
  const { apiCall } = useAuth();

  const params = useLocalSearchParams<{ workspaceId: string }>();

  const [workspaceId, setWorkspaceId] = useState<number | undefined>(
    params.workspaceId ? parseInt(params.workspaceId) : undefined,
  );
  const [userId, setUserId] = useState<number | undefined>();
  const [actionType, setActionType] = useState<string | undefined>();

  const auditLogQuery = useQuery({
    queryKey: ["audit-log", creds.baseUrl, workspaceId, userId, actionType],
    queryFn: () =>
      apiCall((c) =>
        listAuditLog(c, {
          workspace_id: workspaceId,
          user_id: userId,
          action_type: actionType,
          limit: 100,
        }),
      ),
  });

  const workspacesQuery = useQuery({
    queryKey: ["workspaces", creds.baseUrl],
    queryFn: () => apiCall((c) => listWorkspaces(c)),
  });

  const usersQuery = useQuery({
    queryKey: ["audit-log-users", creds.baseUrl],
    queryFn: () => apiCall((c) => listAuditLogUsers(c)),
  });

  if (auditLogQuery.isLoading && !auditLogQuery.isPlaceholderData) {
    return <LoadingState />;
  }

  const logs = auditLogQuery.data?.results || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: "Audit Log" }} />

      <View style={[styles.filters, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Pressable
            onPress={() => setWorkspaceId(undefined)}
            style={[
              styles.filterPill,
              {
                backgroundColor: workspaceId === undefined ? colors.primary : colors.surface,
                borderColor: workspaceId === undefined ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={{ color: workspaceId === undefined ? colors.primaryForeground : colors.foreground }}>
              All Workspaces
            </Text>
          </Pressable>
          {(workspacesQuery.data || []).map((ws) => (
            <Pressable
              key={ws.id}
              onPress={() => setWorkspaceId(ws.id)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: workspaceId === ws.id ? colors.primary : colors.surface,
                  borderColor: workspaceId === ws.id ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={{ color: workspaceId === ws.id ? colors.primaryForeground : colors.foreground }}>
                {ws.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {auditLogQuery.isError ? (
        <ErrorState
          title="Could not load audit log"
          message={auditLogQuery.error instanceof Error ? auditLogQuery.error.message : undefined}
          onRetry={() => auditLogQuery.refetch()}
        />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 16 }]}
          ListEmptyHeader={() => (
            <View style={styles.empty}>
              <Text style={{ color: colors.mutedForeground }}>No logs found for this filter.</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={[styles.logItem, { borderBottomColor: colors.border }]}>
              <View style={styles.logHeader}>
                <View style={[styles.iconContainer, { backgroundColor: colors.muted }]}>
                  <Feather name={getIconForAction(item.action_type)} size={14} color={colors.foreground} />
                </View>
                <View style={styles.logMeta}>
                  <Text style={[styles.actionText, { color: colors.foreground }]}>
                    {formatActionType(item.action_type)}
                  </Text>
                  <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
                    {new Date(item.timestamp).toLocaleString()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.logBody}>
                <Text style={[styles.userName, { color: colors.foreground }]}>
                  {item.user_email}
                </Text>
                <Text style={[styles.contextText, { color: colors.mutedForeground }]}>
                  {item.workspace_name && `Workspace: ${item.workspace_name}`}
                  {item.application_name && ` · App: ${item.application_name}`}
                  {item.table_name && ` · Table: ${item.table_name}`}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

function getIconForAction(type: string): keyof typeof Feather.glyphMap {
  if (type.includes("create")) return "plus-circle";
  if (type.includes("update")) return "edit-2";
  if (type.includes("delete")) return "trash-2";
  if (type.includes("login")) return "log-in";
  return "activity";
}

function formatActionType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filters: {
    padding: 12,
    borderBottomWidth: 1,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  list: {
    padding: 16,
  },
  empty: {
    alignItems: "center",
    marginTop: 40,
  },
  logItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  logMeta: {
    flex: 1,
  },
  actionText: {
    fontSize: 15,
    fontWeight: "600",
  },
  timestamp: {
    fontSize: 12,
  },
  logBody: {
    marginLeft: 38,
  },
  userName: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 2,
  },
  contextText: {
    fontSize: 12,
  },
});
