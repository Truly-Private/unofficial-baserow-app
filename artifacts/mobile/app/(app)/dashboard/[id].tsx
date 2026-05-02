import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { JsonActionModal, type JsonAction } from "@/components/JsonActionModal";
import { LoadingState } from "@/components/LoadingState";
import { InsightCard, MobileRecordTable, StatusBadge, TableText, ViewModePills, type ViewModeOption } from "@/components/ViewOptions";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";
import {
  createDashboardDataSource,
  createDashboardWidget,
  createApplicationSnapshot,
  deleteApplication,
  getAdminDashboard,
  getApplication,
  getUserDashboard,
  deleteDashboardWidget,
  dispatchDashboardDataSource,
  duplicateApplicationAsync,
  listApplications,
  listDatabaseTables,
  listApplicationIntegrations,
  listApplicationSnapshots,
  listApplicationUserSources,
  listDashboardDataSources,
  listDashboardWidgets,
  updateApplication,
  updateDashboardDataSource,
  updateDashboardWidget,
  type BaserowApplication,
  type BaserowDashboardWidget,
  type BaserowDataSource,
  type BaserowTable,
} from "@/lib/baserow";

type DashboardViewMode = "canvas" | "table" | "insights";

const DASHBOARD_VIEW_MODES: ViewModeOption<DashboardViewMode>[] = [
  { id: "canvas", label: "Canvas", icon: "layout" },
  { id: "table", label: "Table", icon: "grid" },
  { id: "insights", label: "Insights", icon: "activity" },
];

function labelForWidget(widget: BaserowDashboardWidget) {
  return widget.title || widget.name as string | undefined || `${widget.type} widget`;
}

function dataSourceName(source: BaserowDataSource) {
  return source.name || `${source.type} data source #${source.id}`;
}

// Widget types confirmed from the live Baserow dashboard UI
type WidgetTypeId =
  | "summary"
  | "bar_chart"
  | "line_chart"
  | "pie_chart"
  | "doughnut_chart";

type WidgetTypeOption = {
  id: WidgetTypeId;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  description: string;
  needsSource: boolean;
};

const WIDGET_TYPES: WidgetTypeOption[] = [
  {
    id: "summary",
    label: "Summary",
    icon: "hash",
    description: "Single KPI number such as count, sum, or average.",
    needsSource: true,
  },
  {
    id: "bar_chart",
    label: "Bar chart",
    icon: "bar-chart-2",
    description: "Compare grouped values across categories. (Premium)",
    needsSource: true,
  },
  {
    id: "line_chart",
    label: "Line chart",
    icon: "trending-up",
    description: "Show a trend over time or ordered records. (Premium)",
    needsSource: true,
  },
  {
    id: "pie_chart",
    label: "Pie chart",
    icon: "pie-chart",
    description: "Show proportions of a whole. (Premium)",
    needsSource: true,
  },
  {
    id: "doughnut_chart",
    label: "Doughnut chart",
    icon: "circle",
    description: "Show proportions with a compact KPI-style center. (Premium)",
    needsSource: true,
  },
];

const WIDGET_TYPE_BY_ID = new Map(WIDGET_TYPES.map((type) => [type.id, type]));

function widgetTypeOption(type?: string) {
  return WIDGET_TYPE_BY_ID.get(type as WidgetTypeId) ?? WIDGET_TYPES[0];
}

function widgetNeedsSource(type: string) {
  return widgetTypeOption(type).needsSource;
}

function textValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown, fallback: string) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : fallback;
}

function firstPresent(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== "") {
      return record[key];
    }
  }
  return undefined;
}

function displayValue(value: unknown) {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) return `${value.length} items`;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

type WidgetFormMode = "create" | "edit";

type WidgetFormState = {
  type: WidgetTypeId;
  title: string;
  description: string;
  dataSourceId: string; // existing dashboard data source
  tableId: string;      // workspace table to create a new data source from
  row: string;
  col: string;
  width: string;
  height: string;
  aggregationType: string;
  fieldName: string;
  groupBy: string;
  displayFields: string;
  text: string;
  linkUrl: string;
};

function blankWidgetForm(nextOrder: number, dataSources: BaserowDataSource[]): WidgetFormState {
  return {
    type: "summary",
    title: "",
    description: "",
    dataSourceId: dataSources[0]?.id ? String(dataSources[0].id) : "",
    tableId: "",
    row: String(nextOrder),
    col: "0",
    width: "4",
    height: "3",
    aggregationType: "count",
    fieldName: "",
    groupBy: "",
    displayFields: "",
    text: "",
    linkUrl: "",
  };
}

