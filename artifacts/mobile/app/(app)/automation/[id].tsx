import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { JsonActionModal, type JsonAction } from "@/components/JsonActionModal";
import { LoadingState } from "@/components/LoadingState";
import { useAuth, useCreds } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";
import {
  createAutomationWorkflow,
  deleteAutomationWorkflow,
  duplicateAutomationWorkflowAsync,
  listApplications,
  orderAutomationWorkflows,
  updateAutomationWorkflow,
  type BaserowAutomationWorkflow,
} from "@/lib/baserow";

export default function AutomationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const creds = useCreds();
  const { apiCall } = useAuth();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id: string; name?: string }>();
  const automationId = Number(params.id);
  const fallbackName = params.name || "Automation";
  const [createOpen, setCreateOpen] = useState(false);
  const [workflowName, setWorkflowName] = useState("Untitled workflow");
  const [jsonAction, setJsonAction] = useState<(JsonAction & { run: (payload: Record<string, unknown>) => void }) | null>(null);

  const appsQuery = useQuery({
    queryKey: ["applications", creds.baseUrl, creds.user.id],
    queryFn: () => apiCall((c) => listApplications(c)),
  });

  const automation = useMemo(() => (appsQuery.data ?? []).find((app) => app.id === automationId), [appsQuery.data, automationId]);
  const workflows = ((automation?.workflows ?? []) as BaserowAutomationWorkflow[]).slice().sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
  const automationName = automation?.name || fallbackName;
  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16) + 24;

  const createMutation = useMutation({
    mutationFn: (name: string) => apiCall((c) => createAutomationWorkflow(c, automationId, { name: name.trim() || "Untitled workflow" })),
    onSuccess: async (workflow) => {
      await queryClient.invalidateQueries({ queryKey: ["applications", creds.baseUrl, creds.user.id] });
      setCreateOpen(false);
      setWorkflowName("Untitled workflow");
      router.push({ pathname: "/(app)/automation/workflow/[id]", params: { id: String(workflow.id), name: workflow.name, automation: automationName } });
    },
    onError: (error) => Alert.alert("Could not create workflow", error instanceof Error ? error.message : "Please try again."),
  });

  const workflowActionMutation = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: async () => {
      setJsonAction(null);
      await queryClient.invalidateQueries({ queryKey: ["applications", creds.baseUrl, creds.user.id] });
    },
    onError: (error) => Alert.alert("Workflow action failed", error instanceof Error ? error.message : "Please try again."),
  });

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: automationName }} />
      {appsQuery.isLoading ? <LoadingState /> : appsQuery.isError ? (
        <ErrorState title="Could not load automation" message={appsQuery.error instanceof Error ? appsQuery.error.message : undefined} onRetry={() => appsQuery.refetch()} />
      ) : !automation ? (
        <EmptyState icon="cpu" title="Automation not found" description="It may have been removed. Pull to refresh." />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: bottomPad, paddingTop: 12 }} refreshControl={<RefreshControl refreshing={appsQuery.isRefetching} onRefresh={() => appsQuery.refetch()} tintColor={colors.primary} />}>
          <View style={styles.headerWrap}>
            <Text style={[styles.crumb, { color: colors.mutedForeground }]}>Automation</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>{automationName}</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{workflows.length} {workflows.length === 1 ? "workflow" : "workflows"}</Text>
            <View style={styles.headerButtonRow}>
              <Button title="New workflow" onPress={() => setCreateOpen(true)} />
              <Button
                title="Create workflow JSON"
                variant="secondary"
                onPress={() =>
                  setJsonAction({
                    title: "Create automation workflow",
                    description: "Enter the exact workflow payload Baserow expects. This exposes the desktop API for workflow creation.",
                    initialJson: '{\n  "name": "Untitled workflow"\n}',
                    submitLabel: "Create",
                    requiresJson: true,
                    run: (payload) =>
                      workflowActionMutation.mutate(() =>
                        apiCall((c) => createAutomationWorkflow(c, automationId, payload)),
                      ),
                  })
                }
              />
              {workflows.length > 1 ? (
                <Button
                  title="Save current order"
                  variant="secondary"
                  onPress={() =>
                    workflowActionMutation.mutate(() =>
                      apiCall((c) =>
                        orderAutomationWorkflows(
                          c,
                          automationId,
                          workflows.map((workflow) => workflow.id),
                        ),
                      ),
                    )
                  }
                />
              ) : null}
            </View>
          </View>

          {workflows.length === 0 ? (
            <View style={{ paddingTop: 32 }}>
              <EmptyState icon="git-branch" title="No workflows yet" description="Create a workflow on mobile, then add nodes and test/publish it from the workflow screen." />
              <View style={styles.emptyActionWrap}><Button title="Create workflow" onPress={() => setCreateOpen(true)} /></View>
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              {workflows.map((workflow, idx) => (
                <View key={workflow.id} style={{ borderTopColor: colors.border, borderTopWidth: idx === 0 ? 0 : 1 }}>
                <Pressable onPress={() => router.push({ pathname: "/(app)/automation/workflow/[id]", params: { id: String(workflow.id), name: workflow.name, automation: automationName } })} style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.surface : "transparent" }]}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.muted }]}><Feather name="git-branch" size={16} color={colors.mutedForeground} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, { color: colors.foreground }]}>{workflow.name}</Text>
                    <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>{workflow.published ? "Published" : workflow.state || "Draft"}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                </Pressable>
                <View style={[styles.workflowActions, { borderTopColor: colors.border }]}>
                  <Pressable
                    onPress={() =>
                      setJsonAction({
                        title: "Update workflow",
                        description: "Patch this workflow with a JSON object.",
                        initialJson: JSON.stringify(workflow, null, 2),
                        submitLabel: "Update",
                        run: (payload) =>
                          workflowActionMutation.mutate(() =>
                            apiCall((c) => updateAutomationWorkflow(c, workflow.id, payload)),
                          ),
                      })
                    }
                    style={[styles.pill, { backgroundColor: colors.secondary }]}
                  >
                    <Text style={[styles.pillText, { color: colors.primary }]}>Edit JSON</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      workflowActionMutation.mutate(() =>
                        apiCall((c) => duplicateAutomationWorkflowAsync(c, workflow.id)),
                      )
                    }
                    style={[styles.pill, { backgroundColor: colors.secondary }]}
                  >
                    <Text style={[styles.pillText, { color: colors.primary }]}>Duplicate</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      setJsonAction({
                        title: "Delete workflow",
                        description: `Delete “${workflow.name}”. Submit {} to confirm.`,
                        initialJson: "{}",
                        submitLabel: "Delete",
                        destructive: true,
                        run: () =>
                          workflowActionMutation.mutate(() =>
                            apiCall((c) => deleteAutomationWorkflow(c, workflow.id)),
                          ),
                      })
                    }
                    style={[styles.pill, { backgroundColor: colors.destructive }]}
                  >
                    <Text style={[styles.pillText, { color: colors.destructiveForeground }]}>Delete</Text>
                  </Pressable>
                </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <Modal visible={createOpen} transparent animationType="fade" onRequestClose={() => setCreateOpen(false)}>
        <Pressable style={[styles.modalBackdrop, { backgroundColor: "rgba(15, 23, 42, 0.4)" }]} onPress={() => setCreateOpen(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Create workflow</Text>
            <TextInput value={workflowName} onChangeText={setWorkflowName} autoFocus style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
            <View style={styles.modalActions}><Button title="Cancel" variant="secondary" onPress={() => setCreateOpen(false)} /><Button title="Create" onPress={() => createMutation.mutate(workflowName)} loading={createMutation.isPending} /></View>
          </Pressable>
        </Pressable>
      </Modal>
      <JsonActionModal
        action={jsonAction}
        loading={workflowActionMutation.isPending}
        onClose={() => setJsonAction(null)}
        onSubmit={(payload) => jsonAction?.run(payload)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 }, headerWrap: { paddingHorizontal: 20, paddingBottom: 8 }, crumb: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 4 }, title: { fontSize: 30, lineHeight: 36, fontFamily: "Inter_700Bold" }, subtitle: { marginTop: 6, fontSize: 14, fontFamily: "Inter_400Regular" }, headerButtonRow: { marginTop: 16, alignItems: "flex-start", gap: 10 }, emptyActionWrap: { alignItems: "center", marginTop: 16 }, card: { borderWidth: 1, marginHorizontal: 16, overflow: "hidden" }, row: { minHeight: 68, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 12 }, iconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" }, itemTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" }, itemMeta: { marginTop: 3, fontSize: 13, fontFamily: "Inter_400Regular" }, workflowActions: { borderTopWidth: 1, flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 14, paddingBottom: 12 }, pill: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 }, pillText: { fontSize: 12, fontFamily: "Inter_700Bold" }, modalBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }, modalCard: { width: "100%", maxWidth: 420, borderWidth: 1, padding: 18 }, modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 12 }, input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontFamily: "Inter_400Regular" }, modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16 },
});
