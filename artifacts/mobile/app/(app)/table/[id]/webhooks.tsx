import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Button } from "@/components/Button";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useAuth, useCreds } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import {
  createTableWebhook,
  deleteTableWebhook,
  listTableWebhooks,
  testTableWebhook,
  updateTableWebhook,
  type BaserowWebhook,
} from "@/lib/baserow";

export default function WebhooksScreen() {
  const colors = useColors();
  const creds = useCreds();
  const { apiCall } = useAuth();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id: string; tableName?: string }>();
  const tableId = Number(params.id);
  const tableName = params.tableName || "Table";

  const [modalOpen, setModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<BaserowWebhook | null>(null);
  const [webhookName, setWebhookName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");

  const webhooksQuery = useQuery({
    queryKey: ["webhooks", creds.baseUrl, tableId],
    queryFn: () => apiCall((c) => listTableWebhooks(c, tableId)),
    enabled: Number.isFinite(tableId),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<BaserowWebhook>) =>
      apiCall((c) => createTableWebhook(c, tableId, data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks", creds.baseUrl, tableId] });
      setModalOpen(false);
      resetForm();
    },
    onError: (err) => Alert.alert("Error", err instanceof Error ? err.message : "Failed to create webhook"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<BaserowWebhook> }) =>
      apiCall((c) => updateTableWebhook(c, id, data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks", creds.baseUrl, tableId] });
      setModalOpen(false);
      resetForm();
    },
    onError: (err) => Alert.alert("Error", err instanceof Error ? err.message : "Failed to update webhook"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiCall((c) => deleteTableWebhook(c, id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks", creds.baseUrl, tableId] });
    },
    onError: (err) => Alert.alert("Error", err instanceof Error ? err.message : "Failed to delete webhook"),
  });

  const testMutation = useMutation({
    mutationFn: (id: number) => apiCall((c) => testTableWebhook(c, tableId, id)),
    onSuccess: () => Alert.alert("Success", "Test webhook sent successfully"),
    onError: (err) => Alert.alert("Error", err instanceof Error ? err.message : "Failed to test webhook"),
  });

  const resetForm = () => {
    setEditingWebhook(null);
    setWebhookName("");
    setWebhookUrl("");
  };

  const handleEdit = (webhook: BaserowWebhook) => {
    setEditingWebhook(webhook);
    setWebhookName(webhook.name);
    setWebhookUrl(webhook.url);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!webhookUrl) {
      Alert.alert("Error", "URL is required");
      return;
    }

    const data = {
      name: webhookName || "New Webhook",
      url: webhookUrl,
      active: editingWebhook ? editingWebhook.active : true,
      events: editingWebhook ? editingWebhook.events : ["row.created", "row.updated", "row.deleted"],
      request_method: "POST",
    };

    if (editingWebhook) {
      updateMutation.mutate({ id: editingWebhook.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const confirmDelete = (id: number) => {
    Alert.alert("Delete Webhook", "Are you sure you want to delete this webhook?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  const toggleActive = (webhook: BaserowWebhook) => {
    updateMutation.mutate({ id: webhook.id, data: { active: !webhook.active } });
  };

  if (webhooksQuery.isLoading) return <LoadingState />;
  if (webhooksQuery.isError) {
    return (
      <ErrorState
        title="Could not load webhooks"
        message={webhooksQuery.error instanceof Error ? webhooksQuery.error.message : undefined}
        onRetry={() => webhooksQuery.refetch()}
      />
    );
  }

  const webhooks = webhooksQuery.data || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: `Webhooks: ${tableName}` }} />

      <FlatList
        data={webhooks}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyHeader={() => (
          <View style={styles.empty}>
            <Feather name="zap" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No webhooks configured for this table.
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: item.active ? 1 : 0.6,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {item.name}
                </Text>
                {!item.active && (
                  <View style={[styles.inactiveBadge, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.inactiveText, { color: colors.mutedForeground }]}>Inactive</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardActions}>
                <Pressable onPress={() => toggleActive(item)} style={styles.iconButton}>
                  <Feather
                    name={item.active ? "toggle-right" : "toggle-left"}
                    size={22}
                    color={item.active ? colors.primary : colors.mutedForeground}
                  />
                </Pressable>
                <Pressable onPress={() => handleEdit(item)} style={styles.iconButton}>
                  <Feather name="edit-2" size={18} color={colors.foreground} />
                </Pressable>
                <Pressable onPress={() => confirmDelete(item.id)} style={styles.iconButton}>
                  <Feather name="trash-2" size={18} color={colors.destructive} />
                </Pressable>
              </View>
            </View>

            <Text style={[styles.cardUrl, { color: colors.mutedForeground }]} numberOfLines={1}>
              {item.url}
            </Text>

            <View style={styles.cardFooter}>
              <View style={styles.eventList}>
                {item.events.slice(0, 3).map((event) => (
                  <View key={event} style={[styles.eventBadge, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.eventText, { color: colors.mutedForeground }]}>
                      {event.replace("row.", "")}
                    </Text>
                  </View>
                ))}
                {item.events.length > 3 && (
                  <Text style={[styles.moreEvents, { color: colors.mutedForeground }]}>
                    +{item.events.length - 3}
                  </Text>
                )}
              </View>
              <Pressable
                onPress={() => testMutation.mutate(item.id)}
                style={[styles.testButton, { backgroundColor: colors.muted }]}
              >
                {testMutation.isPending && testMutation.variables === item.id ? (
                  <ActivityIndicator size="small" color={colors.foreground} />
                ) : (
                  <>
                    <Feather name="play" size={12} color={colors.foreground} />
                    <Text style={[styles.testButtonText, { color: colors.foreground }]}>Test</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}
      />

      <View style={[styles.fab, { bottom: 20, right: 20 }]}>
        <Button
          title="Add Webhook"
          icon="plus"
          onPress={() => {
            resetForm();
            setModalOpen(true);
          }}
        />
      </View>

      <Modal
        visible={modalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {editingWebhook ? "Edit Webhook" : "Create Webhook"}
              </Text>
              <Pressable onPress={() => setModalOpen(false)}>
                <Feather name="x" size={24} color={colors.foreground} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                value={webhookName}
                onChangeText={setWebhookName}
                placeholder="e.g. Zapier Integration"
                placeholderTextColor={colors.mutedForeground}
              />

              <Text style={[styles.label, { color: colors.mutedForeground }]}>URL</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                value={webhookUrl}
                onChangeText={setWebhookUrl}
                placeholder="https://hooks.zapier.com/..."
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                keyboardType="url"
              />

              <View style={styles.infoBox}>
                <Feather name="info" size={16} color={colors.mutedForeground} />
                <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                  This webhook will be triggered on row creation, update, and deletion by default.
                </Text>
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setModalOpen(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title={editingWebhook ? "Update" : "Create"}
                onPress={handleSave}
                loading={createMutation.isPending || updateMutation.isPending}
                style={{ flex: 2 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
  inactiveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 6,
    marginLeft: 4,
  },
  cardUrl: {
    fontSize: 14,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eventList: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    flex: 1,
  },
  eventBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  eventText: {
    fontSize: 12,
  },
  moreEvents: {
    fontSize: 12,
    marginLeft: 4,
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  fab: {
    position: "absolute",
    left: 20,
    right: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalBody: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  infoText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  modalFooter: {
    flexDirection: "row",
    paddingTop: 16,
    borderTopWidth: 1,
  },
});