function formFromWidget(widget: BaserowDashboardWidget, dataSources: BaserowDataSource[]): WidgetFormState {
  const type = WIDGET_TYPE_BY_ID.has(widget.type as WidgetTypeId) ? (widget.type as WidgetTypeId) : "summary";
  const rawSourceId = widget.data_source_id ?? widget.data_source?.id ?? dataSources[0]?.id ?? "";
  return {
    type,
    title: labelForWidget(widget),
    description: textValue(widget.description),
    dataSourceId: String(rawSourceId || ""),
    tableId: "",
    row: numberValue(widget.row, "0"),
    col: numberValue(widget.col, "0"),
    width: numberValue(widget.width, "4"),
    height: numberValue(widget.height, "3"),
    aggregationType: textValue(firstPresent(widget, ["aggregation_type", "aggregation", "summary_type"])) || "count",
    fieldName: textValue(firstPresent(widget, ["field_name", "field", "value_field"])),
    groupBy: textValue(firstPresent(widget, ["group_by", "group_field", "category_field"])),
    displayFields: Array.isArray(widget.display_fields) ? widget.display_fields.join(", ") : textValue(widget.display_fields),
    text: textValue(firstPresent(widget, ["text", "content", "body"])),
    linkUrl: textValue(firstPresent(widget, ["link_url", "url", "href"])),
  };
}

function parseWholeNumber(value: string, label: string, min: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min) {
    throw new Error(`${label} must be a whole number ${min} or greater.`);
  }
  return parsed;
}

function buildWidgetPayload(form: WidgetFormState, overrideDataSourceId?: number): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    type: form.type,
    title: form.title.trim(),
    row: parseWholeNumber(form.row, "Row", 0),
    col: parseWholeNumber(form.col, "Column", 0),
    width: parseWholeNumber(form.width, "Width", 1),
    height: parseWholeNumber(form.height, "Height", 1),
  };
  const description = form.description.trim();
  if (description) payload.description = description;
  // Use override (from newly created data source) or existing selection
  const dsId = overrideDataSourceId ?? (form.dataSourceId ? parseWholeNumber(form.dataSourceId, "Data source", 1) : undefined);
  if (dsId) payload.data_source_id = dsId;
  const aggregationType = form.aggregationType.trim();
  if (aggregationType) payload.aggregation_type = aggregationType;
  const fieldName = form.fieldName.trim();
  if (fieldName) payload.field_name = fieldName;
  const groupBy = form.groupBy.trim();
  if (groupBy) payload.group_by = groupBy;
  return payload;
}

function validateWidgetForm(form: WidgetFormState) {
  if (!form.title.trim()) return "Add a widget title.";
  try {
    buildWidgetPayload(form);
  } catch (error) {
    return error instanceof Error ? error.message : "Check the layout values.";
  }
  // Must have either an existing data source OR a table selected to create one from
  if (!form.dataSourceId && !form.tableId) {
    return "Pick a data source or table for this widget.";
  }
  return null;
}

