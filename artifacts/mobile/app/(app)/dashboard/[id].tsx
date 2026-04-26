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

type WidgetTypeId =
  | "summary"
  | "bar_chart"
  | "line_chart"
  | "pie_chart"
  | "doughnut_chart"
  | "table"
  | "text"
  | "link";

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
    description: "Compare grouped values across categories.",
    needsSource: true,
  },
  {
    id: "line_chart",
    label: "Line chart",
    icon: "trending-up",
    description: "Show a trend over time or ordered records.",
    needsSource: true,
  },
  {
    id: "pie_chart",
    label: "Pie chart",
    icon: "pie-chart",
    description: "Show proportions of a whole.",
    needsSource: true,
  },
  {
    id: "doughnut_chart",
    label: "Doughnut chart",
    icon: "circle",
    description: "Show proportions with a compact KPI-style center.",
    needsSource: true,
  },
  {
    id: "table",
    label: "Table",
    icon: "list",
    description: "Render rows from a connected data source.",
    needsSource: true,
  },
  {
    id: "text",
    label: "Text block",
    icon: "type",
    description: "Static dashboard note or instructions.",
    needsSource: false,
  },
  {
    id: "link",
    label: "Link card",
    icon: "link",
    description: "A shortcut to an external resource.",
    needsSource: false,
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
  dataSourceId: string;
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

function buildWidgetPayload(form: WidgetFormState): Record<string, unknown> {
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
  if (widgetNeedsSource(form.type)) {
    payload.data_source_id = parseWholeNumber(form.dataSourceId, "Data source", 1);
  }
  const aggregationType = form.aggregationType.trim();
  if (aggregationType) payload.aggregation_type = aggregationType;
  const fieldName = form.fieldName.trim();
  if (fieldName) payload.field_name = fieldName;
  const groupBy = form.groupBy.trim();
  if (groupBy) payload.group_by = groupBy;
  const displayFields = form.displayFields
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean);
  if (displayFields.length) payload.display_fields = displayFields;
  const text = form.text.trim();
  if (text) payload.text = text;
  const linkUrl = form.linkUrl.trim();
  if (linkUrl) payload.link_url = linkUrl;
  return payload;
}

function validateWidgetForm(form: WidgetFormState) {
  if (!form.title.trim()) return "Add a widget title.";
  try {
    buildWidgetPayload(form);
  } catch (error) {
    return error instanceof Error ? error.message : "Check the layout values.";
  }
  if (widgetNeedsSource(form.type) && !form.dataSourceId) {
    return "Pick a data source for this widget type.";
  }
  if (form.type === "link" && form.linkUrl.trim() && !/^https?:\/\//i.test(form.linkUrl.trim())) {
    return "Link URL must start with http:// or https://.";
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
        </ScrollView>
      )}
      <WidgetFormModal
        state={widgetForm}
        dataSources={dataSources}
        loading={widgetActionMutation.isPending}
        onClose={() => setWidgetForm(null)}
        onChange={(form) => setWidgetForm((current) => current ? { ...current, form } : current)}
        onSubmit={(payload) => {
          if (!widgetForm) return;
          widgetActionMutation.mutate(() =>
            widgetForm.mode === "edit" && widgetForm.widget
              ? apiCall((c) => updateDashboardWidget(c, widgetForm.widget!.id, payload))
              : apiCall((c) => createDashboardWidget(c, dashboardId, payload)),
          );
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
  loading,
  onClose,
  onChange,
  onSubmit,
}: {
  state: { mode: WidgetFormMode; widget: BaserowDashboardWidget | null; form: WidgetFormState } | null;
  dataSources: BaserowDataSource[];
  loading?: boolean;
  onClose: () => void;
  onChange: (form: WidgetFormState) => void;
  onSubmit: (payload: Record<string, unknown>) => void;
}) {
  const colors = useColors();
  const [error, setError] = React.useState<string | null>(null);
  const form = state?.form;
  const type = form ? widgetTypeOption(form.type) : WIDGET_TYPES[0];

  React.useEffect(() => setError(null), [state]);

  const update = (patch: Partial<WidgetFormState>) => {
    if (!form) return;
    const next = { ...form, ...patch };
    if (patch.type && !widgetNeedsSource(patch.type)) {
      next.dataSourceId = "";
    } else if (patch.type && widgetNeedsSource(patch.type) && !next.dataSourceId && dataSources[0]?.id) {
      next.dataSourceId = String(dataSources[0].id);
    }
    onChange(next);
    setError(null);
  };

  if (!state || !form) return null;

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

            {type.needsSource ? (
              <View style={styles.formBlock}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Data source</Text>
                {dataSources.length === 0 ? (
                  <Text style={[styles.helperText, { color: colors.destructive }]}>Create a dashboard data source first, then return to connect this widget.</Text>
                ) : (
                  <View style={styles.sourceList}>
                    {dataSources.map((source) => {
                      const selected = String(source.id) === form.dataSourceId;
                      return (
                        <Pressable
                          key={source.id}
                          onPress={() => update({ dataSourceId: String(source.id) })}
                          style={[styles.sourceOption, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.secondary : colors.background }]}
                        >
                          <Feather name={selected ? "check-circle" : "database"} size={16} color={selected ? colors.primary : colors.mutedForeground} />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.typeTitle, { color: colors.foreground }]}>{dataSourceName(source)}</Text>
                            <Text style={[styles.typeDescription, { color: colors.mutedForeground }]}>Type: {source.type}</Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            ) : null}

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
            {form.type === "table" ? (
              <FormInput label="Display fields" value={form.displayFields} onChangeText={(displayFields) => update({ displayFields })} placeholder="Comma-separated field names" />
            ) : null}
            {form.type === "text" ? (
              <FormInput label="Text" value={form.text} onChangeText={(text) => update({ text })} multiline />
            ) : null}
            {form.type === "link" ? (
              <FormInput label="Link URL" value={form.linkUrl} onChangeText={(linkUrl) => update({ linkUrl })} placeholder="https://…" autoCapitalize="none" />
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
                onSubmit(buildWidgetPayload(form));
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
});
