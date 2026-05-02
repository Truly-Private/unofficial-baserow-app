/**
 * DashboardIndexScreen — lists all dashboards across the workspace.
 * Navigate into a dashboard or create a new one.
 * Route: /dashboard
 */

import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useAuth, useCreds } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";
import {
  createApplication,
  listApplications,
  type BaserowApplication,
  type BaserowWorkspace,
} from "@/lib/baserow";

type DashboardEntry = {
  id: number;
  name: string;
  workspace: BaserowWorkspace;
};

const APP_TYPE_DASHBOARD = "dashboard";

export default function DashboardIndexScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const creds = useCreds();
  const { apiCall } = useAuth();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ workspace?: string }>();
  const workspaceParam = params.workspace as string | undefined;

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [dashboardName, setDashboardName] = useState("My Dashboard");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);

  // List all applications, filter to dashboards
  const appsQuery = useQuery({
    queryKey: ["applications", creds.baseUrl, creds.user.id],
    queryFn: () => apiCall((c) => listApplications(c)),
  });

  const dashboards: DashboardEntry[] = (appsQuery.data ?? [])
    .filter((app): app is BaserowApplication & { workspace: BaserowWorkspace } => 
      app.type === APP_TYPE_DASHBOARD && app.workspace !== undefined
    )
    .sort((a, b) => (a.name > b.name ? 1 : -1));

  // Group dashboards by workspace
  const byWorkspace = dashboards.reduce<Record<number, { workspace: BaserowWorkspace; dashboards: DashboardEntry[] }>>((acc, app) => {
    const wsId = app.workspace?.id ?? 0;
    if (!acc[wsId]) {
      acc[wsId] = { workspace: app.workspace as BaserowWorkspace, dashboards: [] };
    }
    acc[wsId].dashboards.push(app);
    return acc;
  }, {});

  const createDashboardMutation = useMutation({
    mutationFn: ({ workspaceId, name }: { workspaceId: number; name: string }) =>
      apiCall((c) =>
        createApplication(c, workspaceId, {
          type: APP_TYPE_DASHBOARD,
          name,
        }),
      ),
    onSuccess: async (app) => {
      await queryClient.invalidateQueries({
        queryKey: ["applications", creds.baseUrl, creds.user.id],
      });
      setCreateModalOpen(false);
      setDashboardName("My Dashboard");
      router.push({
        pathname: "/(app)/dashboard/[id]",
        params: { id: String(app.id), name: app.name },
      });
    },
    onError: (err: Error) => {
      Alert.alert("Error", err.message ?? "Failed to create dashboard");
    },
  });

  const availableWorkspaces = Object.values(byWorkspace).map((g) => ({
    id: g.workspace.id,
    name: g.workspace.name,
  }));

  const handleCreate = () => {
    const firstWsId = selectedWorkspaceId ?? availableWorkspaces[0]?.id;
    if (!firstWsId) {
      Alert.alert("Error", "No workspace available");
      return;
    }
    if (!dashboardName.trim()) {
      Alert.alert("Error", "Please enter a dashboard name");
      return;
    }
    createDashboardMutation.mutate({ workspaceId: firstWsId, name: dashboardName.trim() });
  };

  const activeWorkspaces = Object.values(byWorkspace);
  const isLoading = appsQuery.isLoading;
  const isError = !!appsQuery.error;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Dashboards",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={appsQuery.isFetching && !appsQuery.isLoading}
              onRefresh={() => appsQuery.refetch()}
              tintColor={colors.primary}
            />
          }
        >
          {/* Header + Create */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Dashboards</Text>
            <Pressable
              style={[styles.createBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                if (activeWorkspaces.length === 0) {
                  Alert.alert("No Workspaces", "Create a workspace first from the home screen.");
                  return;
                }
                setSelectedWorkspaceId(activeWorkspaces[0].workspace.id);
                setCreateModalOpen(true);
              }}
              data-testid="dashboard-create-btn"
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text style={styles.createBtnText}>New Dashboard</Text>
            </Pressable>
          </View>

          {isLoading ? (
            <LoadingState />
          ) : isError ? (
            <ErrorState
              message={appsQuery.error instanceof Error ? appsQuery.error.message : "Failed to load"}
              onRetry={() => appsQuery.refetch()}
            />
          ) : dashboards.length === 0 ? (
            <EmptyState
              icon="bar-chart-2"
              title="No Dashboards"
              description="Create your first dashboard to visualize your data."
              action={
                activeWorkspaces.length > 0 ? (
                  <Button
                    title="Create Dashboard"
                    onPress={() => {
                      setSelectedWorkspaceId(activeWorkspaces[0].workspace.id);
                      setCreateModalOpen(true);
                    }}
                    data-testid="empty-create-dashboard"
                  />
                ) : undefined
              }
            />
          ) : (
            <View style={styles.list}>
              {activeWorkspaces.map(({ workspace, dashboards: wsDashboards }) => (
                <View key={workspace.id} style={styles.workspaceGroup}>
                  <View style={styles.workspaceHeader}>
                    <Feather name="grid" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.workspaceName, { color: colors.mutedForeground }]}>
                      {workspace.name}
                    </Text>
                  </View>
                  {wsDashboards.map((dashboard) => (
                    <Pressable
                      key={dashboard.id}
                      style={({ pressed }) => [
                        styles.dashboardRow,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                          borderRadius: colors.radius,
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                      onPress={() =>
                        router.push({
                          pathname: "/(app)/dashboard/[id]",
                          params: { id: String(dashboard.id), name: dashboard.name },
                        })
                      }
                      data-testid={`dashboard-row-${dashboard.id}`}
                    >
                      <View
                        style={[
                          styles.dashboardIcon,
                          { backgroundColor: colors.muted, borderColor: colors.border },
                        ]}
                      >
                        <Feather name="bar-chart-2" size={16} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.dashboardName, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {dashboard.name}
                        </Text>
                      </View>
                      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Create Modal */}
        <Modal
          visible={createModalOpen}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setCreateModalOpen(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Pressable onPress={() => setCreateModalOpen(false)} data-testid="create-modal-close">
                <Feather name="x" size={20} color={colors.text} />
              </Pressable>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Dashboard</Text>
              <View style={{ width: 20 }} />
            </View>

            <ScrollView style={{ flex: 1, padding: 16 }}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Dashboard Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                    borderRadius: colors.radius,
                  },
                ]}
                value={dashboardName}
                onChangeText={setDashboardName}
                placeholder="My Dashboard"
                placeholderTextColor={colors.mutedForeground}
                data-testid="dashboard-name-input"
              />

              {availableWorkspaces.length > 1 && (
                <>
                  <Text
                    style={[styles.label, { color: colors.mutedForeground, marginTop: 16 }]}
                  >
                    Workspace
                  </Text>
                  <View style={styles.workspacePicker}>
                    {availableWorkspaces.map((ws) => (
                      <Pressable
                        key={ws.id}
                        style={[
                          styles.workspaceChip,
                          {
                            backgroundColor:
                              selectedWorkspaceId === ws.id ? colors.primary : colors.muted,
                            borderColor: colors.border,
                            borderRadius: colors.radius,
                          },
                        ]}
                        onPress={() => setSelectedWorkspaceId(ws.id)}
                        data-testid={`workspace-chip-${ws.id}`}
                      >
                        <Text
                          style={[
                            styles.workspaceChipText,
                            {
                              color: selectedWorkspaceId === ws.id ? "#fff" : colors.text,
                            },
                          ]}
                        >
                          {ws.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              <View style={{ marginTop: 32 }}>
                <Button
                  title="Create Dashboard"
                  onPress={handleCreate}
                  loading={createDashboardMutation.isPending}
                  disabled={createDashboardMutation.isPending}
                  data-testid="create-dashboard-submit"
                />
              </View>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: "700" },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  createBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  list: { gap: 20 },
  workspaceGroup: { gap: 8 },
  workspaceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  workspaceName: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  dashboardRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    gap: 12,
  },
  dashboardIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  dashboardName: { fontSize: 15, fontWeight: "500" },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 17, fontWeight: "600" },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  workspacePicker: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  workspaceChip: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  workspaceChipText: { fontSize: 14, fontWeight: "500" },
});
