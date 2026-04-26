import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import type React from "react";
import { useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { JsonActionModal, type JsonAction } from "@/components/JsonActionModal";
import { LoadingState } from "@/components/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";
import {
  createBuilderPageDataSource,
  createBuilderPageElement,
  createBuilderPageWorkflowAction,
  deleteBuilderPageDataSource,
  deleteBuilderPageElement,
  deleteBuilderPageWorkflowAction,
  dispatchBuilderPageDataSource,
  dispatchBuilderPageDataSources,
  dispatchBuilderPageWorkflowAction,
  duplicateBuilderPageElement,
  getBuilderPageDataSourceRecordNames,
  listBuilderPageDataSources,
  listBuilderPageElements,
  listBuilderPageWorkflowActions,
  moveBuilderPageDataSource,
  moveBuilderPageElement,
  orderBuilderWorkflowActions,
  updateBuilderPageDataSource,
  updateBuilderPageElement,
  updateBuilderPageWorkflowAction,
  type BaserowDataSource,
} from "@/lib/baserow";

export default function BuilderPageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const { apiCall } = useAuth();
  const params = useLocalSearchParams<{ id: string; name?: string; builder?: string }>();
  const pageId = Number(params.id);
  const pageName = params.name || "Page";
  const [jsonAction, setJsonAction] = useState<(JsonAction & { run: (payload: Record<string, unknown>) => void }) | null>(null);

  const elementsQuery = useQuery({ queryKey: ["builderPage", pageId, "elements"], queryFn: () => apiCall((c) => listBuilderPageElements(c, pageId)) });
  const dataSourcesQuery = useQuery({ queryKey: ["builderPage", pageId, "dataSources"], queryFn: () => apiCall((c) => listBuilderPageDataSources(c, pageId)) });
  const actionsQuery = useQuery({ queryKey: ["builderPage", pageId, "workflowActions"], queryFn: () => apiCall((c) => listBuilderPageWorkflowActions(c, pageId)) });

  const refresh = async () => { await Promise.all([elementsQuery.refetch(), dataSourcesQuery.refetch(), actionsQuery.refetch()]); };
  const actionMutation = useMutation({ mutationFn: (fn: () => Promise<unknown>) => fn(), onSuccess: async () => { setJsonAction(null); await refresh(); }, onError: (error) => Alert.alert("Builder page action failed", error instanceof Error ? error.message : "Please try again.") });
  const dispatchAllMutation = useMutation({ mutationFn: () => apiCall((c) => dispatchBuilderPageDataSources(c, pageId)), onSuccess: () => Alert.alert("Data sources dispatched", "Baserow accepted the page data-source dispatch."), onError: (error) => Alert.alert("Could not dispatch data sources", error instanceof Error ? error.message : "Please try again.") });
  const dispatchOneMutation = useMutation({ mutationFn: (source: BaserowDataSource) => apiCall((c) => dispatchBuilderPageDataSource(c, source.id)), onSuccess: (_, source) => Alert.alert("Data source dispatched", source.name || `${source.type} data source #${source.id}`), onError: (error) => Alert.alert("Could not dispatch data source", error instanceof Error ? error.message : "Please try again.") });

  const elements = (elementsQuery.data ?? []).slice().sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
  const dataSources = (dataSourcesQuery.data ?? []).slice().sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
  const actions = (actionsQuery.data ?? []).slice().sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
  const loading = elementsQuery.isLoading || dataSourcesQuery.isLoading || actionsQuery.isLoading;
  const errored = elementsQuery.isError || dataSourcesQuery.isError || actionsQuery.isError;
  const error = (elementsQuery.error as Error | null) ?? (dataSourcesQuery.error as Error | null) ?? (actionsQuery.error as Error | null);
  const refreshing = elementsQuery.isRefetching || dataSourcesQuery.isRefetching || actionsQuery.isRefetching;
  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16) + 24;

  return <View style={[styles.fill, { backgroundColor: colors.background }]}>
    <Stack.Screen options={{ title: pageName }} />
    {loading ? <LoadingState /> : errored ? <ErrorState title="Could not load page" message={error?.message} onRetry={() => void refresh()} /> : (
      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad, paddingTop: 12 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.primary} />}>
        <View style={styles.headerWrap}><Text style={[styles.crumb, { color: colors.mutedForeground }]}>{params.builder || "Application"}</Text><Text style={[styles.title, { color: colors.foreground }]}>{pageName}</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{elements.length} elements · {dataSources.length} data sources · {actions.length} actions</Text><View style={styles.headerButtonRow}><Pill label="Dispatch all data" primary onPress={() => dispatchAllMutation.mutate()} /><Pill label="Create element JSON" onPress={() => setJsonAction({ title: "Create element", description: "Enter the exact element payload Baserow expects.", initialJson: '{\n  "type": "heading",\n  "value": "New heading"\n}', submitLabel: "Create", requiresJson: true, run: (payload) => actionMutation.mutate(() => apiCall((c) => createBuilderPageElement(c, pageId, payload))) })} /><Pill label="Create data source JSON" onPress={() => setJsonAction({ title: "Create data source", description: "Enter the exact data-source payload Baserow expects.", initialJson: '{\n  "type": "local_baserow_list_rows"\n}', submitLabel: "Create", requiresJson: true, run: (payload) => actionMutation.mutate(() => apiCall((c) => createBuilderPageDataSource(c, pageId, payload))) })} /><Pill label="Create action JSON" onPress={() => setJsonAction({ title: "Create workflow action", description: "Enter the exact workflow-action payload Baserow expects.", initialJson: '{\n  "type": "notification"\n}', submitLabel: "Create", requiresJson: true, run: (payload) => actionMutation.mutate(() => apiCall((c) => createBuilderPageWorkflowAction(c, pageId, payload))) })} />{actions.length > 1 ? <Pill label="Save action order" onPress={() => actionMutation.mutate(() => apiCall((c) => orderBuilderWorkflowActions(c, pageId, actions.map((action) => action.id))))} /> : null}</View></View>
        <Section title="Elements" icon="layers">{elements.length === 0 ? <EmptyState icon="layers" title="No elements" description="Page elements added on desktop will appear here for mobile inspection." /> : elements.map((element) => <Card key={element.id}><Text style={[styles.itemTitle, { color: colors.foreground }]}>{element.name || `${element.type} element`}</Text><Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>Type: {element.type}</Text><View style={styles.actionRow}><Pill label="Edit JSON" onPress={() => setJsonAction({ title: "Update element", initialJson: JSON.stringify(element, null, 2), submitLabel: "Update", run: (payload) => actionMutation.mutate(() => apiCall((c) => updateBuilderPageElement(c, element.id, payload))) })} /><Pill label="Duplicate" onPress={() => actionMutation.mutate(() => apiCall((c) => duplicateBuilderPageElement(c, element.id)))} /><Pill label="Move JSON" onPress={() => setJsonAction({ title: "Move element", initialJson: "{}", submitLabel: "Move", run: (payload) => actionMutation.mutate(() => apiCall((c) => moveBuilderPageElement(c, element.id, payload))) })} /><Pill label="Delete" destructive onPress={() => setJsonAction({ title: "Delete element", description: "Submit {} to confirm.", initialJson: "{}", submitLabel: "Delete", destructive: true, run: () => actionMutation.mutate(() => apiCall((c) => deleteBuilderPageElement(c, element.id))) })} /></View></Card>)}</Section>
        <Section title="Data sources" icon="database">{dataSources.length === 0 ? <EmptyState icon="database" title="No data sources" description="Connect page data sources on desktop or with JSON endpoint access." /> : dataSources.map((source) => <Card key={source.id}><View style={styles.rowTop}><View style={{ flex: 1 }}><Text style={[styles.itemTitle, { color: colors.foreground }]}>{source.name || `${source.type} data source #${source.id}`}</Text><Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>Type: {source.type}</Text></View><Pressable onPress={() => dispatchOneMutation.mutate(source)} style={({ pressed }) => [styles.smallButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.75 : 1 }]}><Text style={[styles.smallButtonText, { color: colors.primary }]}>Dispatch</Text></Pressable></View><View style={styles.actionRow}><Pill label="Edit JSON" onPress={() => setJsonAction({ title: "Update data source", initialJson: JSON.stringify(source, null, 2), submitLabel: "Update", run: (payload) => actionMutation.mutate(() => apiCall((c) => updateBuilderPageDataSource(c, source.id, payload))) })} /><Pill label="Dispatch JSON" onPress={() => setJsonAction({ title: "Dispatch data source", initialJson: "{}", submitLabel: "Dispatch", run: (payload) => actionMutation.mutate(() => apiCall((c) => dispatchBuilderPageDataSource(c, source.id, payload))) })} /><Pill label="Record names" onPress={() => actionMutation.mutate(() => apiCall((c) => getBuilderPageDataSourceRecordNames(c, source.id)))} /><Pill label="Move JSON" onPress={() => setJsonAction({ title: "Move data source", initialJson: "{}", submitLabel: "Move", run: (payload) => actionMutation.mutate(() => apiCall((c) => moveBuilderPageDataSource(c, source.id, payload))) })} /><Pill label="Delete" destructive onPress={() => setJsonAction({ title: "Delete data source", description: "Submit {} to confirm.", initialJson: "{}", submitLabel: "Delete", destructive: true, run: () => actionMutation.mutate(() => apiCall((c) => deleteBuilderPageDataSource(c, source.id))) })} /></View></Card>)}</Section>
        <Section title="Workflow actions" icon="zap">{actions.length === 0 ? <EmptyState icon="zap" title="No workflow actions" description="Page workflow actions will appear here." /> : actions.map((action) => <Card key={action.id}><Text style={[styles.itemTitle, { color: colors.foreground }]}>{action.name || `${action.type} action`}</Text><Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>Type: {action.type}</Text><View style={styles.actionRow}><Pill label="Edit JSON" onPress={() => setJsonAction({ title: "Update workflow action", initialJson: JSON.stringify(action, null, 2), submitLabel: "Update", run: (payload) => actionMutation.mutate(() => apiCall((c) => updateBuilderPageWorkflowAction(c, action.id, payload))) })} /><Pill label="Dispatch JSON" onPress={() => setJsonAction({ title: "Dispatch workflow action", initialJson: "{}", submitLabel: "Dispatch", run: (payload) => actionMutation.mutate(() => apiCall((c) => dispatchBuilderPageWorkflowAction(c, action.id, payload))) })} /><Pill label="Delete" destructive onPress={() => setJsonAction({ title: "Delete workflow action", description: "Submit {} to confirm.", initialJson: "{}", submitLabel: "Delete", destructive: true, run: () => actionMutation.mutate(() => apiCall((c) => deleteBuilderPageWorkflowAction(c, action.id))) })} /></View></Card>)}</Section>
      </ScrollView>
    )}
    <JsonActionModal action={jsonAction} loading={actionMutation.isPending} onClose={() => setJsonAction(null)} onSubmit={(payload) => jsonAction?.run(payload)} />
  </View>;
}

