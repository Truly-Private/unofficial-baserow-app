import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { JsonActionModal, type JsonAction } from "@/components/JsonActionModal";
import { LoadingState } from "@/components/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";
import {
  createDashboardWidget,
  createApplicationSnapshot,
  deleteApplication,
  getAdminDashboard,
  getApplication,
  getUserDashboard,
  deleteDashboardWidget,
  dispatchDashboardDataSource,
  duplicateApplicationAsync,
  listApplicationIntegrations,
  listApplicationSnapshots,
  listApplicationUserSources,
  listDashboardDataSources,
  listDashboardWidgets,
  updateApplication,
  updateDashboardDataSource,
  updateDashboardWidget,
  type BaserowDashboardWidget,
  type BaserowDataSource,
} from "@/lib/baserow";

function labelForWidget(widget: BaserowDashboardWidget) {
  return widget.title || widget.name as string | undefined || `${widget.type} widget`;
}

function dataSourceName(source: BaserowDataSource) {
  return source.name || `${source.type} data source #${source.id}`;
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const { apiCall } = useAuth();
  const params = useLocalSearchParams<{ id: string; name?: string }>();
  const dashboardId = Number(params.id);
  const dashboardName = params.name || "Dashboard";
  const [action, setAction] = React.useState<(JsonAction & { run: (payload: Record<string, unknown>) => void }) | null>(null);

  const widgetsQuery = useQuery({
    queryKey: ["dashboard", dashboardId, "widgets"],
    queryFn: () => apiCall((c) => listDashboardWidgets(c, dashboardId)),
  });
  const applicationQuery = useQuery({
    queryKey: ["dashboard", dashboardId, "application"],
    queryFn: () => apiCall((c) => getApplication(c, dashboardId)),
  });
  const userDashboardQuery = useQuery({
    queryKey: ["dashboard", dashboardId, "user"],
    queryFn: () => apiCall((c) => getUserDashboard(c)),
  });
  const adminDashboardQuery = useQuery({
    queryKey: ["dashboard", dashboardId, "admin"],
    queryFn: () => apiCall((c) => getAdminDashboard(c)),
  });

  const dataSourcesQuery = useQuery({
    queryKey: ["dashboard", dashboardId, "dataSources"],
    queryFn: () => apiCall((c) => listDashboardDataSources(c, dashboardId)),
  });
  const snapshotsQuery = useQuery({
    queryKey: ["dashboard", dashboardId, "snapshots"],
    queryFn: () => apiCall((c) => listApplicationSnapshots(c, dashboardId)),
  });
  const integrationsQuery = useQuery({
    queryKey: ["dashboard", dashboardId, "integrations"],
    queryFn: () => apiCall((c) => listApplicationIntegrations(c, dashboardId)),
  });
  const userSourcesQuery = useQuery({
    queryKey: ["dashboard", dashboardId, "userSources"],
    queryFn: () => apiCall((c) => listApplicationUserSources(c, dashboardId)),
  });

  const dispatchMutation = useMutation({
    mutationFn: (source: BaserowDataSource) =>
      apiCall((c) => dispatchDashboardDataSource(c, source.id)),
    onSuccess: (_, source) => {
      Alert.alert("Data source refreshed", dataSourceName(source));
    },
    onError: (error) => {
      Alert.alert(
        "Could not refresh data source",
        error instanceof Error ? error.message : "Please try again.",
      );
    },
  });

  const widgetActionMutation = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: async () => {
      setAction(null);
      await refresh();
    },
    onError: (error) => {
      Alert.alert("Dashboard action failed", error instanceof Error ? error.message : "Please try again.");
    },
  });

  const widgets = (widgetsQuery.data ?? []).slice().sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
  const dataSources = (dataSourcesQuery.data ?? []).slice().sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
  const loading = widgetsQuery.isLoading || dataSourcesQuery.isLoading || userDashboardQuery.isLoading || adminDashboardQuery.isLoading || applicationQuery.isLoading || snapshotsQuery.isLoading || integrationsQuery.isLoading || userSourcesQuery.isLoading;
  const errored = widgetsQuery.isError || dataSourcesQuery.isError || userDashboardQuery.isError || adminDashboardQuery.isError || applicationQuery.isError || snapshotsQuery.isError || integrationsQuery.isError || userSourcesQuery.isError;
  const error = (widgetsQuery.error as Error | null) ?? (dataSourcesQuery.error as Error | null) ?? (userDashboardQuery.error as Error | null) ?? (adminDashboardQuery.error as Error | null) ?? (applicationQuery.error as Error | null) ?? (snapshotsQuery.error as Error | null) ?? (integrationsQuery.error as Error | null) ?? (userSourcesQuery.error as Error | null);
  const refreshing = widgetsQuery.isRefetching || dataSourcesQuery.isRefetching || userDashboardQuery.isRefetching || adminDashboardQuery.isRefetching || applicationQuery.isRefetching || snapshotsQuery.isRefetching || integrationsQuery.isRefetching || userSourcesQuery.isRefetching;
  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16) + 24;

  const refresh = async () => {
    await Promise.all([
      widgetsQuery.refetch(),
      dataSourcesQuery.refetch(),
      userDashboardQuery.refetch(),
      adminDashboardQuery.refetch(),
      applicationQuery.refetch(),
      snapshotsQuery.refetch(),
      integrationsQuery.refetch(),
      userSourcesQuery.refetch(),
    ]);
  };

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: dashboardName }} />
      {loading ? (
        <LoadingState />
      ) : errored ? (
        <ErrorState
          title="Could not load dashboard"
          message={error?.message}
          onRetry={() => void refresh()}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: bottomPad, paddingTop: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.primary} />}
        >
          <View style={styles.headerWrap}>
            <Text style={[styles.crumb, { color: colors.mutedForeground }]}>Dashboard</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>{dashboardName}</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {widgets.length} widgets · {dataSources.length} data sources
            </Text>
            <View style={styles.buttonRow}>
              <Button
                title="Create widget JSON"
                variant="secondary"
                onPress={() =>
                  setAction({
                    title: "Create dashboard widget",
                    description: "Enter the exact widget payload Baserow expects for this widget type. This exposes the desktop API while payload discovery continues.",
                    initialJson: '{\\n  \"type\": \"summary\",\\n  \"title\": \"New widget\"\\n}',
                    submitLabel: "Create",
                    requiresJson: true,
                    run: (payload) =>
                      widgetActionMutation.mutate(() =>
                        apiCall((c) => createDashboardWidget(c, dashboardId, payload)),
                      ),
                  })
                }
              />
            </View>
          </View>

          <Section title="Application" icon="box">
            <Card>
              <Text style={[styles.itemTitle, { color: colors.foreground }]}>
                {applicationQuery.data?.name || dashboardName}
              </Text>
              <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>
                Type: {applicationQuery.data?.type || "dashboard"}
              </Text>
              <View style={styles.actionRow}>
                <Pill
                  label="Rename JSON"
                  onPress={() =>
                    setAction({
                      title: "Rename application",
                      description: "Patch the application with a JSON object.",
                      initialJson: JSON.stringify(
                        { name: applicationQuery.data?.name || dashboardName },
                        null,
                        2,
                      ),
                      submitLabel: "Update",
                      run: (payload) =>
                        widgetActionMutation.mutate(() =>
                          apiCall((c) => updateApplication(c, dashboardId, payload)),
                        ),
                    })
                  }
                />
                <Pill
                  label="Duplicate"
                  onPress={() =>
                    widgetActionMutation.mutate(() =>
                      apiCall((c) => duplicateApplicationAsync(c, dashboardId)),
                    )
                  }
                />
                <Pill
                  label="Snapshot"
                  onPress={() =>
                    widgetActionMutation.mutate(() =>
                      apiCall((c) => createApplicationSnapshot(c, dashboardId)),
                    )
                  }
                />
                <Pill
                  label="Delete"
                  destructive
                  onPress={() =>
                    setAction({
                      title: "Delete application",
                      description: "Submit {} to confirm.",
                      initialJson: "{}",
                      submitLabel: "Delete",
                      destructive: true,
                      run: () =>
                        widgetActionMutation.mutate(() =>
                          apiCall((c) => deleteApplication(c, dashboardId)),
                        ),
                    })
                  }
                />
              </View>
            </Card>
          </Section>

          <Section title="Widgets" icon="grid">
            {widgets.length === 0 ? (
              <EmptyState icon="grid" title="No widgets yet" description="Dashboard widgets will appear here once they are added from desktop or the mobile editor." />
            ) : (
              widgets.map((widget) => (
                <Card key={widget.id}>
                  <View style={styles.rowTop}>
                    <View style={styles.iconWrap}><Feather name="bar-chart-2" size={16} color={colors.mutedForeground} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemTitle, { color: colors.foreground }]}>{labelForWidget(widget)}</Text>
                      <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>Type: {widget.type}</Text>
                    </View>
                  </View>
                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={() =>
                        setAction({
                          title: "Update widget",
                          description: "Patch this dashboard widget with a JSON object.",
                          initialJson: JSON.stringify({ title: labelForWidget(widget), ...widget }, null, 2),
                          submitLabel: "Update",
                          run: (payload) =>
                            widgetActionMutation.mutate(() =>
                              apiCall((c) => updateDashboardWidget(c, widget.id, payload)),
                            ),
                        })
                      }
                      style={[styles.pill, { backgroundColor: colors.secondary }]}
                    >
                      <Text style={[styles.pillText, { color: colors.primary }]}>Edit JSON</Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        setAction({
                          title: "Delete widget",
                          description: `Delete “${labelForWidget(widget)}”. Submit {} to confirm.`,
                          initialJson: "{}",
                          submitLabel: "Delete",
                          destructive: true,
                          run: () =>
                            widgetActionMutation.mutate(() =>
                              apiCall((c) => deleteDashboardWidget(c, widget.id)),
                            ),
                        })
                      }
                      style={[styles.pill, { backgroundColor: colors.destructive }]}
                    >
                      <Text style={[styles.pillText, { color: colors.destructiveForeground }]}>Delete</Text>
                    </Pressable>
                  </View>
                  <Text style={[styles.jsonPreview, { color: colors.mutedForeground }]} numberOfLines={4}>{JSON.stringify(widget, null, 2)}</Text>
                </Card>
              ))
            )}
          </Section>

          <Section title="Data sources" icon="refresh-cw">
            {dataSources.length === 0 ? (
              <EmptyState icon="database" title="No data sources" description="Add data sources on desktop, then refresh and inspect them here." />
            ) : (
              dataSources.map((source) => (
                <Card key={source.id}>
                  <View style={styles.rowTop}>
                    <View style={styles.iconWrap}><Feather name="database" size={16} color={colors.mutedForeground} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemTitle, { color: colors.foreground }]}>{dataSourceName(source)}</Text>
                      <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>Type: {source.type}</Text>
                    </View>
                    <Pressable
                      onPress={() => dispatchMutation.mutate(source)}
                      style={({ pressed }) => [styles.smallButton, { backgroundColor: colors.primary, opacity: pressed || dispatchMutation.isPending ? 0.75 : 1 }]}
                    >
                      <Text style={[styles.smallButtonText, { color: colors.primaryForeground }]}>Refresh</Text>
                    </Pressable>
                  </View>
                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={() =>
                        setAction({
                          title: "Update dashboard data source",
                          description: "Patch this dashboard data source with a JSON object.",
                          initialJson: JSON.stringify(source, null, 2),
                          submitLabel: "Update",
                          run: (payload) =>
                            widgetActionMutation.mutate(() =>
                              apiCall((c) => updateDashboardDataSource(c, source.id, payload)),
                            ),
                        })
                      }
                      style={[styles.pill, { backgroundColor: colors.secondary }]}
                    >
                      <Text style={[styles.pillText, { color: colors.primary }]}>Edit JSON</Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        setAction({
                          title: "Dispatch data source with payload",
                          description: "Run this dashboard data source with an optional JSON payload.",
                          initialJson: "{}",
                          submitLabel: "Dispatch",
                          run: (payload) =>
                            widgetActionMutation.mutate(() =>
                              apiCall((c) => dispatchDashboardDataSource(c, source.id, payload)),
                            ),
                        })
                      }
                      style={[styles.pill, { backgroundColor: colors.secondary }]}
                    >
                      <Text style={[styles.pillText, { color: colors.primary }]}>Dispatch JSON</Text>
                    </Pressable>
                  </View>
                </Card>
              ))
            )}
          </Section>

          <Section title="Dashboard endpoints" icon="monitor">
            <Card>
              <Text style={[styles.itemTitle, { color: colors.foreground }]}>/api/user/dashboard/</Text>
              <Text style={[styles.jsonPreview, { color: colors.mutedForeground }]} numberOfLines={5}>
                {JSON.stringify(userDashboardQuery.data ?? {}, null, 2)}
              </Text>
            </Card>
            <Card>
              <Text style={[styles.itemTitle, { color: colors.foreground }]}>/api/admin/dashboard/</Text>
              <Text style={[styles.jsonPreview, { color: colors.mutedForeground }]} numberOfLines={5}>
                {JSON.stringify(adminDashboardQuery.data ?? {}, null, 2)}
              </Text>
            </Card>
          </Section>

          <Section title="Application metadata" icon="hash">
            <Card>
              <Text style={[styles.itemTitle, { color: colors.foreground }]}>Snapshots</Text>
              <Text style={[styles.jsonPreview, { color: colors.mutedForeground }]} numberOfLines={5}>
                {JSON.stringify(snapshotsQuery.data ?? {}, null, 2)}
              </Text>
            </Card>
            <Card>
              <Text style={[styles.itemTitle, { color: colors.foreground }]}>Integrations</Text>
              <Text style={[styles.jsonPreview, { color: colors.mutedForeground }]} numberOfLines={5}>
                {JSON.stringify(integrationsQuery.data ?? {}, null, 2)}
              </Text>
            </Card>
            <Card>
              <Text style={[styles.itemTitle, { color: colors.foreground }]}>User sources</Text>
              <Text style={[styles.jsonPreview, { color: colors.mutedForeground }]} numberOfLines={5}>
                {JSON.stringify(userSourcesQuery.data ?? {}, null, 2)}
              </Text>
            </Card>
          </Section>
        </ScrollView>
      )}
      <JsonActionModal
        action={action}
        loading={widgetActionMutation.isPending}
        onClose={() => setAction(null)}
        onSubmit={(payload) => action?.run(payload)}
      />
    </View>
  );
}

