import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
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
  type BaserowAutomationNode,
} from "@/lib/baserow";

type NodeKind = "trigger" | "action";

type NodeOption = {
  type: string;
  kind: NodeKind;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  description: string;
  needsTable?: boolean;
  needsRow?: boolean;
  needsUrl?: boolean;
  needsPayload?: boolean;
};

type NodeFormState = {
  type: string;
  name: string;
  tableId: string;
  rowId: string;
  previousNodeId: string;
  url: string;
  fieldValuesJson: string;
  payloadJson: string;
};

const NODE_OPTIONS: NodeOption[] = [
  {
    type: "local_baserow_rows_created",
    kind: "trigger",
    label: "Rows created",
    icon: "plus-square",
    description: "Trigger when records are created in a Baserow table.",
    needsTable: true,
  },
  {
    type: "local_baserow_rows_updated",
    kind: "trigger",
    label: "Rows updated",
    icon: "edit-3",
    description: "Trigger when records are updated in a Baserow table.",
    needsTable: true,
  },
  {
    type: "webhook",
    kind: "trigger",
    label: "Webhook",
    icon: "radio",
    description: "Start a workflow from an incoming webhook-style event.",
    needsPayload: true,
  },
  {
    type: "local_baserow_create_row",
    kind: "action",
    label: "Create row",
    icon: "plus-circle",
    description: "Create a row in a Baserow table.",
    needsTable: true,
    needsPayload: true,
  },
  {
    type: "local_baserow_update_row",
    kind: "action",
    label: "Update row",
    icon: "edit",
    description: "Update an existing row in a Baserow table.",
    needsTable: true,
    needsRow: true,
    needsPayload: true,
  },
  {
    type: "local_baserow_delete_row",
    kind: "action",
    label: "Delete row",
    icon: "trash-2",
    description: "Delete an existing row in a Baserow table.",
    needsTable: true,
    needsRow: true,
  },
  {
    type: "http_request",
    kind: "action",
    label: "HTTP request",
    icon: "send",
    description: "Call an external service from the workflow.",
    needsUrl: true,
    needsPayload: true,
  },
];

const NODE_OPTION_BY_TYPE = new Map(NODE_OPTIONS.map((option) => [option.type, option]));

function historyItems(
  data: BaserowAutomationHistoryItem[] | { results?: BaserowAutomationHistoryItem[] } | undefined,
) {
  if (!data) return [];
  return Array.isArray(data) ? data : data.results ?? [];
}

function optionForNodeType(type: string) {
  return NODE_OPTION_BY_TYPE.get(type) ?? NODE_OPTIONS[0];
}

function blankNodeForm(nodes: BaserowAutomationNode[]): NodeFormState {
  return {
    type: NODE_OPTIONS[0].type,
    name: NODE_OPTIONS[0].label,
    tableId: "",
    rowId: "",
    previousNodeId: nodes.at(-1)?.id ? String(nodes.at(-1)?.id) : "",
    url: "",
    fieldValuesJson: "{}",
    payloadJson: "{}",
  };
}

function parseOptionalObjectJson(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = JSON.parse(trimmed) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return parsed as Record<string, unknown>;
}