function numericWidgetLayoutValue(
  value: unknown,
  fallback: number,
  min: number,
) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : fallback;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.round(parsed));
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
  const [dashboardViewMode, setDashboardViewMode] = React.useState<DashboardViewMode>("canvas");
  const [widgetForm, setWidgetForm] = React.useState<{
    mode: WidgetFormMode;
    widget: BaserowDashboardWidget | null;
    form: WidgetFormState;
  } | null>(null);

  const widgetsQuery = useQuery({
    queryKey: ["dashboard", dashboardId, "widgets"],
    queryFn: () => apiCall((c) => listDashboardWidgets(c, dashboardId)),
  });
  const applicationQuery = useQuery({
    queryKey: ["dashboard", dashboardId, "application"],
    queryFn: () => apiCall((c) => getApplication(c, dashboardId)),
  });
  // Optional: may 403 on non-admin users — never block the screen
  const userDashboardQuery = useQuery({
    queryKey: ["dashboard", dashboardId, "user"],
    queryFn: () => apiCall((c) => getUserDashboard(c)),
    retry: false,
    throwOnError: false,
  });
  // Optional: admin-only endpoint — silently skipped for regular users
  const adminDashboardQuery = useQuery({
    queryKey: ["dashboard", dashboardId, "admin"],
    queryFn: () => apiCall((c) => getAdminDashboard(c)),
    retry: false,
    throwOnError: false,
  });

  const dataSourcesQuery = useQuery({
    queryKey: ["dashboard", dashboardId, "dataSources"],
    queryFn: () => apiCall((c) => listDashboardDataSources(c, dashboardId)),
  });
  // Optional metadata queries — silently degrade on permission errors
  const snapshotsQuery = useQuery({
    queryKey: ["dashboard", dashboardId, "snapshots"],
    queryFn: () => apiCall((c) => listApplicationSnapshots(c, dashboardId)),
    retry: false,
    throwOnError: false,
  });
  const integrationsQuery = useQuery({
    queryKey: ["dashboard", dashboardId, "integrations"],
    queryFn: () => apiCall((c) => listApplicationIntegrations(c, dashboardId)),
    retry: false,
    throwOnError: false,
  });
  const userSourcesQuery = useQuery({
    queryKey: ["dashboard", dashboardId, "userSources"],
    queryFn: () => apiCall((c) => listApplicationUserSources(c, dashboardId)),
    retry: false,
    throwOnError: false,
  });
  // Workspace databases with their tables (for the widget source picker)
  // Step 1: fetch all applications to get the list of databases
  const applicationsQuery = useQuery({
    queryKey: ["applications"],
    queryFn: () => apiCall((c) => listApplications(c)),
    retry: false,
    throwOnError: false,
  });
  const rawDatabaseApps = (applicationsQuery.data ?? []).filter((a) => a.type === "database");

  // Step 2: for each database, fetch tables via the dedicated endpoint.
  // This is necessary because /api/applications/ may not populate the `tables` array.
  const databaseTablesQuery = useQuery({
    queryKey: ["databaseTables", rawDatabaseApps.map((a) => a.id).join(",")],
    queryFn: async () => {
      if (rawDatabaseApps.length === 0) return {} as Record<number, BaserowTable[]>;
      const results = await Promise.allSettled(
        rawDatabaseApps.map((db) => apiCall((c) => listDatabaseTables(c, db.id))),
      );
      const map: Record<number, BaserowTable[]> = {};
      rawDatabaseApps.forEach((db, i) => {
        const result = results[i];
        // Use fetched tables, or fall back to tables already in the application object
        map[db.id] = result.status === "fulfilled"
          ? result.value
          : (db.tables ?? []);
      });
      return map;
    },
    enabled: rawDatabaseApps.length > 0,
    retry: false,
    throwOnError: false,
  });

  // Combine: database apps enriched with their fetched tables
  const databaseApps: BaserowApplication[] = rawDatabaseApps.map((db) => ({
    ...db,
    tables: databaseTablesQuery.data?.[db.id] ?? db.tables ?? [],
  })).filter((db) => (db.tables?.length ?? 0) > 0);

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
  // Only the core queries block the screen — optional/admin queries degrade silently
  const loading = widgetsQuery.isLoading || dataSourcesQuery.isLoading || applicationQuery.isLoading;
  const errored = widgetsQuery.isError || dataSourcesQuery.isError || applicationQuery.isError;
  const error = (widgetsQuery.error as Error | null) ?? (dataSourcesQuery.error as Error | null) ?? (applicationQuery.error as Error | null);
  const refreshing = widgetsQuery.isRefetching || dataSourcesQuery.isRefetching || applicationQuery.isRefetching || userDashboardQuery.isRefetching || adminDashboardQuery.isRefetching || snapshotsQuery.isRefetching || integrationsQuery.isRefetching || userSourcesQuery.isRefetching;
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
      applicationsQuery.refetch(),
      databaseTablesQuery.refetch(),
    ]);
  };

  const openConnectedWidgetForm = (source: BaserowDataSource) => {
    setWidgetForm({
      mode: "create",
      widget: null,
      form: {
        ...blankWidgetForm(widgets.length, dataSources),
        dataSourceId: String(source.id),
        title: dataSourceName(source),
      },
    });
  };

  const updateWidgetLayout = (
    widget: BaserowDashboardWidget,
    delta: Partial<Record<"row" | "col" | "width" | "height", number>>,
  ) => {
    const next = {
      row: numericWidgetLayoutValue(widget.row, 0, 0) + (delta.row ?? 0),
      col: numericWidgetLayoutValue(widget.col, 0, 0) + (delta.col ?? 0),
      width: numericWidgetLayoutValue(widget.width, 4, 1) + (delta.width ?? 0),
      height: numericWidgetLayoutValue(widget.height, 3, 1) + (delta.height ?? 0),
    };
    next.row = Math.max(0, next.row);
    next.col = Math.max(0, next.col);
    next.width = Math.max(1, next.width);
    next.height = Math.max(1, next.height);

    widgetActionMutation.mutate(() =>
      apiCall((c) => updateDashboardWidget(c, widget.id, next)),
    );
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
                title="New widget"
                onPress={() =>
                  setWidgetForm({
                    mode: "create",
                    widget: null,
                    form: blankWidgetForm(widgets.length, dataSources),
                  })
                }
              />
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

          <ViewModePills options={DASHBOARD_VIEW_MODES} value={dashboardViewMode} onChange={setDashboardViewMode} />
          {dashboardViewMode === "table" ? (
            <DashboardTableMode
              widgets={widgets}
              dataSources={dataSources}
              snapshots={snapshotsQuery.data ?? []}
              integrations={integrationsQuery.data ?? []}
              userSources={userSourcesQuery.data ?? []}
              onEditWidget={(widget) =>
                setWidgetForm({
                  mode: "edit",
                  widget,
                  form: formFromWidget(widget, dataSources),
                })
              }
              onRefreshSource={(source) => dispatchMutation.mutate(source)}
            />
          ) : dashboardViewMode === "insights" ? (
            <DashboardInsightsMode
              widgets={widgets}
              dataSources={dataSources}
              applicationName={applicationQuery.data?.name || dashboardName}
              dashboardType={applicationQuery.data?.type || "dashboard"}
              userDashboard={userDashboardQuery.data}
              adminDashboard={adminDashboardQuery.data}
            />
          ) : (
            <>
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
                  <WidgetPayloadPreview widget={widget} />
                  <View style={[styles.layoutSummary, { borderColor: colors.border }]}>
                    <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>
                      Layout
                    </Text>
                    <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>
                      Row {numericWidgetLayoutValue(widget.row, 0, 0)} · Column{" "}
                      {numericWidgetLayoutValue(widget.col, 0, 0)} ·{" "}
                      {numericWidgetLayoutValue(widget.width, 4, 1)}×
                      {numericWidgetLayoutValue(widget.height, 3, 1)}
                    </Text>
                    <View style={styles.layoutControlGrid}>
                      <Pill label="↑" onPress={() => updateWidgetLayout(widget, { row: -1 })} />
                      <Pill label="↓" onPress={() => updateWidgetLayout(widget, { row: 1 })} />
                      <Pill label="←" onPress={() => updateWidgetLayout(widget, { col: -1 })} />
                      <Pill label="→" onPress={() => updateWidgetLayout(widget, { col: 1 })} />
                      <Pill label="Wider" onPress={() => updateWidgetLayout(widget, { width: 1 })} />
                      <Pill label="Narrower" onPress={() => updateWidgetLayout(widget, { width: -1 })} />
                      <Pill label="Taller" onPress={() => updateWidgetLayout(widget, { height: 1 })} />
                      <Pill label="Shorter" onPress={() => updateWidgetLayout(widget, { height: -1 })} />
                    </View>
                  </View>
                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={() =>
                        setWidgetForm({
                          mode: "edit",
                          widget,
                          form: formFromWidget(widget, dataSources),
                        })
                      }
                      style={[styles.pill, { backgroundColor: colors.primary }]}
                    >
                      <Text style={[styles.pillText, { color: colors.primaryForeground }]}>Edit</Text>
                    </Pressable>
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
                  <Text style={[styles.jsonPreview, { color: colors.mutedForeground }]} numberOfLines={2}>Raw payload: {JSON.stringify(widget)}</Text>
                </Card>
              ))
            )}
          </Section>

          <Section title="Data sources" icon="refresh-cw">
            {dataSources.length === 0 ? (
              <EmptyState icon="database" title="No data sources" description="The Baserow REST schema exposes dashboard data-source listing, update, and dispatch endpoints here. Create or connect one from desktop or a widget payload, then refresh." />
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
                      onPress={() => openConnectedWidgetForm(source)}
                      style={[styles.pill, { backgroundColor: colors.primary }]}
                    >
                      <Text style={[styles.pillText, { color: colors.primaryForeground }]}>Connect widget</Text>
                    </Pressable>
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
            </>
          )}
        </ScrollView>
      )}
      <WidgetFormModal
        state={widgetForm}
        dataSources={dataSources}
        databaseApps={databaseApps}
        loading={widgetActionMutation.isPending}
        onClose={() => setWidgetForm(null)}
        onChange={(form) => setWidgetForm((current) => current ? { ...current, form } : current)}
        onSubmit={(form) => {
          if (!widgetForm) return;
          widgetActionMutation.mutate(async () => {
            if (widgetForm.mode === "edit" && widgetForm.widget) {
              // Editing: use existing data source or create one if table changed
              let dsId = form.dataSourceId ? Number(form.dataSourceId) : undefined;
              if (form.tableId && !form.dataSourceId) {
                const newDs = await apiCall((c) => createDashboardDataSource(c, dashboardId, {
                  type: "local_baserow_grouped_rows",
                  name: form.title.trim() || "Data source",
                  table_id: Number(form.tableId),
                }));
                dsId = newDs.id;
              }
              return apiCall((c) => updateDashboardWidget(c, widgetForm.widget!.id, buildWidgetPayload(form, dsId)));
            } else {
              // Creating: if user picked a table, create data source first
              if (form.tableId) {
                const newDs = await apiCall((c) => createDashboardDataSource(c, dashboardId, {
                  type: "local_baserow_grouped_rows",
                  name: form.title.trim() || "Data source",
                  table_id: Number(form.tableId),
                }));
                return apiCall((c) => createDashboardWidget(c, dashboardId, buildWidgetPayload(form, newDs.id)));
              }
              return apiCall((c) => createDashboardWidget(c, dashboardId, buildWidgetPayload(form)));
            }
          });
          setWidgetForm(null);
        }}
      />
      <JsonActionModal
        action={action}
        loading={widgetActionMutation.isPending}
        onClose={() => setAction(null)}
        onSubmit={(payload) => action?.run(payload)}
      />
    </View>
  );
}