function Section({ title, icon, children }: { title: string; icon: keyof typeof Feather.glyphMap; children: React.ReactNode }) {
  const colors = useColors();
  return <View style={styles.section}><View style={styles.sectionHeader}><Feather name={icon} size={16} color={colors.mutedForeground} /><Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text></View>{children}</View>;
}

function Card({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>{children}</View>;
}

function Pill({
  label,
  onPress,
  destructive,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pill,
        {
          backgroundColor: destructive ? colors.destructive : colors.secondary,
        },
      ]}
    >
      <Text
        style={[
          styles.pillText,
          { color: destructive ? colors.destructiveForeground : colors.primary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  headerWrap: { paddingHorizontal: 20, paddingBottom: 8 },
  crumb: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 4 },
  title: { fontSize: 30, lineHeight: 36, fontFamily: "Inter_700Bold" },
  subtitle: { marginTop: 6, fontSize: 14, fontFamily: "Inter_400Regular" },
  buttonRow: { marginTop: 16, alignItems: "flex-start" },
  section: { paddingHorizontal: 16, paddingTop: 18, gap: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 0.7, textTransform: "uppercase" },
  card: { borderWidth: 1, padding: 14, marginBottom: 10 },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  itemTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  itemMeta: { marginTop: 3, fontSize: 13, fontFamily: "Inter_400Regular" },
  jsonPreview: { marginTop: 12, fontSize: 11, fontFamily: "Inter_400Regular" },
  smallButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  smallButtonText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  pill: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 },
  pillText: { fontSize: 12, fontFamily: "Inter_700Bold" },
});