function parsePositiveInteger(value: string, label: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${label} must be a positive whole number.`);
  }
  return parsed;
}

function buildNodePayload(form: NodeFormState) {
  const option = optionForNodeType(form.type);
  const payload: Record<string, unknown> = {
    type: form.type,
    name: form.name.trim() || option.label,
  };

  const tableId = parsePositiveInteger(form.tableId, "Table ID");
  const rowId = parsePositiveInteger(form.rowId, "Row ID");
  const previousNodeId = parsePositiveInteger(form.previousNodeId, "Previous node");

  if (option.needsTable) {
    if (!tableId) throw new Error("Add a table ID for this node.");
    payload.table_id = tableId;
  } else if (tableId) {
    payload.table_id = tableId;
  }

  if (option.needsRow) {
    if (!rowId) throw new Error("Add a row ID for this node.");
    payload.row_id = rowId;
  } else if (rowId) {
    payload.row_id = rowId;
  }

  if (previousNodeId) payload.previous_node_id = previousNodeId;

  if (option.needsUrl) {
    const url = form.url.trim();
    if (!/^https?:\/\//i.test(url)) {
      throw new Error("URL must start with http:// or https://.");
    }
    payload.url = url;
  }

  const fieldValues = parseOptionalObjectJson(form.fieldValuesJson, "Field values");
  if (fieldValues && Object.keys(fieldValues).length > 0) {
    payload.field_values = fieldValues;
  }

  const customPayload = parseOptionalObjectJson(form.payloadJson, "Payload JSON");
  if (customPayload && Object.keys(customPayload).length > 0) {
    Object.assign(payload, customPayload);
  }

  return payload;
}

function validateNodeForm(form: NodeFormState) {
  try {
    buildNodePayload(form);
  } catch (error) {
    return error instanceof Error ? error.message : "Check the node configuration.";
  }
  return null;
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
  const [jsonAction, setJsonAction] = React.useState<
    (JsonAction & { run: (payload: Record<string, unknown>) => void }) | null
  >(null);
  const [nodeForm, setNodeForm] = React.useState<NodeFormState | null>(null);

  const workflowQuery = useQuery({
    queryKey: ["automationWorkflow", workflowId],
    queryFn: () => apiCall((c) => getAutomationWorkflow(c, workflowId)),
  });
  const nodesQuery = useQuery({
    queryKey: ["automationWorkflow", workflowId, "nodes"],
    queryFn: () => apiCall((c) => listAutomationNodes(c, workflowId)),
  });
  const historyQuery = useQuery({
    queryKey: ["automationWorkflow", workflowId, "history"],
    queryFn: () => apiCall((c) => getAutomationWorkflowHistory(c, workflowId)),
  });

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
      setNodeForm(null);
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
            <Button title="New node" onPress={() => setNodeForm(blankNodeForm(nodes))} />
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
          {nodes.length === 0 ? (
            <View style={styles.emptyBlock}>
              <EmptyState icon="git-branch" title="No nodes" description="Add trigger/action nodes with the guided mobile picker or the advanced JSON action." />
              <Button title="Create first node" onPress={() => setNodeForm(blankNodeForm(nodes))} />
            </View>
          ) : nodes.map((node) => <Card key={node.id}>
            <View style={styles.rowTop}><View style={styles.iconWrap}><Feather name="zap" size={16} color={colors.mutedForeground} /></View><View style={{ flex: 1 }}><Text style={[styles.itemTitle, { color: colors.foreground }]}>{node.name || `${node.type} node`}</Text><Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>Type: {node.type}</Text></View><Pressable onPress={() => simulateMutation.mutate(node.id)} style={({ pressed }) => [styles.smallButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.75 : 1 }]}><Text style={[styles.smallButtonText, { color: colors.primary }]}>Simulate</Text></Pressable></View>
            <NodeSummary node={node} />
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
    <NodeFormModal
      form={nodeForm}
      nodes={nodes}
      loading={nodeActionMutation.isPending}
      onClose={() => setNodeForm(null)}
      onChange={setNodeForm}
      onSubmit={(payload) => nodeActionMutation.mutate(() => apiCall((c) => createAutomationNode(c, workflowId, payload)))}
    />
    <JsonActionModal action={jsonAction} loading={nodeActionMutation.isPending} onClose={() => setJsonAction(null)} onSubmit={(payload) => jsonAction?.run(payload)} />
  </View>;
}

function NodeSummary({ node }: { node: BaserowAutomationNode }) {
  const colors = useColors();
  const option = optionForNodeType(node.type);
  return (
    <View style={[styles.nodeSummary, { borderColor: colors.border }]}> 
      <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{option.kind}</Text>
      <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>{option.description}</Text>
      {node.table_id ? <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>Table ID: {String(node.table_id)}</Text> : null}
    </View>
  );
}

function NodeFormModal({
  form,
  nodes,
  loading,
  onClose,
  onChange,
  onSubmit,
}: {
  form: NodeFormState | null;
  nodes: BaserowAutomationNode[];
  loading?: boolean;
  onClose: () => void;
  onChange: (form: NodeFormState | null) => void;
  onSubmit: (payload: Record<string, unknown>) => void;
}) {
  const colors = useColors();
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => setError(null), [form]);
  if (!form) return null;
  const option = optionForNodeType(form.type);
  const update = (patch: Partial<NodeFormState>) => {
    const next = { ...form, ...patch };
    if (patch.type) {
      const selected = optionForNodeType(patch.type);
      next.name = selected.label;
    }
    onChange(next);
    setError(null);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.modalBackdrop, { backgroundColor: "rgba(15, 23, 42, 0.45)" }]} onPress={onClose}>
        <Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}> 
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Create automation node</Text>
          <Text style={[styles.modalDescription, { color: colors.mutedForeground }]}>Pick a trigger or action, then fill the native fields for common Baserow node payloads.</Text>
          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Trigger/action</Text>
            <View style={styles.optionGrid}>
              {NODE_OPTIONS.map((nodeOption) => {
                const selected = nodeOption.type === form.type;
                return (
                  <Pressable
                    key={nodeOption.type}
                    onPress={() => update({ type: nodeOption.type })}
                    style={[styles.optionCard, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.secondary : colors.background }]}
                  >
                    <Feather name={nodeOption.icon} size={16} color={selected ? colors.primary : colors.mutedForeground} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionTitle, { color: colors.foreground }]}>{nodeOption.label}</Text>
                      <Text style={[styles.optionMeta, { color: colors.mutedForeground }]}>{nodeOption.kind} · {nodeOption.description}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <FormInput label="Name" value={form.name} onChangeText={(name) => update({ name })} />
            {option.needsTable ? <FormInput label="Table ID" value={form.tableId} onChangeText={(tableId) => update({ tableId })} keyboardType="number-pad" /> : null}
            {option.needsRow ? <FormInput label="Row ID" value={form.rowId} onChangeText={(rowId) => update({ rowId })} keyboardType="number-pad" /> : null}
            {option.needsUrl ? <FormInput label="Request URL" value={form.url} onChangeText={(url) => update({ url })} autoCapitalize="none" placeholder="https://example.com/webhook" /> : null}
            <View style={styles.formBlock}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Previous node</Text>
              <View style={styles.optionGrid}>
                <Pressable onPress={() => update({ previousNodeId: "" })} style={[styles.optionCard, { borderColor: !form.previousNodeId ? colors.primary : colors.border, backgroundColor: !form.previousNodeId ? colors.secondary : colors.background }]}>
                  <Feather name="corner-up-right" size={16} color={!form.previousNodeId ? colors.primary : colors.mutedForeground} />
                  <Text style={[styles.optionTitle, { color: colors.foreground }]}>Start of workflow</Text>
                </Pressable>
                {nodes.map((node) => (
                  <Pressable key={node.id} onPress={() => update({ previousNodeId: String(node.id) })} style={[styles.optionCard, { borderColor: form.previousNodeId === String(node.id) ? colors.primary : colors.border, backgroundColor: form.previousNodeId === String(node.id) ? colors.secondary : colors.background }]}>
                    <Feather name="git-commit" size={16} color={form.previousNodeId === String(node.id) ? colors.primary : colors.mutedForeground} />
                    <View style={{ flex: 1 }}><Text style={[styles.optionTitle, { color: colors.foreground }]}>{node.name || node.type}</Text><Text style={[styles.optionMeta, { color: colors.mutedForeground }]}>#{node.id}</Text></View>
                  </Pressable>
                ))}
              </View>
            </View>
            {option.needsPayload ? <FormInput label="Field values JSON" value={form.fieldValuesJson} onChangeText={(fieldValuesJson) => update({ fieldValuesJson })} multiline /> : null}
            <FormInput label="Advanced payload JSON" value={form.payloadJson} onChangeText={(payloadJson) => update({ payloadJson })} multiline />
          </ScrollView>
          {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}
          <View style={styles.modalActions}>
            <Button title="Cancel" variant="secondary" onPress={onClose} />
            <Button
              title="Create"
              loading={loading}
              onPress={() => {
                const validation = validateNodeForm(form);
                if (validation) {
                  setError(validation);
                  return;
                }
                onSubmit(buildNodePayload(form));
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
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "number-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  const colors = useColors();
  return <View style={styles.formBlock}><Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} multiline={multiline} keyboardType={keyboardType} autoCapitalize={autoCapitalize} style={[styles.input, multiline ? styles.multilineInput : null, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /></View>;
}

function Section({ title, icon, children }: { title: string; icon: keyof typeof Feather.glyphMap; children: React.ReactNode }) { const colors = useColors(); return <View style={styles.section}><View style={styles.sectionHeader}><Feather name={icon} size={16} color={colors.mutedForeground} /><Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text></View>{children}</View>; }
function Card({ children }: { children: React.ReactNode }) { const colors = useColors(); return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>{children}</View>; }
function Pill({ label, onPress, destructive }: { label: string; onPress: () => void; destructive?: boolean }) { const colors = useColors(); return <Pressable onPress={onPress} style={[styles.pill, { backgroundColor: destructive ? colors.destructive : colors.secondary }]}><Text style={[styles.pillText, { color: destructive ? colors.destructiveForeground : colors.primary }]}>{label}</Text></Pressable>; }

const styles = StyleSheet.create({
  fill: { flex: 1 },
  headerWrap: { paddingHorizontal: 20, paddingBottom: 8 },
  crumb: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 4 },
  title: { fontSize: 30, lineHeight: 36, fontFamily: "Inter_700Bold" },
  subtitle: { marginTop: 6, fontSize: 14, fontFamily: "Inter_400Regular" },
  buttonRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 },
  emptyBlock: { gap: 14, paddingHorizontal: 20, paddingTop: 20 },
  section: { paddingHorizontal: 16, paddingTop: 18, gap: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 0.7, textTransform: "uppercase" },
  card: { borderWidth: 1, padding: 14, marginBottom: 10 },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  itemTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  itemMeta: { marginTop: 3, fontSize: 13, fontFamily: "Inter_400Regular" },
  smallButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  smallButtonText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  pill: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 },
  pillText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  nodeSummary: { borderTopWidth: 1, marginTop: 12, paddingTop: 12, gap: 4 },
  summaryLabel: { fontSize: 11, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.6 },
  summaryText: { fontSize: 13, lineHeight: 18, fontFamily: "Inter_400Regular" },
  modalBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 18 },
  modalCard: { width: "100%", maxWidth: 620, maxHeight: "90%", borderWidth: 1, padding: 18 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  modalDescription: { marginTop: 6, fontSize: 13, lineHeight: 19, fontFamily: "Inter_400Regular" },
  modalScroll: { marginTop: 14, maxHeight: 560 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16 },
  optionGrid: { gap: 8, marginBottom: 12 },
  optionCard: { flexDirection: "row", gap: 10, borderWidth: 1, borderRadius: 14, padding: 12 },
  optionTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  optionMeta: { marginTop: 2, fontSize: 12, lineHeight: 16, fontFamily: "Inter_400Regular" },
  formBlock: { marginTop: 12, gap: 6 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  input: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular" },
  multilineInput: { minHeight: 104, textAlignVertical: "top" },
  errorText: { marginTop: 10, fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