function DashboardTableMode({
  widgets,
  dataSources,
  snapshots,
  integrations,
  userSources,
  onEditWidget,
  onRefreshSource,
}: {
  widgets: BaserowDashboardWidget[];
  dataSources: BaserowDataSource[];
  snapshots: { id: number; created_on?: string; [key: string]: unknown }[];
  integrations: { id: number; name?: string; type?: string; [key: string]: unknown }[];
  userSources: { id: number; name?: string; type?: string; [key: string]: unknown }[];
  onEditWidget: (widget: BaserowDashboardWidget) => void;
  onRefreshSource: (source: BaserowDataSource) => void;
}) {
  return (
    <>
      <InsightCard icon="grid" label="Widgets" value={String(widgets.length)} description="Desktop-like widget inventory with layout coordinates." />
      <InsightCard icon="database" label="Data sources" value={String(dataSources.length)} description="Connected sources available for dashboard cards and charts." />
      <Section title="Widgets table" icon="grid">
        <MobileRecordTable
          items={widgets}
          getKey={(widget) => String(widget.id)}
          onRowPress={(widget) => onEditWidget(widget)}
          emptyIcon="grid"
          emptyTitle="No widgets"
          emptyDescription="Create widgets to populate this dashboard table."
          footerLabel={`${widgets.length} widgets · tap a row to edit`}
          columns={[
            { key: "title", label: "Title", width: 220, render: (widget) => <TableText strong>{labelForWidget(widget)}</TableText> },
            { key: "type", label: "Type", width: 150, render: (widget) => <StatusBadge label={widgetTypeOption(widget.type).label} tone={widget.type === "table" ? "good" : "neutral"} /> },
            { key: "layout", label: "Layout", width: 180, render: (widget) => <TableText>R{numericWidgetLayoutValue(widget.row, 0, 0)} C{numericWidgetLayoutValue(widget.col, 0, 0)} · {numericWidgetLayoutValue(widget.width, 4, 1)}×{numericWidgetLayoutValue(widget.height, 3, 1)}</TableText> },
            { key: "source", label: "Source", width: 160, render: (widget) => <TableText>{widget.data_source_id ?? widget.data_source?.id ? `#${widget.data_source_id ?? widget.data_source?.id}` : "—"}</TableText> },
            { key: "id", label: "ID", width: 90, render: (widget) => <TableText>#{widget.id}</TableText> },
          ]}
        />
      </Section>
      <Section title="Data source table" icon="database">
        <MobileRecordTable
          items={dataSources}
          getKey={(source) => String(source.id)}
          onRowPress={(source) => onRefreshSource(source)}
          emptyIcon="database"
          emptyTitle="No data sources"
          emptyDescription="Connect data sources from desktop or widget payloads to see them here."
          footerLabel={`${dataSources.length} data sources · tap a row to refresh`}
          columns={[
            { key: "name", label: "Name", width: 230, render: (source) => <TableText strong>{dataSourceName(source)}</TableText> },
            { key: "type", label: "Type", width: 190, render: (source) => <TableText>{source.type}</TableText> },
            { key: "schema", label: "Schema", width: 170, render: (source) => <TableText>{source.schema_property || "—"}</TableText> },
            { key: "order", label: "Order", width: 90, render: (source, index) => <TableText>{String(source.order ?? index)}</TableText> },
            { key: "id", label: "ID", width: 90, render: (source) => <TableText>#{source.id}</TableText> },
          ]}
        />
      </Section>
      <Section title="Application metadata table" icon="hash">
        <MobileRecordTable
          items={[
            ...snapshots.map((item) => ({ id: item.id, group: "Snapshot", name: `Snapshot #${item.id}`, detail: item.created_on || "—" })),
            ...integrations.map((item) => ({ id: item.id, group: "Integration", name: item.name || `${item.type} #${item.id}`, detail: item.type || "—" })),
            ...userSources.map((item) => ({ id: item.id, group: "User source", name: item.name || `${item.type} #${item.id}`, detail: item.type || "—" })),
          ]}
          getKey={(item) => `${item.group}-${item.id}`}
          emptyIcon="hash"
          emptyTitle="No metadata"
          emptyDescription="Snapshots, integrations, and user sources will appear in one audit table."
          footerLabel={`${snapshots.length} snapshots · ${integrations.length} integrations · ${userSources.length} user sources`}
          columns={[
            { key: "group", label: "Group", width: 150, render: (item) => <StatusBadge label={item.group} tone={item.group === "Integration" ? "good" : "neutral"} /> },
            { key: "name", label: "Name", width: 230, render: (item) => <TableText strong>{item.name}</TableText> },
            { key: "detail", label: "Detail", width: 230, render: (item) => <TableText>{item.detail}</TableText> },
            { key: "id", label: "ID", width: 90, render: (item) => <TableText>#{item.id}</TableText> },
          ]}
        />
      </Section>
    </>
  );
}

function DashboardInsightsMode({
  widgets,
  dataSources,
  applicationName,
  dashboardType,
  userDashboard,
  adminDashboard,
}: {
  widgets: BaserowDashboardWidget[];
  dataSources: BaserowDataSource[];
  applicationName: string;
  dashboardType: string;
  userDashboard: unknown;
  adminDashboard: unknown;
}) {
  const colors = useColors();
  const chartCount = widgets.filter((widget) => widget.type.includes("chart")).length;
  const tableCount = widgets.filter((widget) => widget.type === "table").length;
  const connectedWidgets = widgets.filter((widget) => widget.data_source_id || widget.data_source?.id).length;
  return (
    <>
      <InsightCard icon="box" label="Application" value={applicationName} description={`Type: ${dashboardType}`} />
      <InsightCard icon="bar-chart-2" label="Charts" value={String(chartCount)} description="Chart widgets configured for visual reporting." />
      <InsightCard icon="grid" label="Tables" value={String(tableCount)} description="Table widgets for spreadsheet-style dashboard sections." />
      <InsightCard icon="link" label="Connected widgets" value={`${connectedWidgets}/${widgets.length}`} description="Widgets linked to dashboard data sources." />
      <Section title="Widget mix" icon="pie-chart">
        <Card>
          <Text style={[styles.itemTitle, { color: colors.foreground }]}>Desktop parity coverage</Text>
          <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>Summary, chart, table, text, and link widgets can be created or edited from mobile.</Text>
          <View style={styles.actionRow}>
            <StatusBadge label={`${dataSources.length} sources`} tone={dataSources.length ? "good" : "neutral"} />
            <StatusBadge label={`${widgets.length} widgets`} tone={widgets.length ? "good" : "neutral"} />
            <StatusBadge label={`${chartCount} charts`} tone={chartCount ? "good" : "neutral"} />
          </View>
        </Card>
      </Section>
      <Section title="Endpoint snapshots" icon="monitor">
        <Card><Text style={[styles.itemTitle, { color: colors.foreground }]}>User dashboard</Text><Text style={[styles.jsonPreview, { color: colors.mutedForeground }]} numberOfLines={6}>{JSON.stringify(userDashboard ?? {}, null, 2)}</Text></Card>
        <Card><Text style={[styles.itemTitle, { color: colors.foreground }]}>Admin dashboard</Text><Text style={[styles.jsonPreview, { color: colors.mutedForeground }]} numberOfLines={6}>{JSON.stringify(adminDashboard ?? {}, null, 2)}</Text></Card>
      </Section>
    </>
  );
}


function WidgetPayloadPreview({ widget }: { widget: BaserowDashboardWidget }) {
  const colors = useColors();
  const type = widgetTypeOption(widget.type);
  const dataSource = widget.data_source;
  const primaryValue = firstPresent(widget, ["value", "result", "count", "total", "summary"]);
  const rows = Array.isArray(widget.rows)
    ? widget.rows
    : Array.isArray(dataSource?.results)
      ? dataSource?.results
      : Array.isArray(dataSource?.data)
        ? dataSource?.data
        : [];

  if (widget.type === "text") {
    return (
      <View style={[styles.widgetPreview, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Text style={[styles.previewBody, { color: colors.foreground }]}>{displayValue(widget.text ?? widget.content ?? widget.description)}</Text>
      </View>
    );
  }

  if (widget.type === "link") {
    return (
      <View style={[styles.widgetPreview, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>Link</Text>
        <Text style={[styles.previewBody, { color: colors.primary }]}>{displayValue(widget.link_url ?? widget.url ?? widget.href)}</Text>
      </View>
    );
  }

  if (widget.type === "table") {
    return (
      <View style={[styles.widgetPreview, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>Rows</Text>
        <Text style={[styles.previewValue, { color: colors.foreground }]}>{rows.length ? `${rows.length} available` : "Waiting for data"}</Text>
        {rows.slice(0, 3).map((row, index) => (
          <Text key={index} style={[styles.previewBody, { color: colors.mutedForeground }]} numberOfLines={1}>
            {displayValue(row)}
          </Text>
        ))}
      </View>
    );
  }

  if (widget.type.includes("chart")) {
    return (
      <View style={[styles.widgetPreview, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.chartBars}>
          {[0.38, 0.72, 0.54, 0.88, 0.46].map((height, index) => (
            <View key={index} style={[styles.chartBar, { height: 50 * height, backgroundColor: colors.primary }]} />
          ))}
        </View>
        <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>
          {type.label} · {displayValue(widget.group_by ?? widget.group_field ?? "ungrouped")}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.widgetPreview, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>Summary value</Text>
      <Text style={[styles.previewValue, { color: colors.foreground }]}>{displayValue(primaryValue)}</Text>
      <Text style={[styles.previewBody, { color: colors.mutedForeground }]}>
        {displayValue(widget.aggregation_type ?? widget.summary_type ?? "count")} {widget.field_name ? `of ${widget.field_name}` : ""}
      </Text>
    </View>
  );
}

function WidgetFormModal({
  state,
  dataSources,
  databaseApps,
  loading,
  onClose,
  onChange,
  onSubmit,
}: {
  state: { mode: WidgetFormMode; widget: BaserowDashboardWidget | null; form: WidgetFormState } | null;
  dataSources: BaserowDataSource[];
  databaseApps: BaserowApplication[];
  loading?: boolean;
  onClose: () => void;
  onChange: (form: WidgetFormState) => void;
  onSubmit: (form: WidgetFormState) => void;
}) {
  const colors = useColors();
  const [error, setError] = React.useState<string | null>(null);
  const [sourcePickerOpen, setSourcePickerOpen] = React.useState(false);
  const [sourceSearch, setSourceSearch] = React.useState("");
  const form = state?.form;
  const type = form ? widgetTypeOption(form.type) : WIDGET_TYPES[0];

  React.useEffect(() => { setError(null); setSourcePickerOpen(false); setSourceSearch(""); }, [state]);

  const update = (patch: Partial<WidgetFormState>) => {
    if (!form) return;
    const next = { ...form, ...patch };
    onChange(next);
    setError(null);
  };

  if (!state || !form) return null;

  // Derive a human-readable label for the current selection
  const selectedTable = databaseApps.flatMap((db) => db.tables ?? []).find((t) => String(t.id) === form.tableId);
  const selectedSource = dataSources.find((s) => String(s.id) === form.dataSourceId);
  const selectionLabel = selectedTable?.name ?? (selectedSource ? dataSourceName(selectedSource) : null);

  // Filter databases and tables by search query
  const searchLower = sourceSearch.toLowerCase().trim();
  const filteredDbs = databaseApps
    .map((db) => ({
      db,
      tables: (db.tables ?? []).filter(
        (t) => !searchLower || t.name.toLowerCase().includes(searchLower) || db.name.toLowerCase().includes(searchLower),
      ),
    }))
    .filter(({ tables }) => tables.length > 0);
  const filteredExistingSources = searchLower
    ? dataSources.filter((s) => dataSourceName(s).toLowerCase().includes(searchLower))
    : dataSources;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.modalBackdrop, { backgroundColor: "rgba(15, 23, 42, 0.45)" }]} onPress={onClose}>
        <Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            {state.mode === "edit" ? "Edit widget" : "New widget"}
          </Text>
          <Text style={[styles.modalDescription, { color: colors.mutedForeground }]}>Pick a widget type, configure its basics, and validate layout before saving.</Text>
          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Widget type</Text>
            <View style={styles.typeGrid}>
              {WIDGET_TYPES.map((option) => {
                const selected = option.id === form.type;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => update({ type: option.id })}
                    style={[styles.typeOption, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.secondary : colors.background }]}
                  >
                    <Feather name={option.icon} size={16} color={selected ? colors.primary : colors.mutedForeground} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.typeTitle, { color: colors.foreground }]}>{option.label}</Text>
                      <Text style={[styles.typeDescription, { color: colors.mutedForeground }]}>{option.description}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <FormInput label="Title" value={form.title} onChangeText={(title) => update({ title })} autoFocus />
            <FormInput label="Description" value={form.description} onChangeText={(description) => update({ description })} multiline />

            {/* ── Source picker ── */}
            <View style={styles.formBlock}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Source</Text>

              {/* Trigger */}
              <Pressable
                style={[styles.sourceTrigger, {
                  borderColor: sourcePickerOpen ? colors.primary : colors.border,
                  backgroundColor: colors.background,
                }]}
                onPress={() => { setSourcePickerOpen((v) => !v); setSourceSearch(""); }}
              >
                {selectionLabel ? (
                  <>
                    <Feather name="database" size={14} color={colors.primary} />
                    <Text style={[styles.sourceTriggerText, { color: colors.foreground }]} numberOfLines={1}>
                      {selectionLabel}
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.sourceTriggerText, { color: colors.mutedForeground }]}>Make a choice</Text>
                )}
                <Feather name={sourcePickerOpen ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} />
              </Pressable>

              {/* Inline dropdown */}
              {sourcePickerOpen && (
                <View style={[styles.sourceDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {/* Search */}
                  <View style={[styles.sourceSearchRow, { borderBottomColor: colors.border }]}>
                    <Feather name="search" size={13} color={colors.mutedForeground} />
                    <TextInput
                      style={[styles.sourceSearchInput, { color: colors.foreground }]}
                      value={sourceSearch}
                      onChangeText={setSourceSearch}
                      placeholder="Search tables"
                      placeholderTextColor={colors.mutedForeground}
                      autoFocus
                    />
                    {sourceSearch.length > 0 && (
                      <Pressable onPress={() => setSourceSearch("")}>
                        <Feather name="x" size={13} color={colors.mutedForeground} />
                      </Pressable>
                    )}
                  </View>

                  <ScrollView style={styles.sourceOptionScroll} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                    {/* Workspace databases → tables */}
                    {filteredDbs.length > 0 && filteredDbs.map(({ db, tables }) => (
                      <View key={db.id}>
                        {/* Database group header */}
                        <View style={[styles.sourceGroupHeader, { borderBottomColor: colors.border }]}>
                          <Feather name="layers" size={11} color={colors.mutedForeground} />
                          <Text style={[styles.sourceGroupLabel, { color: colors.mutedForeground }]}>
                            {db.name} ({db.id})
                          </Text>
                        </View>
                        {/* Tables in this database */}
                        {tables.map((table) => {
                          const selected = String(table.id) === form.tableId;
                          return (
                            <Pressable
                              key={table.id}
                              style={[styles.sourceOptionRow, selected && { backgroundColor: colors.secondary }]}
                              onPress={() => {
                                // Picking a table clears any existing dataSourceId
                                update({ tableId: String(table.id), dataSourceId: "" });
                                setSourcePickerOpen(false);
                                setSourceSearch("");
                              }}
                            >
                              <Feather name={selected ? "check" : "grid"} size={13} color={selected ? colors.primary : colors.mutedForeground} />
                              <Text style={[styles.sourceOptionText, { color: selected ? colors.primary : colors.foreground }]} numberOfLines={1}>
                                {table.name}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    ))}

                    {/* Existing dashboard data sources (secondary section) */}
                    {filteredExistingSources.length > 0 && (
                      <View>
                        <View style={[styles.sourceGroupHeader, { borderBottomColor: colors.border }]}>
                          <Feather name="database" size={11} color={colors.mutedForeground} />
                          <Text style={[styles.sourceGroupLabel, { color: colors.mutedForeground }]}>Dashboard data sources</Text>
                        </View>
                        {filteredExistingSources.map((source) => {
                          const selected = String(source.id) === form.dataSourceId;
                          return (
                            <Pressable
                              key={source.id}
                              style={[styles.sourceOptionRow, selected && { backgroundColor: colors.secondary }]}
                              onPress={() => {
                                // Picking an existing source clears tableId
                                update({ dataSourceId: String(source.id), tableId: "" });
                                setSourcePickerOpen(false);
                                setSourceSearch("");
                              }}
                            >
                              <Feather name={selected ? "check" : "link"} size={13} color={selected ? colors.primary : colors.mutedForeground} />
                              <Text style={[styles.sourceOptionText, { color: selected ? colors.primary : colors.foreground }]} numberOfLines={1}>
                                {dataSourceName(source)}
                              </Text>
                              <Text style={[styles.sourceOptionMeta, { color: colors.mutedForeground }]}>{source.type?.replace(/_/g, " ")}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    )}

                    {filteredDbs.length === 0 && filteredExistingSources.length === 0 && (
                      <Text style={[styles.sourceNoResult, { color: colors.mutedForeground }]}>No results</Text>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.layoutGrid}>
              <FormInput label="Row" value={form.row} onChangeText={(row) => update({ row })} keyboardType="number-pad" />
              <FormInput label="Column" value={form.col} onChangeText={(col) => update({ col })} keyboardType="number-pad" />
              <FormInput label="Width" value={form.width} onChangeText={(width) => update({ width })} keyboardType="number-pad" />
              <FormInput label="Height" value={form.height} onChangeText={(height) => update({ height })} keyboardType="number-pad" />
            </View>

            {form.type === "summary" ? (
              <>
                <FormInput label="Aggregation" value={form.aggregationType} onChangeText={(aggregationType) => update({ aggregationType })} placeholder="count, sum, average" />
                <FormInput label="Field name" value={form.fieldName} onChangeText={(fieldName) => update({ fieldName })} placeholder="Optional source field" />
              </>
            ) : null}
            {form.type.includes("chart") ? (
              <>
                <FormInput label="Group by" value={form.groupBy} onChangeText={(groupBy) => update({ groupBy })} placeholder="Category/date field" />
                <FormInput label="Value field" value={form.fieldName} onChangeText={(fieldName) => update({ fieldName })} placeholder="Numeric field" />
              </>
            ) : null}
          </ScrollView>
          {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}
          <View style={styles.modalActions}>
            <Button title="Cancel" variant="secondary" onPress={onClose} />
            <Button
              title={state.mode === "edit" ? "Update" : "Create"}
              loading={loading}
              onPress={() => {
                const validation = validateWidgetForm(form);
                if (validation) {
                  setError(validation);
                  return;
                }
                onSubmit(form);
              }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  autoFocus,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "number-pad";
  autoFocus?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  const colors = useColors();
  return (
    <View style={styles.formBlock}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        multiline={multiline}
        keyboardType={keyboardType}
        autoFocus={autoFocus}
        autoCapitalize={autoCapitalize}
        style={[styles.input, multiline ? styles.multilineInput : null, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
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
  buttonRow: { marginTop: 16, alignItems: "flex-start", gap: 10 },
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
  widgetPreview: { marginTop: 12, borderWidth: 1, borderRadius: 14, padding: 12, gap: 6 },
  previewLabel: { fontSize: 11, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  previewValue: { fontSize: 26, lineHeight: 32, fontFamily: "Inter_700Bold" },
  previewBody: { fontSize: 13, lineHeight: 18, fontFamily: "Inter_400Regular" },
  chartBars: { height: 56, flexDirection: "row", alignItems: "flex-end", gap: 8, paddingTop: 6 },
  chartBar: { width: 18, borderRadius: 6, opacity: 0.78 },
  pill: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 },
  pillText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  modalBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 18 },
  modalCard: { width: "100%", maxWidth: 620, maxHeight: "90%", borderWidth: 1, padding: 18 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  modalDescription: { marginTop: 6, fontSize: 13, lineHeight: 19, fontFamily: "Inter_400Regular" },
  modalScroll: { marginTop: 14, maxHeight: 560 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16 },
  typeGrid: { gap: 8, marginBottom: 12 },
  typeOption: { flexDirection: "row", gap: 10, borderWidth: 1, borderRadius: 14, padding: 12 },
  typeTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  typeDescription: { marginTop: 2, fontSize: 12, lineHeight: 16, fontFamily: "Inter_400Regular" },
  formBlock: { marginTop: 12, gap: 6 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  input: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular" },
  multilineInput: { minHeight: 86, textAlignVertical: "top" },
  layoutGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  layoutSummary: { marginTop: 12, borderTopWidth: 1, paddingTop: 12 },
  layoutControlGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  sourceList: { gap: 8 },
  sourceOption: { flexDirection: "row", gap: 10, borderWidth: 1, borderRadius: 14, padding: 12 },
  helperText: { fontSize: 13, lineHeight: 18, fontFamily: "Inter_500Medium" },
  errorText: { marginTop: 10, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  // Source picker
  sourceTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    minHeight: 44,
  },
  sourceTriggerText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  sourceDropdown: {
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 4,
    overflow: "hidden",
  },
  sourceSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  sourceSearchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    paddingVertical: 2,
  },
  sourceOptionScroll: { maxHeight: 180 },
  sourceOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sourceOptionText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  sourceOptionMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  sourceNoResult: { padding: 12, fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  emptySourceBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
  },
  emptySourceText: { flex: 1, fontSize: 13, lineHeight: 18, fontFamily: "Inter_400Regular" },
  sourceGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sourceGroupLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.4 },
});
