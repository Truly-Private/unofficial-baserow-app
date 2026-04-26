import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  createAutomationNode,
  deleteAutomationNode,
  duplicateAutomationNode,
  getAutomationWorkflow,
  getAutomationWorkflowHistory,
  listAutomationNodes,
  moveAutomationNode,
  publishAutomationWorkflowAsync,
  replaceAutomationNode,
  simulateDispatchAutomationNode,
  testAutomationWorkflow,
  updateAutomationNode,
  type BaserowAutomationHistoryItem,
} from "@/lib/baserow";

function historyItems(data: BaserowAutomationHistoryItem[] | { results?: BaserowAutomationHistoryItem[] } | undefined) {
  if (!data) return [];
  return Array.isArray(data) ? data : data.results ?? [];
}

export default function WorkflowScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const { apiCall } = useAuth();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id: string; name?: string; automation?: string }>();
  const workflowId = Number(params.id);
  const fallbackName = params.name || "Workflow";
  const [jsonAction, setJsonAction] = React.useState<(JsonAction & { run: (payload: Record<string, unknown>) => void }) | null>(null);

  const workflowQuery = useQuery({ queryKey: ["automationWorkflow", workflowId], queryFn: () => apiCall((c) => getAutomationWorkflow(c, workflowId)) });
  const nodesQuery = useQuery({ queryKey: ["automationWorkflow", workflowId, "nodes"], queryFn: () => apiCall((c) => listAutomationNodes(c, workflowId)) });
  const historyQuery = useQuery({ queryKey: ["automationWorkflow", workflowId, "history"], queryFn: () => apiCall((c) => getAutomationWorkflowHistory(c, workflowId)) });

  const testMutation = useMutation({
    mutationFn: () => apiCall((c) => testAutomationWorkflow(c, workflowId)),
    onSuccess: () => Alert.alert("Workflow test started", "Baserow accepted the test request."),
    onError: (error) => Alert.alert("Could not test workflow", error instanceof Error ? error.message : "Please try again."),
  });
  const publishMutation = useMutation({
    mutationFn: () => apiCall((c) => publishAutomationWorkflowAsync(c, workflowId)),
    onSuccess: async () => {
      Alert.alert("Publish started", "Baserow is publishing this workflow.");
      await queryClient.invalidateQueries({ queryKey: ["automationWorkflow", workflowId] });
    },
    onError: (error) => Alert.alert("Could not publish workflow", error instanceof Error ? error.message : "Please try again."),
  });
  const simulateMutation = useMutation({
    mutationFn: (nodeId: number) => apiCall((c) => simulateDispatchAutomationNode(c, nodeId)),
    onSuccess: () => Alert.alert("Node simulated", "Baserow accepted the simulation request."),
    onError: (error) => Alert.alert("Could not simulate node", error instanceof Error ? error.message : "Please try again."),
  });
  const nodeActionMutation = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: async () => {
      setJsonAction(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["automationWorkflow", workflowId] }),
        queryClient.invalidateQueries({ queryKey: ["automationWorkflow", workflowId, "nodes"] }),
        queryClient.invalidateQueries({ queryKey: ["automationWorkflow", workflowId, "history"] }),
      ]);
    },
    onError: (error) => Alert.alert("Node action failed", error instanceof Error ? error.message : "Please try again."),
  });

  const nodes = (nodesQuery.data ?? []).slice().sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
  const history = historyItems(historyQuery.data).slice(0, 10);
  const loading = workflowQuery.isLoading || nodesQuery.isLoading || historyQuery.isLoading;
  const errored = workflowQuery.isError || nodesQuery.isError || historyQuery.isError;
  const error = (workflowQuery.error as Error | null) ?? (nodesQuery.error as Error | null) ?? (historyQuery.error as Error | null);
  const workflowName = workflowQuery.data?.name || fallbackName;
  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16) + 24;
  const refresh = async () => { await Promise.all([workflowQuery.refetch(), nodesQuery.refetch(), historyQuery.refetch()]); };

  return <View style={[styles.fill, { backgroundColor: colors.background }]}>
    <Stack.Screen options={{ title: workflowName }} />
    {loading ? <LoadingState /> : errored ? <ErrorState title="Could not load workflow" message={error?.message} onRetry={() => void refresh()} /> : (
      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad, paddingTop: 12 }} refreshControl={<RefreshControl refreshing={workflowQuery.isRefetching || nodesQuery.isRefetching || historyQuery.isRefetching} onRefresh={() => void refresh()} tintColor={colors.primary} />}>
        <View style={styles.headerWrap}>
          <Text style={[styles.crumb, { color: colors.mutedForeground }]}>{params.automation || "Automation"}</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{workflowName}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{nodes.length} nodes · {workflowQuery.data?.published ? "Published" : "Draft"}</Text>
          <View style={styles.buttonRow}>
            <Button title="Test" variant="secondary" onPress={() => testMutation.mutate()} loading={testMutation.isPending} />
            <Button title="Publish" onPress={() => publishMutation.mutate()} loading={publishMutation.isPending} />
            <Button
              title="Create node JSON"
              variant="secondary"
              onPress={() =>
                setJsonAction({
                  title: "Create automation node",
                  description: "Enter the exact trigger/action node payload Baserow expects.",
                  initialJson: '{\n  "type": "local_baserow_create_row"\n}',
                  submitLabel: "Create",
                  requiresJson: true,
                  run: (payload) =>
                    nodeActionMutation.mutate(() =>
                      apiCall((c) => createAutomationNode(c, workflowId, payload)),
                    ),
                })
              }
            />
          </View>
        </View>

        <Section title="Nodes" icon="git-branch">
          {nodes.length === 0 ? <EmptyState icon="git-branch" title="No nodes" description="Add trigger/action nodes from desktop or with the JSON endpoint action." /> : nodes.map((node) => <Card key={node.id}>
            <View style={styles.rowTop}><View style={styles.iconWrap}><Feather name="zap" size={16} color={colors.mutedForeground} /></View><View style={{ flex: 1 }}><Text style={[styles.itemTitle, { color: colors.foreground }]}>{node.name || `${node.type} node`}</Text><Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>Type: {node.type}</Text></View><Pressable onPress={() => simulateMutation.mutate(node.id)} style={({ pressed }) => [styles.smallButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.75 : 1 }]}><Text style={[styles.smallButtonText, { color: colors.primary }]}>Simulate</Text></Pressable></View>
            <View style={styles.actionRow}>
              <Pill label="Edit JSON" onPress={() => setJsonAction({ title: "Update node", description: "Patch this automation node with a JSON object.", initialJson: JSON.stringify(node, null, 2), submitLabel: "Update", run: (payload) => nodeActionMutation.mutate(() => apiCall((c) => updateAutomationNode(c, node.id, payload))) })} />
              <Pill label="Duplicate" onPress={() => nodeActionMutation.mutate(() => apiCall((c) => duplicateAutomationNode(c, node.id)))} />
              <Pill label="Move JSON" onPress={() => setJsonAction({ title: "Move node", description: "Enter the move payload Baserow expects for this node.", initialJson: "{\n  \"parent_node_id\": null\n}", submitLabel: "Move", run: (payload) => nodeActionMutation.mutate(() => apiCall((c) => moveAutomationNode(c, node.id, payload))) })} />
              <Pill label="Replace JSON" onPress={() => setJsonAction({ title: "Replace node", description: "Enter the replacement payload Baserow expects for this node.", initialJson: JSON.stringify({ type: node.type }, null, 2), submitLabel: "Replace", requiresJson: true, run: (payload) => nodeActionMutation.mutate(() => apiCall((c) => replaceAutomationNode(c, node.id, payload))) })} />
              <Pill label="Delete" destructive onPress={() => setJsonAction({ title: "Delete node", description: `Delete ${node.name || node.type}. Submit {} to confirm.`, initialJson: "{}", submitLabel: "Delete", destructive: true, run: () => nodeActionMutation.mutate(() => apiCall((c) => deleteAutomationNode(c, node.id))) })} />
            </View>
          </Card>)}
        </Section>

        <Section title="History" icon="clock">
          {history.length === 0 ? <EmptyState icon="clock" title="No runs yet" description="Workflow test and production runs will show up here." /> : history.map((item) => <Card key={item.id}><Text style={[styles.itemTitle, { color: colors.foreground }]}>{item.status || `Run #${item.id}`}</Text><Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>{item.started_on || item.finished_on || "No timestamp"}</Text></Card>)}
        </Section>
      </ScrollView>
    )}
    <JsonActionModal action={jsonAction} loading={nodeActionMutation.isPending} onClose={() => setJsonAction(null)} onSubmit={(payload) => jsonAction?.run(payload)} />
  </View>;
}