function Section({ title, icon, children }: { title: string; icon: keyof typeof Feather.glyphMap; children: React.ReactNode }) { const colors = useColors(); return <View style={styles.section}><View style={styles.sectionHeader}><Feather name={icon} size={16} color={colors.mutedForeground} /><Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text></View>{children}</View>; }
function Card({ children }: { children: React.ReactNode }) { const colors = useColors(); return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>{children}</View>; }
function Pill({ label, onPress, destructive, primary }: { label: string; onPress: () => void; destructive?: boolean; primary?: boolean }) { const colors = useColors(); return <Pressable onPress={onPress} style={[styles.pill, { backgroundColor: destructive ? colors.destructive : primary ? colors.primary : colors.secondary }]}><Text style={[styles.pillText, { color: destructive ? colors.destructiveForeground : primary ? colors.primaryForeground : colors.primary }]}>{label}</Text></Pressable>; }
const styles = StyleSheet.create({ fill: { flex: 1 }, headerWrap: { paddingHorizontal: 20, paddingBottom: 8 }, crumb: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 4 }, title: { fontSize: 30, lineHeight: 36, fontFamily: "Inter_700Bold" }, subtitle: { marginTop: 6, fontSize: 14, fontFamily: "Inter_400Regular" }, headerButtonRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 }, section: { paddingHorizontal: 16, paddingTop: 18, gap: 10 }, sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 }, sectionTitle: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 0.7, textTransform: "uppercase" }, card: { borderWidth: 1, padding: 14, marginBottom: 10 }, rowTop: { flexDirection: "row", alignItems: "center", gap: 12 }, itemTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" }, itemMeta: { marginTop: 3, fontSize: 13, fontFamily: "Inter_400Regular" }, actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }, pill: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 }, pillText: { fontSize: 12, fontFamily: "Inter_700Bold" }, smallButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }, smallButtonText: { fontSize: 12, fontFamily: "Inter_700Bold" } });
