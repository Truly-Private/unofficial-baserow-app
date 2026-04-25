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
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useAuth } from "../../../contexts/AuthContext";
import {
  listAssistantChats,
  listAssistantMessages,
  sendAssistantMessage,
  AssistantChat,
  AssistantMessage,
} from "../../../lib/baserow";

export default function AIChatScreen() {
  const { workspaceId } = useLocalSearchParams<{ workspaceId: string }>();
  const { credentials } = useAuth();
  const [chat, setChat] = useState<AssistantChat | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        const msgs = await listAssistantMessages(
          credentials,
          Number(workspaceId),
          existingChat.id,
        );
        setMessages(msgs.results.reverse());
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

      // If no chat exists, we need to handle chat creation
      // For now, assume the API creates a chat on first message
      // or we use a default chat ID
      const chatId = chat?.id || "default";
      
      const response = await sendAssistantMessage(
        credentials,
        Number(workspaceId),
        chatId,
        userMessage,
      );

      // Add assistant response
      setMessages((prev) => [...prev, response]);
      
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
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

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
});