function Section({ title, icon, children }: { title: string; icon: keyof typeof Feather.glyphMap; children: React.ReactNode }) { const colors = useColors(); return <View style={styles.section}><View style={styles.sectionHeader}><Feather name={icon} size={16} color={colors.mutedForeground} /><Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text></View>{children}</View>; }
function Card({ children }: { children: React.ReactNode }) { const colors = useColors(); return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>{children}</View>; }
function Pill({ label, onPress, destructive }: { label: string; onPress: () => void; destructive?: boolean }) { const colors = useColors(); return <Pressable onPress={onPress} style={[styles.pill, { backgroundColor: destructive ? colors.destructive : colors.secondary }]}><Text style={[styles.pillText, { color: destructive ? colors.destructiveForeground : colors.primary }]}>{label}</Text></Pressable>; }

const styles = StyleSheet.create({ fill: { flex: 1 }, headerWrap: { paddingHorizontal: 20, paddingBottom: 8 }, crumb: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 4 }, title: { fontSize: 30, lineHeight: 36, fontFamily: "Inter_700Bold" }, subtitle: { marginTop: 6, fontSize: 14, fontFamily: "Inter_400Regular" }, buttonRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 }, section: { paddingHorizontal: 16, paddingTop: 18, gap: 10 }, sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 }, sectionTitle: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 0.7, textTransform: "uppercase" }, card: { borderWidth: 1, padding: 14, marginBottom: 10 }, rowTop: { flexDirection: "row", alignItems: "center", gap: 12 }, iconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" }, itemTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" }, itemMeta: { marginTop: 3, fontSize: 13, fontFamily: "Inter_400Regular" }, smallButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }, smallButtonText: { fontSize: 12, fontFamily: "Inter_700Bold" }, actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }, pill: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 }, pillText: { fontSize: 12, fontFamily: "Inter_700Bold" } });
