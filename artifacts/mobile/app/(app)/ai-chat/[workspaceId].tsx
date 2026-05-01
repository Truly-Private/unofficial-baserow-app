import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useCreds } from "../../../contexts/AuthContext";
import {
  listAssistantChats,
  listAssistantMessages,
  sendAssistantMessage,
  sendAssistantMessageSimple,
  type AssistantChat,
  type AssistantMessage,
} from "../../../lib/baserow";

// Confirmation modal props
type ConfirmModalProps = {
  visible: boolean;
  title: string;
  fields: { name: string; value: string }[];
  tableName: string;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit: () => void;
};

function ConfirmModal({ visible, title, fields, tableName, onConfirm, onCancel, onEdit }: ConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Create {tableName}?</Text>
          <Text style={styles.modalSubtitle}>{title}</Text>

          <ScrollView style={styles.modalFields}>
            {fields.map((field, idx) => (
              <View key={idx} style={styles.fieldRow}>
                <Text style={styles.fieldName}>{field.name}</Text>
                <Text style={styles.fieldValue}>{field.value || "(empty)"}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalBtnCancel} onPress={onCancel}>
              <Text style={styles.modalBtnTextCancel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalBtnEdit} onPress={onEdit}>
              <Text style={styles.modalBtnTextEdit}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalBtnConfirm} onPress={onConfirm}>
              <Text style={styles.modalBtnTextConfirm}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ErrorBanner({ error, onDismiss }: { error: string; onDismiss: () => void }) {
  // Determine error type and appropriate message
  let displayError = error;
  let isRetryable = false;

  if (error.includes("404") || error.includes("not found")) {
    displayError = "AI Assistant is not available on this workspace.";
  } else if (error.includes("403") || error.includes("forbidden")) {
    displayError = "AI Assistant requires a premium subscription.";
  } else if (error.includes("network") || error.includes("fetch")) {
    displayError = "Network error. Please check your connection and try again.";
    isRetryable = true;
  } else if (error.includes("401") || error.includes("unauthorized") || error.includes("expired")) {
    displayError = "Session expired. Please log in again.";
  } else if (error.includes("429") || error.includes("rate limit")) {
    displayError = "Too many requests. Please wait a moment and try again.";
  }

  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorText}>{displayError}</Text>
      <View style={styles.errorActions}>
        {isRetryable && (
          <TouchableOpacity onPress={onDismiss}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onDismiss}>
          <Text style={styles.dismissText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AIChatScreen() {
  const { workspaceId } = useLocalSearchParams<{ workspaceId: string }>();
  const credentials = useCreds();
  const [chat, setChat] = useState<AssistantChat | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    fields: { name: string; value: string }[];
    tableName: string;
  }>({ visible: false, title: "", fields: [], tableName: "" });
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadChat();
  }, [workspaceId]);

  async function loadChat() {
    if (!credentials) return;
    try {
      setLoading(true);
      setError(null);
      const chats = await listAssistantChats(credentials, Number(workspaceId));

      // Use existing chat or create placeholder for first chat
      const existingChat = chats[0];
      if (existingChat) {
        setChat(existingChat);
        const msgs = await listAssistantMessages(credentials, existingChat.uuid);
        setMessages([...msgs.results].reverse());
      } else {
        // No chat exists yet - will be created on first message
        setChat(null);
        setMessages([]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load chat");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!credentials || !input.trim() || sending) return;
    if (!chat?.uuid) {
      setError("No assistant chat is available for this workspace yet.");
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setSending(true);
    setError(null);

    try {
      // Add user message optimistically
      const tempUserMsg: AssistantMessage = {
        id: Date.now(),
        message: userMessage,
        role: "user",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMsg]);

      const response = await sendAssistantMessageSimple(
        credentials,
        chat.uuid,
        userMessage,
        {
          workspace: { id: Number(workspaceId), name: "Workspace" },
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        },
      );

      const assistantMessage: AssistantMessage = {
        id: response.id,
        message: response.content,
        role: "assistant",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      setError(err.message || "Failed to send message");
      // Remove optimistic user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  }

  function renderMessage({ item }: { item: AssistantMessage }) {
    const isUser = item.role === "user";
    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        <Text style={[styles.messageText, isUser && styles.userText]}>
          {item.message}
        </Text>
        <Text style={styles.timestamp}>
          {new Date(item.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "AI Assistant",
          headerBackTitle: "Back",
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={100}
      >
        {error && <ErrorBanner error={error} onDismiss={() => setError(null)} />}

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Start a conversation</Text>
              <Text style={styles.emptySubtitle}>
                Ask me to create records, analyze data, or answer questions
                about your workspace.
              </Text>
            </View>
          }
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything..."
            placeholderTextColor="#999"
            multiline
            maxLength={2000}
            editable={!sending}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <ConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        fields={confirmModal.fields}
        tableName={confirmModal.tableName}
        onConfirm={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
        onCancel={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
        onEdit={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorBanner: {
    backgroundColor: "#fee",
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#fcc",
  },
  errorText: {
    color: "#c00",
    flex: 1,
  },
  dismissText: {
    color: "#c00",
    fontWeight: "600",
  },
  messageList: {
    padding: 16,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#333",
  },
  userText: {
    color: "#fff",
  },
  timestamp: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 70,
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Confirmation Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  modalFields: {
    maxHeight: 200,
    marginBottom: 16,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  fieldName: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  modalBtnTextCancel: {
    fontSize: 14,
    color: "#666",
  },
  modalBtnEdit: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
    alignItems: "center",
  },
  modalBtnTextEdit: {
    fontSize: 14,
    color: "#007AFF",
  },
  modalBtnConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  modalBtnTextConfirm: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  // Improved Error Banner
  errorActions: {
    flexDirection: "row",
    gap: 12,
  },
  retryText: {
    color: "#007AFF",
    fontWeight: "600",
  },
});
