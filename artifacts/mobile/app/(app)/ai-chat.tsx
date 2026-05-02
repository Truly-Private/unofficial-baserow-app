import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";
import { useBaserowAI, type ChatMessage } from "@/hooks/useBaserowAI";
import { useAuth } from "@/contexts/AuthContext";

export default function AIChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const router = useRouter();
  const { user } = useAuth();
  
  const params = useLocalSearchParams<{ 
    workspaceId?: string; 
    tableId?: string; 
    tableName?: string 
  }>();

  // Try to get workspaceId from params or fallback to first workspace
  const workspaceId = params.workspaceId ? Number(params.workspaceId) : (user?.first_workspace_id || 1);
  const tableName = params.tableName;

  const [inputText, setInputText] = useState("");
  const [showSessions, setShowSessions] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const {
    chats,
    messages,
    isProcessing,
    currentChatUuid,
    sendMessage,
    selectChat,
    startNewChat,
    isLoading,
  } = useBaserowAI(workspaceId);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim() || isProcessing) return;
    sendMessage(inputText.trim());
    setInputText("");
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.assistantMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isUser ? colors.primary : colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {item.isLoading && !item.content ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text
              style={[
                styles.messageText,
                {
                  color: isUser ? colors.primaryForeground : colors.foreground,
                },
              ]}
            >
              {item.content}
            </Text>
          )}
          {item.error && (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {item.error}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const topPad = Math.max(insets.top, webInsets.top, 16);
  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16);

  if (showSessions) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: topPad + 12,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Pressable onPress={() => setShowSessions(false)} hitSlop={10}>
            <Feather name="x" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Recent Chats
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.sessionsContent}>
          <Pressable
            style={[styles.sessionItem, { borderBottomColor: colors.border }]}
            onPress={() => {
              startNewChat();
              setShowSessions(false);
            }}
          >
            <View style={[styles.newChatIcon, { backgroundColor: colors.primary }]}>
              <Feather name="plus" size={16} color={colors.primaryForeground} />
            </View>
            <Text style={[styles.sessionTitle, { color: colors.primary, fontWeight: '700' }]}>
              Start New Chat
            </Text>
          </Pressable>

          {chats.map((chat) => (
            <Pressable
              key={chat.uuid}
              style={[
                styles.sessionItem,
                { 
                  borderBottomColor: colors.border,
                  backgroundColor: currentChatUuid === chat.uuid ? colors.muted : 'transparent'
                }
              ]}
              onPress={() => {
                selectChat(chat.uuid);
                setShowSessions(false);
              }}
            >
              <Feather name="message-square" size={18} color={colors.mutedForeground} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.sessionTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {chat.title || "Untitled Chat"}
                </Text>
                <Text style={[styles.sessionDate, { color: colors.mutedForeground }]}>
                  {new Date(chat.created_on || chat.created_at || Date.now()).toLocaleDateString()}
                </Text>
              </View>
              {currentChatUuid === chat.uuid && (
                <Feather name="check" size={16} color={colors.primary} />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            AI Assistant
          </Text>
          {tableName && (
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
              {tableName}
            </Text>
          )}
        </View>
        <Pressable onPress={() => setShowSessions(true)} hitSlop={10}>
          <Feather name="list" size={24} color={colors.foreground} />
        </Pressable>
      </View>

      {isLoading && messages.length === 0 ? (
        <LoadingState />
      ) : messages.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconCircle, { backgroundColor: colors.primary + '15' }]}>
            <Feather name="cpu" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Baserow Native AI
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Interact with your workspace using natural language. Ask questions about your data, generate reports, or create new records effortlessly.
          </Text>
          
          <View style={[styles.exampleContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.exampleTitle, { color: colors.foreground }]}>
              Try asking:
            </Text>
            <View style={styles.exampleRow}>
              <Feather name="search" size={14} color={colors.mutedForeground} />
              <Text style={[styles.exampleText, { color: colors.mutedForeground }]}>
                "Who are my top customers by revenue?"
              </Text>
            </View>
            <View style={styles.exampleRow}>
              <Feather name="edit" size={14} color={colors.mutedForeground} />
              <Text style={[styles.exampleText, { color: colors.mutedForeground }]}>
                "Draft a project update based on current tasks."
              </Text>
            </View>
            <View style={styles.exampleRow}>
              <Feather name="plus-circle" size={14} color={colors.mutedForeground} />
              <Text style={[styles.exampleText, { color: colors.mutedForeground }]}>
                "Add a record for 'New Website Launch' on Friday."
              </Text>
            </View>
          </View>

          <Button 
            title="Start Chatting" 
            onPress={() => setInputText("Hello! How can you help me today?")}
            style={{ marginTop: 20 }}
          />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMessage}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 16,
          }}
        />
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: bottomPad + 12,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          maxLength={1000}
          editable={!isProcessing}
          onSubmitEditing={handleSend}
        />
        <Pressable
          onPress={handleSend}
          disabled={!inputText.trim() || isProcessing}
          style={[
            styles.sendButton,
            {
              backgroundColor: inputText.trim() && !isProcessing
                ? colors.primary
                : colors.muted,
            },
          ]}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Feather
              name="send"
              size={20}
              color={
                inputText.trim() ? colors.primaryForeground : colors.mutedForeground
              }
            />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const LoadingState = () => (
  <View style={styles.emptyState}>
    <ActivityIndicator size="large" />
    <Text style={{ marginTop: 12 }}>Loading messages...</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  exampleContainer: {
    width: "100%",
    maxWidth: 400,
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
  },
  exampleTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: "flex-end",
  },
  assistantMessage: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "85%",
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 6,
    color: '#ef4444',
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    maxHeight: 120,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionsContent: {
    flex: 1,
  },
  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  newChatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sessionTitle: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  sessionDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});

