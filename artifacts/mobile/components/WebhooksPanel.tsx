import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { useCreds } from "@/contexts/AuthContext";
import {
  useWebhooks,
  WEBHOOK_EVENTS,
  type BaserowWebhook,
} from "@/hooks/useWebhooks";
import { useColors } from "@/hooks/useColors";

interface WebhooksPanelProps {
  tableId: number;
  visible: boolean;
  onClose: () => void;
}

export function WebhooksPanel({
  tableId,
  visible,
  onClose,
}: WebhooksPanelProps) {
  const colors = useColors();
  const creds = useCreds();
  const webhooksQuery = useWebhooks(tableId);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const webhooks = webhooksQuery.data ?? [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Webhooks
          </Text>
          <View style={styles.headerActions}>
            <Button
              title="+ New"
              onPress={() => setCreateModalOpen(true)}
              style={styles.newButton}
            />
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>
                Done
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Content */}
        {webhooksQuery.isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : webhooks.length === 0 ? (
          <EmptyState
            icon="send"
            title="No webhooks"
            description="Add a webhook to receive notifications when table data changes"
          />
        ) : (
          <FlatList
            data={webhooks}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <WebhookCard webhook={item} colors={colors} />
            )}
          />
        )}

        {/* Create Modal */}
        <CreateWebhookModal
          visible={createModalOpen}
          tableId={tableId}
          onClose={() => setCreateModalOpen(false)}
          onCreated={() => {
            setCreateModalOpen(false);
            webhooksQuery.refetch();
          }}
        />
      </View>
    </Modal>
  );
}

function WebhookCard({
  webhook,
  colors,
}: {
  webhook: BaserowWebhook;
  colors: any;
}) {
  return (
    <View
      style={[
        styles.webhookCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: webhook.is_active ? 1 : 0.6,
        },
      ]}
    >
      <View style={styles.webhookHeader}>
        <View style={styles.webhookTitleRow}>
          <Text style={[styles.webhookName, { color: colors.foreground }]}>
            {webhook.name}
          </Text>
          <View
            style={[
              styles.activeBadge,
              {
                backgroundColor: webhook.is_active ? "#22c55e" : colors.muted,
              },
            ]}
          >
            <Text style={styles.activeBadgeText}>
              {webhook.is_active ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>
        <Text
          style={[styles.webhookUrl, { color: colors.mutedForeground }]}
          numberOfLines={1}
        >
          {webhook.url}
        </Text>
      </View>

      <View style={styles.eventsContainer}>
        <Text style={[styles.eventsLabel, { color: colors.mutedForeground }]}>
          Events
        </Text>
        <View style={styles.eventTags}>
          {webhook.events.map((event) => (
            <View
              key={event}
              style={[styles.eventTag, { backgroundColor: colors.muted }]}
            >
              <Text style={[styles.eventTagText, { color: colors.foreground }]}>
                {event}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function CreateWebhookModal({
  visible,
  tableId,
  onClose,
  onCreated,
}: {
  visible: boolean;
  tableId: number;
  onClose: () => void;
  onCreated: () => void;
}) {
  const colors = useColors();
  const creds = useCreds();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["row.created"]);
  const [includeRowData, setIncludeRowData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !url.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${creds.baseUrl}/api/database/webhooks/table/${tableId}/`,
        {
          method: "POST",
          headers: {
            Authorization: `JWT ${creds.jwt}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            url: url.trim(),
            events: selectedEvents,
            is_active: true,
            include_row_data: includeRowData,
          }),
        }
      );

      if (response.ok) {
        setName("");
        setUrl("");
        setSelectedEvents(["row.created"]);
        onCreated();
      } else {
        Alert.alert("Error", "Failed to create webhook");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to create webhook");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose}>
            <Text style={[styles.cancelButton, { color: colors.mutedForeground }]}>
              Cancel
            </Text>
          </Pressable>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            New Webhook
          </Text>
          <Pressable onPress={handleCreate} disabled={isSubmitting}>
            <Text
              style={[
                styles.createButton,
                { color: isSubmitting ? colors.muted : colors.primary },
              ]}
            >
              {isSubmitting ? "Creating..." : "Create"}
            </Text>
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Name */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
              Name *
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="My Webhook"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* URL */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
              URL *
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="https://example.com/webhook"
              placeholderTextColor={colors.mutedForeground}
              value={url}
              onChangeText={setUrl}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          {/* Events */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
              Events
            </Text>
            <View style={styles.eventsList}>
              {WEBHOOK_EVENTS.map((event) => (
                <Pressable
                  key={event.value}
                  onPress={() => toggleEvent(event.value)}
                  style={[
                    styles.eventOption,
                    {
                      backgroundColor: selectedEvents.includes(event.value)
                        ? colors.primary
                        : colors.surface,
                      borderColor: selectedEvents.includes(event.value)
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.eventOptionText,
                      {
                        color: selectedEvents.includes(event.value)
                          ? colors.primaryForeground
                          : colors.foreground,
                      },
                    ]}
                  >
                    {event.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Options */}
          <View style={styles.field}>
            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.foreground }]}>
                Include Row Data
              </Text>
              <Switch
                value={includeRowData}
                onValueChange={setIncludeRowData}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  newButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeButton: {
    fontSize: 16,
    fontWeight: "500",
  },
  list: {
    padding: 16,
    gap: 12,
  },
  webhookCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  webhookHeader: {
    marginBottom: 10,
  },
  webhookTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  webhookName: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  webhookUrl: {
    fontSize: 12,
  },
  eventsContainer: {},
  eventsLabel: {
    fontSize: 11,
    marginBottom: 6,
  },
  eventTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  eventTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  eventTagText: {
    fontSize: 11,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  cancelButton: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  createButton: {
    fontSize: 16,
    fontWeight: "500",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  field: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  eventsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  eventOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  eventOptionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchLabel: {
    fontSize: 15,
  },
});
