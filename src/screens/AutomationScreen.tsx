import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { Endpoints } from "../api/endpoints";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";

type Props = { automationId: number; onBack?: () => void };

// Workflow node step types (simplified from Baserow automation schema)
const NODE_TYPES = ["trigger", "condition", "action"] as const;

export const AutomationScreen: React.FC<Props> = ({ automationId, onBack }) => {
  const { apiCall } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"workflows" | "nodes">("workflows");
  const [newName, setNewName] = useState("");

  // Fetch workflows
  const { data: workflows, isLoading } = useQuery({
    queryKey: ["workflows", automationId],
    queryFn: () => apiCall((c) => c.get(Endpoints.automation.workflowsList(automationId))),
  });

  // Create workflow
  const createWfMut = useMutation({
    mutationFn: (payload: any) => apiCall((c) => c.post(Endpoints.automation.workflowsCreate(automationId), payload)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["workflows", automationId] }); setNewName(""); },
  });

  // Delete workflow
  const deleteWfMut = useMutation({
    mutationFn: (id: number) => apiCall((c) => c.delete(Endpoints.automation.workflowDelete(id))),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["workflows", automationId] }); },
  });

  // Publish workflow
  const publishMut = useMutation({
    mutationFn: (id: number) => apiCall((c) => c.post(Endpoints.automation.workflowPublish(id))),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["workflows", automationId] }); Alert.alert("Published", "Workflow published successfully."); },
    onError: (e: any) => Alert.alert("Error", e?.message || "Failed to publish."),
  });

  // Fetch nodes for a workflow
  const [selectedWorkflow, setSelectedWorkflow] = useState<number | null>(null);
  const { data: nodes } = useQuery({
    queryKey: ["nodes", selectedWorkflow],
    queryFn: () => apiCall((c) => c.get(Endpoints.automation.nodesList(selectedWorkflow!))),
    enabled: !!selectedWorkflow,
  });

  // Create node
  const [newNodeType, setNewNodeType] = useState<typeof NODE_TYPES[number]>("action");
  const [nodeConfig, setNodeConfig] = useState("");
  const createNodeMut = useMutation({
    mutationFn: () => apiCall((c) => c.post(Endpoints.automation.nodesCreate(selectedWorkflow!), { type: newNodeType, config: nodeConfig })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["nodes", selectedWorkflow] }); setNodeConfig(""); },
  });

  // Delete node
  const deleteNodeMut = useMutation({
    mutationFn: (id: number) => apiCall((c) => c.delete(Endpoints.automation.nodesDelete(id))),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["nodes", selectedWorkflow] }); },
  });

  const wfList = Array.isArray(workflows) ? workflows : workflows?.results || [];
  const nodeList = Array.isArray(nodes) ? nodes : nodes?.results || [];

  return (
    <View style={s.container}>
      <TouchableOpacity onPress={onBack}><Text style={s.backText}>← Back</Text></TouchableOpacity>
      <Text style={s.title}>Automation</Text>

      {/* Tab switcher */}
      <View style={s.tabs}>
        {(["workflows", "nodes"] as const).map((t) => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "workflows" ? (
        <>
          {/* Create workflow */}
          <View style={s.form}>
            <TextInput style={s.input} placeholder="New workflow name" value={newName} onChangeText={setNewName} />
            <TouchableOpacity style={[s.btn, createWfMut. isPending && s.disabled]} onPress={() => createWfMut.mutate({ name: newName })} disabled={createWfMut.isPending}>
              {createWfMut.isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create Workflow</Text>}
            </TouchableOpacity>
          </View>

          {/* Workflow list */}
          {isLoading ? <ActivityIndicator size="large" style={s.loader} /> : (
            <FlatList
              data={wfList}
              keyExtractor={(item: any) => String(item.id)}
              renderItem={({ item }: { item: any }) => (
                <View style={s.item}>
                  <View style={s.info}>
                    <Text style={s.itemName}>{item.name || "Workflow"}</Text>
                    <Text style={s.meta}>
                      {item.is_active ? "Active" : "Draft"} · {item.published_at ? `Published ${new Date(item.published_at).toLocaleDateString()}` : "Not published"}
                    </Text>
                  </View>
                  <View style={s.actions}>
                    <TouchableOpacity onPress={() => { setSelectedWorkflow(item.id); setTab("nodes"); }}>
                      <Text style={s.actionText}>Nodes</Text>
                    </TouchableOpacity>
                    {!item.published_at && (
                      <TouchableOpacity onPress={() => publishMut.mutate(item.id)} disabled={publishMut.isPending}>
                        <Text style={s.actionText}>Publish</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => Alert.alert("Delete Workflow", `Delete "${item.name}"?`, [
                      { text: "Cancel", style: "cancel" },
                      { text: "Delete", style: "destructive", onPress: () => deleteWfMut.mutate(item.id) },
                    ])}>
                      <Text style={s.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={s.empty}>No workflows yet.</Text>}
            />
          )}
        </>
      ) : (
        <>
          {/* Node creator — only active when a workflow is selected */}
          {!selectedWorkflow ? (
            <Text style={s.empty}>Select a workflow above to manage its nodes.</Text>
          ) : (
            <View style={s.form}>
              <Text style={s.sectionTitle}>Add Node to Workflow #{selectedWorkflow}</Text>
              <View style={s.row}>
                {NODE_TYPES.map((t) => (
                  <TouchableOpacity key={t} style={[s.chip, newNodeType === t && s.chipActive]} onPress={() => setNewNodeType(t)}>
                    <Text style={[s.chipText, newNodeType === t && s.chipTextActive]}>{t.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={s.input} placeholder='{"key": "value"}' value={nodeConfig} onChangeText={setNodeConfig} autoCapitalize="none" />
              <TouchableOpacity style={[s.btn, createNodeMut.isPending && s.disabled]} onPress={() => createNodeMut.mutate()} disabled={createNodeMut.isPending}>
                {createNodeMut.isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Add Node</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Node list */}
          {selectedWorkflow && (
            <FlatList
              data={nodeList}
              keyExtractor={(item: any) => String(item.id)}
              renderItem={({ item }: { item: any }) => (
                <View style={s.item}>
                  <View style={s.info}>
                    <Text style={s.itemName}>Node #{item.id}</Text>
                    <Text style={s.meta}>{item.type} · {item.status || "unknown"}</Text>
                  </View>
                  <TouchableOpacity onPress={() => Alert.alert("Delete Node", `Delete node #${item.id}?`, [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => deleteNodeMut.mutate(item.id) },
                  ])}>
                    <Text style={s.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={<Text style={s.empty}>No nodes in this workflow.</Text>}
            />
          )}
        </>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  backText: { color: "#007AFF", fontSize: 16, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "600", marginBottom: 12 },
  tabs: { flexDirection: "row", marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: "#007AFF" },
  tabText: { color: "#666", fontSize: 15 },
  tabTextActive: { color: "#007AFF", fontWeight: "600" },
  form: { padding: 12, backgroundColor: "#f5f5f5", borderRadius: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "600", marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 6, padding: 10, fontSize: 15, marginBottom: 8 },
  row: { flexDirection: "row", marginBottom: 8, gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, backgroundColor: "#ddd" },
  chipActive: { backgroundColor: "#007AFF" },
  chipText: { fontSize: 12, color: "#333" },
  chipTextActive: { color: "#fff" },
  btn: { backgroundColor: "#007AFF", padding: 12, borderRadius: 6, alignItems: "center" },
  disabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  loader: { marginTop: 40 },
  item: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  info: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: "500" },
  meta: { fontSize: 12, color: "#666", marginTop: 2 },
  actions: { flexDirection: "row", gap: 12 },
  actionText: { color: "#007AFF", fontSize: 14 },
  deleteText: { color: "#ff3b30", fontSize: 14 },
  empty: { textAlign: "center", color: "#999", marginTop: 20 },
});

export default AutomationScreen;