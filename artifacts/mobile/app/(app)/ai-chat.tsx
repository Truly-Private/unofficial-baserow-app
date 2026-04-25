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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";
import { useAIChat } from "@/hooks/useAIChat";
import { useAuth } from "@/contexts/AuthContext";
import { createRow } from "@/lib/baserow";

export default function AIChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const router = useRouter();
  const { apiCall } = useAuth();
  const params = useLocalSearchParams<{ tableId?: string; tableName?: string }>();

  const [inputText, setInputText] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const tableId = params.tableId ? Number(params.tableId) : undefined;
  const tableName = params.tableName;

  const {
    messages,
    isProcessing,
    pendingIntent,
    sendMessage,
    confirmCreate,
    cancelAction,
    clearChat,
    initializeAI,
  } = useAIChat({
    tableId,
    tableName,
    onRecordCreate: async (fields) => {
      if (!tableId) {
        throw new Error("No table selected");
      }
      await apiCall((client) => createRow(client, tableId, fields));
    },
  });

  // Initialize AI service when API key is set
  useEffect(() => {
    if (apiKey) {
      initializeAI(apiKey, "openai");
      setShowSettings(false);
    }
  }, [apiKey, initializeAI]);

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

    if (!apiKey) {
      setShowSettings(true);
      return;
    }

    sendMessage(inputText.trim());
    setInputText("");
  };

  const renderMessage = ({ item }: { item: any }) => {
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
          {item.isLoading ? (
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
              Error: {item.error}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const topPad = Math.max(insets.top, webInsets.top, 16);
  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16);

  if (showSettings) {
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
          <Pressable onPress={() => setShowSettings(false)} hitSlop={10}>
            <Feather name="x" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            AI Settings
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.settingsContent}>
          <Text style={[styles.settingsLabel, { color: colors.foreground }]}>
            OpenAI API Key
          </Text>
          <TextInput
            style={[
              styles.settingsInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="sk-..."
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={[styles.settingsHint, { color: colors.mutedForeground }]}>
            Your API key is stored locally and never shared.
          </Text>

          <Button
            title="Save"
            onPress={() => {
              if (apiKey) {
                initializeAI(apiKey, "openai");
                setShowSettings(false);
              }
            }}
            disabled={!apiKey}
            style={styles.saveButton}
          />
        </View>
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
        <Pressable onPress={() => setShowSettings(true)} hitSlop={10}>
          <Feather name="settings" size={24} color={colors.foreground} />
        </Pressable>
      </View>

      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="message-circle" size={64} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            AI-Powered Record Creation
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Describe what you want to create in natural language, and I'll help you
            add it to your table.
          </Text>
          <View style={styles.exampleContainer}>
            <Text style={[styles.exampleTitle, { color: colors.foreground }]}>
              Try saying:
            </Text>
            <Text style={[styles.exampleText, { color: colors.mutedForeground }]}>
              • "Add a new task: Review Q4 budget"
            </Text>
            <Text style={[styles.exampleText, { color: colors.mutedForeground }]}>
              • "Create customer John Smith, email john@example.com"
            </Text>
            <Text style={[styles.exampleText, { color: colors.mutedForeground }]}>
              • "Schedule meeting tomorrow at 2pm"
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 16,
          }}
        />
      )}

      {pendingIntent && (
        <View
          style={[
            styles.actionBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.actionText, { color: colors.foreground }]}>
            Confirm action?
          </Text>
          <View style={styles.actionButtons}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={cancelAction}
              style={styles.actionButton}
            />
            <Button
              title="Create"
              onPress={confirmCreate}
              style={styles.actionButton}
            />
          </View>
        </View>
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
          maxLength={500}
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
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    marginTop: 24,
    marginBottom: 12,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  exampleContainer: {
    width: "100%",
    maxWidth: 400,
  },
  exampleTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  exampleText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
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
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  actionText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    minWidth: 80,
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
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsContent: {
    padding: 24,
  },
  settingsLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },
  settingsInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  settingsHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
    marginBottom: 24,
  },
  saveButton: {
    marginTop: 16,
  },
});
